import { User, UserSubscription } from '@/types';

// Check if user has access to premium content
export const hasAccessToPremiumContent = (
    user: User | null,
    requiredTier?: 'basic' | 'pro' | 'premium'
): boolean => {
    if (!requiredTier) {
        return true; // Content is free
    }

    if (!user) {
        return false; // User not logged in
    }

    if (!user.subscriptionTier) {
        return false; // User has no subscription
    }

    const tierLevels = {
        basic: 1,
        pro: 2,
        premium: 3,
    };

    return tierLevels[user.subscriptionTier] >= tierLevels[requiredTier];
};

// Check if user has active subscription
export const hasActiveSubscription = (subscription: UserSubscription | null): boolean => {
    if (!subscription) {
        return false;
    }

    return subscription.status === 'active' && new Date(subscription.currentPeriodEnd) > new Date();
};

// Get subscription tier name
export const getSubscriptionTierName = (tier: 'basic' | 'pro' | 'premium'): string => {
    const names = {
        basic: 'Basic',
        pro: 'Pro',
        premium: 'Premium',
    };

    return names[tier];
};

// Get subscription tier price
export const getSubscriptionTierPrice = (tier: 'basic' | 'pro' | 'premium'): number => {
    const prices = {
        basic: 10,
        pro: 100,
        premium: 200,
    };

    return prices[tier];
};
