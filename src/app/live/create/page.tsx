'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Upload as UploadIcon } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { createLivestream } from '@/services/livestream-service';
import { uploadBytesResumable, getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase.config';

export default function CreateLiveStreamPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        tags: [] as string[],
        isPremium: false,
    });
    const [tagInput, setTagInput] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    // Redirect if not authenticated
    if (!loading && !user) {
        router.push('/login');
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && formData.tags.length < 5) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim().toLowerCase()],
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }));
    };

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Thumbnail must be less than 5MB');
            return;
        }

        setThumbnailFile(file);
        setError(null);

        // Create preview URL
        const url = URL.createObjectURL(file);
        setThumbnailPreview(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.title.trim()) {
            setError('Stream title is required');
            return;
        }

        if (formData.title.length < 3) {
            setError('Stream title must be at least 3 characters');
            return;
        }

        if (formData.title.length > 100) {
            setError('Stream title must be less than 100 characters');
            return;
        }

        if (!formData.description.trim()) {
            setError('Stream description is required');
            return;
        }

        if (formData.description.length < 10) {
            setError('Stream description must be at least 10 characters');
            return;
        }

        if (formData.tags.length === 0) {
            setError('Please add at least one tag');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // Create livestream
            if (!user) throw new Error('User not authenticated');

            // Upload thumbnail if provided
            let thumbnailUrl = '';
            if (thumbnailFile) {
                const timestamp = Date.now();
                const fileName = `livestream-thumbnails/${user.uid}/${timestamp}_${thumbnailFile.name}`;
                const storageRef = ref(storage, fileName);

                const uploadTask = uploadBytesResumable(storageRef, thumbnailFile);
                
                thumbnailUrl = await new Promise<string>((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        () => { }, // progress
                        (error) => reject(error), // error
                        async () => {
                            try {
                                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve(downloadUrl);
                            } catch (error) {
                                reject(error);
                            }
                        }
                    );
                });
            }

            console.log('Creating livestream with data:', {
                creatorId: user.uid,
                creatorName: user.displayName || 'Creator',
                title: formData.title,
                description: formData.description,
                tags: formData.tags,
                isPremium: formData.isPremium,
                thumbnailUrl,
            });

            const livestreamId = await createLivestream(
                user.uid,
                user.displayName || 'Creator',
                user.photoURL || undefined,
                formData.title,
                formData.description,
                formData.tags,
                formData.isPremium,
                undefined,
                thumbnailUrl
            );

            console.log('Livestream created successfully:', livestreamId);
            setSuccess(true);

            // Redirect to the livestream page after 2 seconds
            setTimeout(() => {
                router.push(`/live/${livestreamId}`);
            }, 2000);
        } catch (err: any) {
            console.error('Error creating livestream:', err);
            setError(err.message || 'Failed to create livestream');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <Header onMenuToggle={setIsSidebarOpen} />
            <div className="flex">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Create Live Stream</h1>
                    <p className="text-[hsl(var(--foreground-muted))]">
                        Start broadcasting to your audience
                    </p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500">
                        <p className="font-medium">✓ Livestream created successfully! Redirecting...</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500">
                        <p className="font-medium">✕ {error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="glass-card p-8 space-y-6">
                        {/* Title Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Stream Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., Web Development Tutorial"
                                maxLength={100}
                                className="input w-full"
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">
                                {formData.title.length}/100 characters
                            </p>
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Stream Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe what your stream is about..."
                                rows={5}
                                maxLength={500}
                                className="input w-full resize-none"
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">
                                {formData.description.length}/500 characters
                            </p>
                        </div>

                        {/* Thumbnail Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Stream Thumbnail (Optional)
                            </label>
                            <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-3">
                                If not provided, a frame from your livestream will be used
                            </p>
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailSelect}
                                disabled={isSubmitting}
                                className="hidden"
                            />
                            <div className="flex gap-4 items-center">
                                <button
                                    type="button"
                                    onClick={() => thumbnailInputRef.current?.click()}
                                    disabled={isSubmitting}
                                    className="btn btn-secondary disabled:opacity-50"
                                >
                                    <UploadIcon className="w-4 h-4 mr-2" />
                                    Choose Thumbnail
                                </button>
                                {thumbnailPreview && (
                                    <div className="relative">
                                        <img
                                            src={thumbnailPreview}
                                            alt="Thumbnail preview"
                                            className="h-20 w-32 object-cover rounded-lg border border-[hsl(var(--border))]"
                                        />
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                            Custom
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Tags (up to 5) *
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    placeholder="Add a tag and press Enter"
                                    className="input flex-1"
                                    disabled={isSubmitting || formData.tags.length >= 5}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    disabled={isSubmitting || formData.tags.length >= 5 || !tagInput.trim()}
                                    className="btn btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tags Display */}
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] px-3 py-1 rounded-full text-sm"
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(index)}
                                            className="hover:opacity-70 transition-opacity"
                                            disabled={isSubmitting}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Premium Toggle */}
                        <div className="flex items-center gap-3 p-4 bg-[hsl(var(--surface))] rounded-lg">
                            <input
                                type="checkbox"
                                name="isPremium"
                                id="isPremium"
                                checked={formData.isPremium}
                                onChange={handleInputChange}
                                className="w-5 h-5 rounded cursor-pointer"
                                disabled={isSubmitting}
                            />
                            <label htmlFor="isPremium" className="flex-1 cursor-pointer">
                                <p className="font-medium">Premium Stream</p>
                                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                    Only available to premium subscribers
                                </p>
                            </label>
                        </div>

                        {/* Creator Info */}
                        {user && (
                            <div className="p-4 bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--border))]">
                                <p className="text-sm text-[hsl(var(--foreground-muted))] mb-3">Streaming as:</p>
                                <div className="flex items-center gap-3">
                                    {user.photoURL && (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || 'Creator'}
                                            className="w-10 h-10 rounded-full"
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium">{user.displayName || 'Creator'}</p>
                                        <p className="text-sm text-[hsl(var(--foreground-subtle))]">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                            className="flex-1 btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating...' : 'Go Live'}
                        </button>
                    </div>
                </form>

                {/* Info Box */}
                <div className="mt-8 p-6 glass-card border border-[hsl(var(--border))]">
                    <h3 className="font-bold mb-3">Tips for a Great Stream</h3>
                    <ul className="space-y-2 text-sm text-[hsl(var(--foreground-muted))]">
                        <li>✓ Use a clear, descriptive title that tells viewers what to expect</li>
                        <li>✓ Add relevant tags to help people discover your stream</li>
                        <li>✓ Write a detailed description about what you'll be covering</li>
                        <li>✓ Consider making it premium if it's exclusive content</li>
                        <li>✓ Test your audio and video before going live</li>
                    </ul>
                </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
