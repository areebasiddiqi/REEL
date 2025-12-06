'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Video, Radio, Trophy, Users, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/live');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--surface))] to-[hsl(var(--background))]">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-[hsl(var(--secondary))]/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
                    <div className="mb-6">
                        <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium mb-6">
                            <Sparkles className="inline w-4 h-4 mr-2" />
                            The Future of Live Content
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-bold mb-6">
                        <span className="gradient-text">ReelTalk</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-[hsl(var(--foreground-muted))] mb-12 max-w-3xl mx-auto">
                        Stream live, upload videos, create challenges, and build your community with premium subscriptions
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/signup" className="btn btn-primary text-lg px-8 py-4">
                            Get Started Free
                            <ArrowRight className="inline ml-2 w-5 h-5" />
                        </Link>
                        <Link href="/login" className="btn btn-secondary text-lg px-8 py-4">
                            Sign In
                        </Link>
                    </div>

                    {/* Feature Icons */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="glass-card p-6 hover:scale-105 transition-transform">
                            <Radio className="w-8 h-8 text-[hsl(var(--primary))] mx-auto mb-3" />
                            <h3 className="font-semibold mb-1">Live Streaming</h3>
                            <p className="text-sm text-[hsl(var(--foreground-muted))]">Go live instantly</p>
                        </div>

                        <div className="glass-card p-6 hover:scale-105 transition-transform">
                            <Video className="w-8 h-8 text-[hsl(var(--secondary))] mx-auto mb-3" />
                            <h3 className="font-semibold mb-1">Video Upload</h3>
                            <p className="text-sm text-[hsl(var(--foreground-muted))]">Share your content</p>
                        </div>

                        <div className="glass-card p-6 hover:scale-105 transition-transform">
                            <Trophy className="w-8 h-8 text-[hsl(var(--accent))] mx-auto mb-3" />
                            <h3 className="font-semibold mb-1">Challenges</h3>
                            <p className="text-sm text-[hsl(var(--foreground-muted))]">Compete & win</p>
                        </div>

                        <div className="glass-card p-6 hover:scale-105 transition-transform">
                            <Users className="w-8 h-8 text-[hsl(var(--success))] mx-auto mb-3" />
                            <h3 className="font-semibold mb-1">Memberships</h3>
                            <p className="text-sm text-[hsl(var(--foreground-muted))]">Support creators</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Choose Your <span className="gradient-text">Plan</span>
                        </h2>
                        <p className="text-xl text-[hsl(var(--foreground-muted))]">
                            Unlock premium features and support the platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Basic */}
                        <div className="card-hover">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold mb-2">Basic</h3>
                                <div className="text-4xl font-bold gradient-text mb-2">$10</div>
                                <p className="text-[hsl(var(--foreground-muted))]">per month</p>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    HD streaming
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    Unlimited uploads
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    Join challenges
                                </li>
                            </ul>
                            <Link href="/signup" className="btn btn-secondary w-full">
                                Get Started
                            </Link>
                        </div>

                        {/* Pro */}
                        <div className="card-hover relative border-2 border-[hsl(var(--primary))]">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-sm font-medium">
                                Popular
                            </div>
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                                <div className="text-4xl font-bold gradient-text mb-2">$100</div>
                                <p className="text-[hsl(var(--foreground-muted))]">per month</p>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    Everything in Basic
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    4K streaming
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    Create challenges
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    Priority support
                                </li>
                            </ul>
                            <Link href="/signup" className="btn btn-primary w-full">
                                Get Started
                            </Link>
                        </div>

                        {/* Premium */}
                        <div className="card-hover">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                                <div className="text-4xl font-bold gradient-text mb-2">$200</div>
                                <p className="text-[hsl(var(--foreground-muted))]">per month</p>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    Everything in Pro
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    Exclusive content
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    Custom branding
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                                    </div>
                                    Analytics dashboard
                                </li>
                            </ul>
                            <Link href="/signup" className="btn btn-secondary w-full">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
