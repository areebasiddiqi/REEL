'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Crown, DollarSign, Users, Save, X } from 'lucide-react';
import { getCreatorSubscription, createCreatorSubscription, updateCreatorSubscription } from '@/services/subscription-service';
import { CreatorSubscription } from '@/types';
import PremiumBadge from '@/components/PremiumBadge';

export default function CreatorSubscriptionPage() {
    const { user, loading, refreshUser } = useAuth();
    const router = useRouter();
    const premiumCheckRef = useRef(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [subscription, setSubscription] = useState<CreatorSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        price: '',
        description: '',
        benefits: [''] as string[],
        active: true,
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        if (!loading && user && !premiumCheckRef.current) {
            premiumCheckRef.current = true;
            
            if (user.premiumPlan !== 'premium') {
                console.log('User premium plan:', user.premiumPlan);
                // Refresh user data to check for recent premium purchase
                refreshUser().then((updatedUser) => {
                    // Check if updated user has premium
                    if (!updatedUser || updatedUser.premiumPlan !== 'premium') {
                        router.push('/premium');
                    }
                });
            }
        }
    }, [user, loading, refreshUser, router]);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user) return;

            try {
                setIsLoading(true);
                const sub = await getCreatorSubscription(user.uid);

                if (sub) {
                    setSubscription(sub);
                    setFormData({
                        price: (sub.price / 100).toString(),
                        description: sub.description,
                        benefits: sub.benefits.length > 0 ? sub.benefits : [''],
                        active: sub.active,
                    });
                }
            } catch (err: any) {
                console.error('Error fetching subscription:', err);
            } finally {
                setIsLoading(false);
            }
        };

        // Run for any logged-in user
        if (user) {
            fetchSubscription();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const handleBenefitChange = (index: number, value: string) => {
        const newBenefits = [...formData.benefits];
        newBenefits[index] = value;
        setFormData(prev => ({ ...prev, benefits: newBenefits }));
    };

    const addBenefit = () => {
        setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }));
    };

    const removeBenefit = (index: number) => {
        setFormData(prev => ({
            ...prev,
            benefits: prev.benefits.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!user) return;

        // Validation
        const price = parseFloat(formData.price);
        if (isNaN(price) || price < 1) {
            setError('Price must be at least $1');
            return;
        }

        if (!formData.description.trim()) {
            setError('Description is required');
            return;
        }

        const validBenefits = formData.benefits.filter(b => b.trim());
        if (validBenefits.length === 0) {
            setError('At least one benefit is required');
            return;
        }

        try {
            setIsSaving(true);
            const priceInCents = Math.round(price * 100);

            if (subscription) {
                // Update existing subscription
                await updateCreatorSubscription(user.uid, {
                    price: priceInCents,
                    description: formData.description,
                    benefits: validBenefits,
                    active: formData.active,
                });
            } else {
                // Create new subscription
                await createCreatorSubscription(
                    user.uid,
                    user.displayName || 'Creator',
                    priceInCents,
                    formData.description,
                    validBenefits
                );
            }

            setSuccess(true);
            setTimeout(() => router.push(`/profile/${user.uid}`), 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to save subscription');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <Header onMenuToggle={setIsSidebarOpen} />
            <div className="flex">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-auto">
                    <div className="max-w-3xl mx-auto px-4 py-8">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Crown className="w-10 h-10 text-yellow-500" />
                                <h1 className="text-4xl font-bold">Creator Subscription</h1>
                            </div>
                            <p className="text-[hsl(var(--foreground-muted))]">
                                Set up your subscription offering and monetize your content
                            </p>
                            {subscription && (
                                <div className="mt-4 p-4 bg-[hsl(var(--surface))] rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-[hsl(var(--foreground-muted))]">Subscribers</div>
                                            <div className="text-2xl font-bold">{subscription.subscriberCount}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[hsl(var(--foreground-muted))]">Monthly Revenue (80%)</div>
                                            <div className="text-2xl font-bold">
                                                ${((subscription.price * subscription.subscriberCount * 0.8) / 100).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Success/Error Messages */}
                        {success && (
                            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500">
                                ✓ Subscription saved successfully! Redirecting...
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="glass-card p-8 space-y-6">
                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Monthly Price (USD) *
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--foreground-subtle))]" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="1"
                                            value={formData.price}
                                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                            className="input w-full pl-10"
                                            placeholder="9.99"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">
                                        You'll receive 80% (platform takes 20% fee)
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="input w-full resize-none"
                                        rows={4}
                                        placeholder="Describe what subscribers will get..."
                                        required
                                    />
                                </div>

                                {/* Benefits */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Benefits *
                                    </label>
                                    <div className="space-y-3">
                                        {formData.benefits.map((benefit, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={benefit}
                                                    onChange={(e) => handleBenefitChange(index, e.target.value)}
                                                    className="input flex-1"
                                                    placeholder="e.g., Exclusive videos"
                                                />
                                                {formData.benefits.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBenefit(index)}
                                                        className="btn btn-secondary px-3"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addBenefit}
                                            className="btn btn-secondary w-full"
                                        >
                                            + Add Benefit
                                        </button>
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                <div className="p-4 bg-[hsl(var(--surface))] rounded-lg">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                            className="w-5 h-5 rounded"
                                        />
                                        <div>
                                            <div className="font-medium">Active</div>
                                            <p className="text-sm text-[hsl(var(--foreground-subtle))]">
                                                Allow new subscribers to join
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex-1 btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 btn btn-primary disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save Subscription'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
