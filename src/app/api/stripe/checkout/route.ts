import { NextRequest, NextResponse } from 'next/server';
import { createPremiumCheckout, createSubscriptionCheckout } from '@/services/stripe-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, userId, userEmail, creatorId, creatorName, price } = body;

        if (!userId || !userEmail) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        let checkoutUrl: string;

        if (type === 'premium') {
            // Create premium plan checkout
            checkoutUrl = await createPremiumCheckout(userId, userEmail);
        } else if (type === 'subscription') {
            // Create creator subscription checkout
            if (!creatorId || !creatorName || !price) {
                return NextResponse.json(
                    { error: 'Missing subscription details' },
                    { status: 400 }
                );
            }
            checkoutUrl = await createSubscriptionCheckout(
                userId,
                userEmail,
                creatorId,
                creatorName,
                price
            );
        } else {
            return NextResponse.json(
                { error: 'Invalid checkout type' },
                { status: 400 }
            );
        }

        return NextResponse.json({ url: checkoutUrl });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
