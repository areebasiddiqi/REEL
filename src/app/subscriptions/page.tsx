'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Users, Calendar, DollarSign, X } from 'lucide-react';
import { getUserSubscriptions } from '@/services/subscription-service';
import { getCreatorSubscription } from '@/services/subscription-service';
import { cancelSubscription } from '@/services/stripe-service';
import { UserSubscription, CreatorSubscription } from '@/types';

interface SubscriptionWithCreator extends UserSubscription {
    creatorName?: string;
    creatorPhoto?: string;
    subscriptionDetails?: CreatorSubscription;
}

export default function SubscriptionsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [subscriptions, setSubscriptions] = useState<SubscriptionWithCreator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cancelingId, setCancelingId] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchSubscriptions = async () => {
            if (!user) return;

            try {
                setIsLoading(true);
                const subs = await getUserSubscriptions(user.uid);

                // Fetch creator details for each subscription
                const subsWithDetails = await Promise.all(
                    subs.map(async (sub) => {
                        const creatorSub = sub.creatorId ? await getCreatorSubscription(sub.creatorId) : null;
                        return {
                            ...sub,
                            creatorName: creatorSub?.creatorName,
                            subscriptionDetails: creatorSub || undefined,
                        };
                    })
                );

                setSubscriptions(subsWithDetails);
            } catch (error) {
                console.error('Error fetching subscriptions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchSubscriptions();
        }
    }, [user]);

    const handleCancel = async (subscriptionId: string, creatorId: string | undefined) => {
        if (!creatorId) {
            alert('Invalid creator ID');
            return;
        }

        if (!confirm('Are you sure you want to cancel this subscription?')) {
            return;
        }

        try {
            setCancelingId(creatorId);
            await cancelSubscription(subscriptionId);

            // Remove from local state
            setSubscriptions(prev => prev.filter(s => s.creatorId !== creatorId));
        } catch (error: any) {
            console.error('Error canceling subscription:', error);
            alert(error.message || 'Failed to cancel subscription');
        } finally {
            setCancelingId(null);
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
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="w-10 h-10 text-[hsl(var(--primary))]" />
                                <h1 className="text-4xl font-bold">My Subscriptions</h1>
                            </div>
                            <p className="text-[hsl(var(--foreground-muted))]">
                                Manage your creator subscriptions
                            </p>
                        </div>

                        {/* Subscriptions List */}
                        {subscriptions.length > 0 ? (
                            <div className="space-y-4">
                                {subscriptions.map((sub) => (
                                    <div key={sub.id} className="glass-card p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <img
                                                    src={sub.creatorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.creatorId}`}
                                                    alt={sub.creatorName || 'Creator'}
                                                    className="w-16 h-16 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg mb-1">
                                                        {sub.creatorName || 'Creator'}
                                                    </h3>
                                                    {sub.subscriptionDetails && (
                                                        <p className="text-sm text-[hsl(var(--foreground-muted))] mb-3">
                                                            {sub.subscriptionDetails.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-sm text-[hsl(var(--foreground-subtle))]">
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign className="w-4 h-4" />
                                                            ${(sub.subscriptionDetails?.price || 0) / 100}/month
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            Renews {sub.currentPeriodEnd.toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${sub.status === 'active'
                                                                ? 'bg-green-500/20 text-green-500'
                                                                : 'bg-red-500/20 text-red-500'
                                                            }`}>
                                                            {sub.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => router.push(`/profile/${sub.creatorId}`)}
                                                    className="btn btn-secondary"
                                                >
                                                    View Profile
                                                </button>
                                                {sub.status === 'active' && (
                                                    <button
                                                        onClick={() => handleCancel(sub.subscriptionId, sub.creatorId)}
                                                        disabled={cancelingId === sub.creatorId}
                                                        className="btn bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                                                    >
                                                        {cancelingId === sub.creatorId ? (
                                                            'Canceling...'
                                                        ) : (
                                                            <>
                                                                <X className="w-4 h-4 mr-2" />
                                                                Cancel
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 glass-card">
                                <Users className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                                <p className="text-[hsl(var(--foreground-muted))] text-lg mb-4">
                                    No active subscriptions
                                </p>
                                <button
                                    onClick={() => router.push('/creators')}
                                    className="btn btn-primary"
                                >
                                    Discover Creators
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
