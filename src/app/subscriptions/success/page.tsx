'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function SubscriptionSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.push('/subscriptions');
        }, 3000);

        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
            <div className="text-center max-w-md px-4">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h1 className="text-4xl font-bold mb-4">Subscription Active!</h1>
                <p className="text-[hsl(var(--foreground-muted))] mb-6">
                    You're now subscribed! Enjoy exclusive content from your favorite creator.
                </p>
                <p className="text-sm text-[hsl(var(--foreground-subtle))]">
                    Redirecting to subscriptions...
                </p>
            </div>
        </div>
    );
}
