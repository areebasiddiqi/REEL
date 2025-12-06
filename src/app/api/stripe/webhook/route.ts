import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature } from '@/services/stripe-service';
import { subscribeUserToCreator, unsubscribeUserFromCreator } from '@/services/subscription-service';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase.config';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        // Verify webhook signature
        const event = verifyWebhookSignature(body, signature);

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

    if (type === 'premium_plan') {
        // Activate premium plan
        const userRef = doc(db, 'users', userId);
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

        await updateDoc(userRef, {
            premiumPlan: 'premium',
            premiumExpiresAt: Timestamp.fromDate(expiresAt),
            stripeCustomerId: session.customer as string,
        });

        console.log(`Premium plan activated for user ${userId}`);
    } else if (type === 'creator_subscription') {
        // Activate creator subscription
        const creatorId = session.metadata?.creatorId;
        if (!creatorId) {
            console.error('No creatorId in session metadata');
            return;
        }

        await subscribeUserToCreator(
            userId,
            creatorId,
            session.subscription as string
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
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
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
    const subscriptionRef = doc(db, 'users', userId, 'subscriptions', creatorId);
    await updateDoc(subscriptionRef, {
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
