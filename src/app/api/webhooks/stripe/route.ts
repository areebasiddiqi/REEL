import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing stripe signature' },
                { status: 400 }
            );
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json(
                { error: 'Webhook signature verification failed' },
                { status: 400 }
            );
        }

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;

                if (userId && session.subscription) {
                    // Update user subscription status in Firestore
                    await updateDoc(doc(db, 'users', userId), {
                        subscriptionTier: getTierFromPriceId(session.line_items?.data[0]?.price?.id),
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: session.subscription,
                    });
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                // Handle subscription updates
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                // Handle subscription cancellation
                const userId = subscription.metadata?.userId;

                if (userId) {
                    await updateDoc(doc(db, 'users', userId), {
                        subscriptionTier: null,
                        stripeSubscriptionId: null,
                    });
                }
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
            { status: 500 }
        );
    }
}

// Helper function to map price ID to tier
function getTierFromPriceId(priceId?: string): 'basic' | 'pro' | 'premium' | null {
    if (!priceId) return null;

    const tierMap: Record<string, 'basic' | 'pro' | 'premium'> = {
        [process.env.STRIPE_PRICE_BASIC!]: 'basic',
        [process.env.STRIPE_PRICE_PRO!]: 'pro',
        [process.env.STRIPE_PRICE_PREMIUM!]: 'premium',
    };

    return tierMap[priceId] || null;
}
