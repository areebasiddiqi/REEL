import Stripe from 'stripe';

// Lazy initialize Stripe with secret key
let stripe: Stripe | null = null;

const getStripe = (): Stripe => {
    if (!stripe) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY environment variable is not set');
        }
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-02-24.acacia',
        });
    }
    return stripe;
};

const PREMIUM_PLAN_PRICE = 10000; // $100.00 in cents
const PLATFORM_FEE_PERCENT = 20; // 20% platform fee

// Helper to get base URL with fallback
const getBaseUrl = (): string => {
    // Check for environment variable first
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // Fallback to Vercel URL if available
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    
    // Development fallback
    return 'http://localhost:3000';
};

// Create Checkout Session for Premium Plan
export const createPremiumCheckout = async (
    userId: string,
    userEmail: string
): Promise<string> => {
    try {
        const session = await getStripe().checkout.sessions.create({
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
            success_url: `${getBaseUrl()}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${getBaseUrl()}/premium`,
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

        const session = await getStripe().checkout.sessions.create({
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
            success_url: `${getBaseUrl()}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${getBaseUrl()}/profile/${creatorId}`,
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
        await getStripe().subscriptions.cancel(subscriptionId);
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
        const subscriptions = await getStripe().subscriptions.list({
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
        return getStripe().webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('Webhook signature verification failed:', error);
        throw new Error('Invalid signature');
    }
};

export { getStripe };
