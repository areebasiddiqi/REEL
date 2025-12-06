'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, User, Chrome, Apple as AppleIcon } from 'lucide-react';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUp, signInGoogle, signInApple } = useAuth();
    const router = useRouter();

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signUp(email, password, displayName);
            router.push('/live');
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        setLoading(true);

        try {
            await signInGoogle();
            router.push('/live');
        } catch (err: any) {
            setError(err.message || 'Failed to sign up with Google');
        } finally {
            setLoading(false);
        }
    };

    const handleAppleSignup = async () => {
        setError('');
        setLoading(true);

        try {
            await signInApple();
            router.push('/live');
        } catch (err: any) {
            setError(err.message || 'Failed to sign up with Apple');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--surface))] to-[hsl(var(--background))]">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold gradient-text mb-2">ReelTalk</h1>
                    <p className="text-[hsl(var(--foreground-muted))]">Create your account</p>
                </div>

                {/* Main Card */}
                <div className="glass-card p-8">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-[hsl(var(--error))]/10 border border-[hsl(var(--error))]/30 text-[hsl(var(--error))]">
                            {error}
                        </div>
                    )}

                    {/* OAuth Buttons */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            className="w-full btn btn-secondary flex items-center justify-center gap-3"
                        >
                            <Chrome className="w-5 h-5" />
                            Continue with Google
                        </button>

                        <button
                            onClick={handleAppleSignup}
                            disabled={loading}
                            className="w-full btn btn-secondary flex items-center justify-center gap-3"
                        >
                            <AppleIcon className="w-5 h-5" />
                            Continue with Apple
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[hsl(var(--border))]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))]">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Display Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--foreground-subtle))]" />
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="input pl-11"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--foreground-subtle))]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input pl-11"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--foreground-subtle))]" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-11"
                                    placeholder="Create a password"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <p className="mt-6 text-center text-sm text-[hsl(var(--foreground-muted))]">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[hsl(var(--primary))] hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Terms */}
                <p className="mt-6 text-center text-xs text-[hsl(var(--foreground-subtle))]">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
