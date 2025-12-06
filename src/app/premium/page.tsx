'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Check, Crown, Zap, Video, Radio, Trophy } from 'lucide-react';

export default function PremiumPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!loading && !user) {
        router.push('/login');
        return null;
    }

    const handleUpgrade = async () => {
        if (!user) return;

        try {
            setIsProcessing(true);

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'premium',
                    userId: user.uid,
                    userEmail: user.email,
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error: any) {
            console.error('Error creating checkout:', error);
            alert(error.message || 'Failed to start checkout');
            setIsProcessing(false);
        }
    };

    const features = [
        {
            icon: Video,
            title: 'Premium Videos',
            description: 'Access exclusive premium content from your favorite creators',
        },
        {
            icon: Radio,
            title: 'Premium Livestreams',
            description: 'Join exclusive live sessions and interact with creators',
        },
        {
            icon: Trophy,
            title: 'Premium Challenges',
            description: 'Participate in exclusive challenges with bigger rewards',
        },
        {
            icon: Crown,
            title: 'Creator Subscriptions',
            description: 'Subscribe to creators and support their work directly',
        },
        {
            icon: Zap,
            title: 'Early Access',
            description: 'Get early access to new features and content',
        },
    ];

    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <Header onMenuToggle={setIsSidebarOpen} />
            <div className="flex">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto px-4 py-12">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <Crown className="w-12 h-12 text-yellow-500" />
                            </div>
                            <h1 className="text-5xl font-bold mb-4 gradient-text">
                                Upgrade to Premium
                            </h1>
                            <p className="text-xl text-[hsl(var(--foreground-muted))]">
                                Unlock exclusive content and support your favorite creators
                            </p>
                        </div>

                        {/* Pricing Card */}
                        <div className="glass-card p-8 mb-12 border-2 border-[hsl(var(--primary))]">
                            <div className="text-center mb-8">
                                <div className="text-6xl font-bold mb-2">$100</div>
                                <div className="text-[hsl(var(--foreground-muted))]">per month</div>
                            </div>

                            <button
                                onClick={handleUpgrade}
                                disabled={isProcessing || user?.premiumPlan === 'premium'}
                                className="w-full btn btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    'Processing...'
                                ) : user?.premiumPlan === 'premium' ? (
                                    <>
                                        <Check className="w-5 h-5 mr-2" />
                                        Already Premium
                                    </>
                                ) : (
                                    <>
                                        <Crown className="w-5 h-5 mr-2" />
                                        Upgrade Now
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Features */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold mb-6 text-center">What's Included</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {features.map((feature, index) => (
                                    <div key={index} className="glass-card p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-[hsl(var(--primary))]/20 rounded-lg">
                                                <feature.icon className="w-6 h-6 text-[hsl(var(--primary))]" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold mb-1">{feature.title}</h3>
                                                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FAQ */}
                        <div className="glass-card p-8">
                            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold mb-2">Can I cancel anytime?</h3>
                                    <p className="text-[hsl(var(--foreground-muted))]">
                                        Yes, you can cancel your premium subscription at any time from your account settings.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2">What payment methods do you accept?</h3>
                                    <p className="text-[hsl(var(--foreground-muted))]">
                                        We accept all major credit cards through Stripe's secure payment processing.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2">Do I need premium to create content?</h3>
                                    <p className="text-[hsl(var(--foreground-muted))]">
                                        No, anyone can create content. Premium is only required to offer paid subscriptions to your audience.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
