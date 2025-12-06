'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase.config';
import { collection, getDocs } from 'firebase/firestore';

export default function FirebaseTest() {
    const [status, setStatus] = useState<string>('Testing Firebase connection...');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const testConnection = async () => {
            try {
                // Try to read from a test collection
                const testRef = collection(db, 'test');
                await getDocs(testRef);
                setStatus('✅ Firebase connected successfully!');
            } catch (err: any) {
                setError(err.message || 'Unknown error');
                setStatus('❌ Firebase connection failed');
                console.error('Firebase error:', err);
            }
        };

        testConnection();
    }, []);

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Firebase Connection Test</h1>
            <div className="glass-card p-6">
                <p className="text-lg mb-2">{status}</p>
                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm font-mono text-red-400">{error}</p>
                    </div>
                )}
                <div className="mt-6 text-sm text-[hsl(var(--foreground-muted))]">
                    <p className="mb-2">Environment variables loaded:</p>
                    <ul className="space-y-1 font-mono text-xs">
                        <li>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</li>
                        <li>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing'}</li>
                        <li>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
