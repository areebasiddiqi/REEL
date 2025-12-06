import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
});

const PREMIUM_PLAN_PRICE = 10000; // $100.00 in cents
const PLATFORM_FEE_PERCENT = 20; // 20% platform fee

// Create Checkout Session for Premium Plan
export const createPremiumCheckout = async (
    userId: string,
    userEmail: string
): Promise<string> => {
    try {
        const session = await stripe.checkout.sessions.create({
            customer_email: userEmail,
            client_reference_id: userId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'ReelTalk Premium',
                            description: 'Access premium videos, livestreams, and challenges',
                        },
                        unit_amount: PREMIUM_PLAN_PRICE,
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium`,
            metadata: {
                userId,
                type: 'premium_plan',
            },
        });

        return session.url!;
    } catch (error: any) {
        console.error('Error creating premium checkout:', error);
        throw new Error(error.message || 'Failed to create checkout session');
    }
};

// Create Checkout Session for Creator Subscription
export const createSubscriptionCheckout = async (
    userId: string,
    userEmail: string,
    creatorId: string,
    creatorName: string,
    price: number // Price in cents
): Promise<string> => {
    try {
        // Calculate platform fee
        const platformFee = Math.round(price * (PLATFORM_FEE_PERCENT / 100));

        const session = await stripe.checkout.sessions.create({
            customer_email: userEmail,
            client_reference_id: userId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${creatorName}'s Subscription`,
                            description: `Monthly subscription to ${creatorName}'s exclusive content`,
                        },
                        unit_amount: price,
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${creatorId}`,
            metadata: {
                userId,
                creatorId,
                type: 'creator_subscription',
                platformFee: platformFee.toString(),
            },
        });

        return session.url!;
    } catch (error: any) {
        console.error('Error creating subscription checkout:', error);
        throw new Error(error.message || 'Failed to create checkout session');
    }
};

// Cancel Subscription
export const cancelSubscription = async (
    subscriptionId: string
): Promise<void> => {
    try {
        await stripe.subscriptions.cancel(subscriptionId);
    } catch (error: any) {
        console.error('Error canceling subscription:', error);
        throw new Error(error.message || 'Failed to cancel subscription');
    }
};

// Get Customer Subscriptions
export const getCustomerSubscriptions = async (
    customerId: string
): Promise<Stripe.Subscription[]> => {
    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
        });
        return subscriptions.data;
    } catch (error: any) {
        console.error('Error fetching subscriptions:', error);
        return [];
    }
};

// Verify Webhook Signature
export const verifyWebhookSignature = (
    payload: string | Buffer,
    signature: string
): Stripe.Event => {
    try {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('Webhook signature verification failed:', error);
        throw new Error('Invalid signature');
    }
};

export { stripe };
