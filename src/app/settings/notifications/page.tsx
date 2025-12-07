'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import {
    getNotificationSettings,
    updateNotificationSettings,
    NotificationSettings,
} from '@/services/notification-settings-service';
import { Bell, Heart, MessageSquare, Trophy, CreditCard, Mail, ArrowLeft } from 'lucide-react';

export default function NotificationSettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        const loadSettings = async () => {
            try {
                const userSettings = await getNotificationSettings(user.uid);
                setSettings(userSettings);
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [user, router]);

    const handleToggle = async (key: keyof NotificationSettings) => {
        if (!settings || !user) return;

        const newSettings = {
            ...settings,
            [key]: !settings[key],
        };

        setSettings(newSettings);
        setSaving(true);

        try {
            await updateNotificationSettings(user.uid, newSettings);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            // Revert on error
            setSettings(settings);
        } finally {
            setSaving(false);
        }
    };

    const notificationTypes = [
        {
            key: 'follow' as const,
            label: 'Follow Notifications',
            description: 'Get notified when someone follows you',
            icon: Bell,
        },
        {
            key: 'like' as const,
            label: 'Like Notifications',
            description: 'Get notified when someone likes your video',
            icon: Heart,
        },
        {
            key: 'comment' as const,
            label: 'Comment Notifications',
            description: 'Get notified when someone comments on your video',
            icon: MessageSquare,
        },
        {
            key: 'challenge' as const,
            label: 'Challenge Notifications',
            description: 'Get notified about challenge submissions and approvals',
            icon: Trophy,
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[hsl(var(--background))]">
                <Header onMenuToggle={setIsSidebarOpen} />
                <div className="flex">
                    <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                    <main className="flex-1 overflow-auto">
                        <div className="max-w-2xl mx-auto px-4 py-8">
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <Header onMenuToggle={setIsSidebarOpen} />
            <div className="flex">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                <main className="flex-1 overflow-auto">
                    <div className="max-w-2xl mx-auto px-4 py-8">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">Notification Settings</h1>
                                <p className="text-muted-foreground mt-2">Manage your notification preferences</p>
                            </div>
                        </div>

                        {/* Success Message */}
                        {saveSuccess && (
                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                                    Settings saved successfully
                                </p>
                            </div>
                        )}

                        {/* Notification Settings */}
                        <div className="space-y-4">
                            {notificationTypes.map(({ key, label, description, icon: Icon }) => (
                                <div
                                    key={key}
                                    className="border border-border rounded-lg p-6 flex items-center justify-between hover:bg-[hsl(var(--surface))] transition-colors"
                                >
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{label}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => handleToggle(key)}
                                        disabled={saving}
                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                                            settings?.[key]
                                                ? 'bg-primary'
                                                : 'bg-muted'
                                        } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <span
                                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                                settings?.[key] ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Info Section */}
                        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <h3 className="font-semibold text-foreground mb-2">About Notifications</h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>• Notifications are delivered in real-time in the app</li>
                                <li>• You can view all notifications in the Notifications page</li>
                                <li>• Email notifications are currently in development</li>
                                <li>• Disabling a notification type will prevent those notifications from appearing</li>
                            </ul>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
