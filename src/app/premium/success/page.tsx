'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

function PremiumSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Redirect to home after 3 seconds
        const timeout = setTimeout(() => {
            router.push('/live');
        }, 3000);

        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
            <div className="text-center max-w-md px-4">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h1 className="text-4xl font-bold mb-4">Welcome to Premium!</h1>
                <p className="text-[hsl(var(--foreground-muted))] mb-6">
                    Your premium subscription is now active. Enjoy exclusive content and features!
                </p>
                <p className="text-sm text-[hsl(var(--foreground-subtle))]">
                    Redirecting to dashboard...
                </p>
            </div>
        </div>
    );
}

export default function PremiumSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        }>
            <PremiumSuccessContent />
        </Suspense>
    );
}
