'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase.config';
import { User } from '@/types';
import {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    logout,
    getUserData,
} from '@/services/auth-service';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInGoogle: () => Promise<void>;
    signInApple: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Get user data from Firebase Auth
                const userData = await getUserData(firebaseUser.uid);
                
                if (userData) {
                    setUser(userData);
                } else {
                    // Fallback to Firebase Auth data
                    const fallbackUser: User = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email!,
                        displayName: firebaseUser.displayName || 'User',
                        photoURL: firebaseUser.photoURL || undefined,
                        role: 'viewer',
                        followers: 0,
                        following: 0,
                        points: 0,
                        createdAt: new Date(),
                    };
                    setUser(fallbackUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, displayName: string) => {
        try {
            const userData = await signUpWithEmail(email, password, displayName);
            setUser(userData);
        } catch (error: any) {
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const userData = await signInWithEmail(email, password);
            setUser(userData);
        } catch (error: any) {
            throw error;
        }
    };

    const signInGoogle = async () => {
        try {
            const userData = await signInWithGoogle();
            setUser(userData);
        } catch (error: any) {
            throw error;
        }
    };

    const signInApple = async () => {
        try {
            const userData = await signInWithApple();
            setUser(userData);
        } catch (error: any) {
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await logout();
            setUser(null);
        } catch (error: any) {
            throw error;
        }
    };

    const value = {
        user,
        loading,
        signUp,
        signIn,
        signInGoogle,
        signInApple,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
