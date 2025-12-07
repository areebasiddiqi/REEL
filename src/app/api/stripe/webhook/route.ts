import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature } from '@/services/stripe-service';
import { unsubscribeUserFromCreator } from '@/services/subscription-service';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';

// Helper function to create notification via admin SDK
async function createNotificationAdmin(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string
) {
    try {
        const notificationRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('notifications')
            .doc();

        await notificationRef.set({
            id: notificationRef.id,
            userId,
            type,
            title,
            message,
            link: link || '',
            read: false,
            createdAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        // In development, you can skip signature verification for testing
        const isDevelopment = process.env.NODE_ENV === 'development';

        let event: Stripe.Event;

        if (isDevelopment && !process.env.STRIPE_WEBHOOK_SECRET) {
            // Development mode without webhook secret - parse event directly
            console.warn('⚠️ Webhook signature verification skipped (development mode)');
            event = JSON.parse(body);
        } else {
            // Production mode or development with webhook secret - verify signature
            if (!signature) {
                return NextResponse.json(
                    { error: 'Missing signature' },
                    { status: 400 }
                );
            }

            // Verify webhook signature
            event = verifyWebhookSignature(body, signature);
        }

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentFailed(invoice);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: error.message || 'Webhook handler failed' },
            { status: 400 }
        );
    }
}

// Handle successful checkout
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const type = session.metadata?.type;

    if (!userId) {
        console.error('No userId in session metadata');
        return;
    }

    if (type === 'premium' || type === 'premium_plan') {
        // Activate premium plan
        const userRef = adminDb.collection('users').doc(userId);
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

        await userRef.update({
            premiumPlan: 'premium',
            premiumExpiresAt: Timestamp.fromDate(expiresAt),
            stripeCustomerId: session.customer as string,
        });

        // Create notification for premium plan purchase
        await createNotificationAdmin(
            userId,
            'payment',
            'Premium Plan Activated',
            'Welcome to ReelTalk Premium! You now have access to exclusive content.',
            '/premium'
        );

        console.log(`Premium plan activated for user ${userId}`);
    } else if (type === 'creator_subscription') {
        // Activate creator subscription
        const creatorId = session.metadata?.creatorId;
        if (!creatorId) {
            console.error('No creatorId in session metadata');
            return;
        }

        // Get creator name for notification
        const creatorDoc = await adminDb.collection('users').doc(creatorId).get();
        const creatorName = creatorDoc.data()?.displayName || 'Creator';

        // Use admin SDK to create subscription
        const subscription = {
            userId,
            creatorId,
            subscriptionId: session.subscription as string,
            status: 'active',
            currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            createdAt: Timestamp.now(),
        };

        await adminDb
            .collection('users')
            .doc(userId)
            .collection('subscriptions')
            .doc(creatorId)
            .set(subscription);

        // Increment subscriber count
        const creatorSubRef = adminDb.collection('creatorSubscriptions').doc(creatorId);
        const creatorSubDoc = await creatorSubRef.get();
        if (creatorSubDoc.exists) {
            await creatorSubRef.update({
                subscriberCount: (creatorSubDoc.data()?.subscriberCount || 0) + 1,
            });
        }

        // Create notification for subscriber
        await createNotificationAdmin(
            userId,
            'payment',
            'Subscription Confirmed',
            `You are now subscribed to ${creatorName}. Enjoy exclusive content!`,
            `/profile/${creatorId}`
        );

        // Create notification for creator
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userName = userDoc.data()?.displayName || 'A user';
        await createNotificationAdmin(
            creatorId,
            'payment',
            'New Subscriber',
            `${userName} subscribed to your channel!`,
            `/subscriptions`
        );

        console.log(`User ${userId} subscribed to creator ${creatorId}`);
    }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata;
    const userId = metadata?.userId;
    const type = metadata?.type;

    if (!userId) {
        console.error('No userId in subscription metadata');
        return;
    }

    if (type === 'premium_plan') {
        // Deactivate premium plan
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({
            premiumPlan: 'free',
            premiumExpiresAt: null,
        });

        console.log(`Premium plan deactivated for user ${userId}`);
    } else if (type === 'creator_subscription') {
        const creatorId = metadata?.creatorId;
        if (!creatorId) {
            console.error('No creatorId in subscription metadata');
            return;
        }

        await unsubscribeUserFromCreator(userId, creatorId);
        console.log(`User ${userId} unsubscribed from creator ${creatorId}`);
    }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata;
    const userId = metadata?.userId;
    const creatorId = metadata?.creatorId;

    if (!userId || !creatorId) {
        return;
    }

    // Update subscription status in Firestore
    const subscriptionRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('subscriptions')
        .doc(creatorId);

    await subscriptionRef.update({
        status: subscription.status,
        currentPeriodEnd: Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
    });

    console.log(`Subscription updated for user ${userId}`);
}

// Handle payment failures
async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscription = invoice.subscription;
    if (!subscription) return;

    // You could send an email notification here
    console.log(`Payment failed for subscription ${subscription}`);
}
