'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Upload as UploadIcon, AlertCircle } from 'lucide-react';
import { uploadVideo, createVideo } from '@/services/video-service';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase.config';

export default function UploadPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        tags: [] as string[],
        privacy: 'public' as 'public' | 'subscribers' | 'members',
        duration: 0,
    });
    const [tagInput, setTagInput] = useState('');

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            setError('Please select a valid video file');
            return;
        }

        // Validate file size (max 500MB)
        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Video file must be less than 500MB');
            return;
        }

        setSelectedFile(file);
        setError(null);

        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Get video duration and auto-generate thumbnail
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
            setFormData((prev) => ({
                ...prev,
                duration: Math.round(video.duration),
            }));

            // Auto-generate thumbnail from random frame
            if (!thumbnailFile) {
                generateThumbnailFromVideo(video);
            }
        };
        video.src = url;
    };

    const generateThumbnailFromVideo = (video: HTMLVideoElement) => {
        // Seek to a random time (between 10% and 50% of video duration)
        const randomTime = video.duration * (0.1 + Math.random() * 0.4);
        video.currentTime = randomTime;

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const thumbnailUrl = URL.createObjectURL(blob);
                        setThumbnailPreview(thumbnailUrl);
                        // Convert blob to File
                        const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                        setThumbnailFile(file);
                    }
                }, 'image/jpeg', 0.9);
            }
        };
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!selectedFile) {
            setError('Please select a video file');
            return;
        }

        if (!formData.title.trim()) {
            setError('Video title is required');
            return;
        }

        if (formData.title.length < 3) {
            setError('Video title must be at least 3 characters');
            return;
        }

        if (formData.title.length > 100) {
            setError('Video title must be less than 100 characters');
            return;
        }

        if (!formData.description.trim()) {
            setError('Video description is required');
            return;
        }

        if (formData.description.length < 10) {
            setError('Video description must be at least 10 characters');
            return;
        }

        if (formData.tags.length === 0) {
            setError('Please add at least one tag');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            if (!user) throw new Error('User not authenticated');

            // Upload video file
            const uploadTask = uploadVideo(selectedFile, user.uid, (progress) => {
                setUploadProgress(Math.round(progress));
            });

            // Upload thumbnail if provided
            let thumbnailUrl = '';
            if (thumbnailFile) {
                const thumbnailTask = uploadVideo(thumbnailFile, user.uid, () => { });
                thumbnailUrl = await new Promise<string>((resolve, reject) => {
                    thumbnailTask.on('state_changed',
                        () => { },
                        (error) => reject(error),
                        async () => {
                            try {
                                const downloadUrl = await getDownloadURL(thumbnailTask.snapshot.ref);
                                resolve(downloadUrl);
                            } catch (error) {
                                reject(error);
                            }
                        }
                    );
                });
            }

            // Wait for upload to complete and get download URL
            const videoUrl = await new Promise<string>((resolve, reject) => {
                uploadTask.on('state_changed',
                    () => { }, // progress
                    (error) => reject(error), // error
                    async () => {
                        try {
                            // Get download URL from the upload task's reference
                            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadUrl);
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });

            // Create video metadata
            const videoId = await createVideo({
                creatorId: user.uid,
                creatorName: user.displayName || 'Creator',
                creatorPhoto: user.photoURL,
                title: formData.title,
                description: formData.description,
                videoUrl,
                thumbnailUrl: thumbnailUrl || '',
                duration: formData.duration,
                tags: formData.tags,
                privacy: formData.privacy,
            });

            setSuccess(true);
            setUploadProgress(0);

            // Redirect to the video page after 2 seconds
            setTimeout(() => {
                router.push(`/videos/${videoId}`);
            }, 2000);
        } catch (err: any) {
            console.error('Error uploading video:', err);
            setError(err.message || 'Failed to upload video');
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--surface))] to-[hsl(var(--background))]">
            {/* Header */}
            <header className="glass-card sticky top-0 z-50 border-b border-[hsl(var(--border))]">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <Link href="/dashboard" className="text-2xl font-bold gradient-text">
                            ReelTalk
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Upload Video</h1>
                    <p className="text-[hsl(var(--foreground-muted))]">
                        Share your content with your audience
                    </p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500">
                        <p className="font-medium">✓ Video uploaded successfully! Redirecting...</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="glass-card p-8 space-y-6">
                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Video File *
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleFileSelect}
                                disabled={isSubmitting}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting}
                                className="w-full p-8 border-2 border-dashed border-[hsl(var(--border))] rounded-xl hover:border-[hsl(var(--primary))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <UploadIcon className="w-8 h-8 text-[hsl(var(--foreground-muted))]" />
                                    {selectedFile ? (
                                        <div className="text-center">
                                            <p className="font-medium">{selectedFile.name}</p>
                                            <p className="text-sm text-[hsl(var(--foreground-subtle))]">
                                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="font-medium">Click to select a video</p>
                                            <p className="text-sm text-[hsl(var(--foreground-subtle))]">
                                                or drag and drop (max 500MB)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Upload Progress */}
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Uploading...</span>
                                        <span className="text-sm text-[hsl(var(--foreground-subtle))]">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[hsl(var(--surface))] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[hsl(var(--primary))] transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Thumbnail (Optional)
                            </label>
                            <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-3">
                                Upload a custom thumbnail or we'll auto-generate one from your video
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
                                            {thumbnailFile && thumbnailFile.name === 'thumbnail.jpg' ? 'Auto' : 'Custom'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Video Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., Amazing Tutorial Series"
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
                                Video Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe what your video is about..."
                                rows={5}
                                maxLength={500}
                                className="input w-full resize-none"
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">
                                {formData.description.length}/500 characters
                            </p>
                        </div>

                        {/* Privacy Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground-muted))]">
                                Privacy *
                            </label>
                            <select
                                name="privacy"
                                value={formData.privacy}
                                onChange={handleInputChange}
                                className="input w-full"
                                disabled={isSubmitting}
                            >
                                <option value="public">Public - Everyone can watch</option>
                                <option value="subscribers">Subscribers Only</option>
                                <option value="members">Members Only</option>
                            </select>
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

                        {/* Creator Info */}
                        {user && (
                            <div className="p-4 bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--border))]">
                                <p className="text-sm text-[hsl(var(--foreground-muted))] mb-3">Uploading as:</p>
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
                            disabled={isSubmitting || !selectedFile}
                            className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? `Uploading... ${uploadProgress}%` : 'Upload Video'}
                        </button>
                    </div>
                </form>

                {/* Info Box */}
                <div className="mt-8 p-6 glass-card border border-[hsl(var(--border))]">
                    <h3 className="font-bold mb-3">Tips for a Great Video</h3>
                    <ul className="space-y-2 text-sm text-[hsl(var(--foreground-muted))]">
                        <li>✓ Use a clear, descriptive title that tells viewers what to expect</li>
                        <li>✓ Add relevant tags to help people discover your video</li>
                        <li>✓ Write a detailed description about your video content</li>
                        <li>✓ Choose the right privacy setting for your audience</li>
                        <li>✓ Ensure your video is in a supported format (MP4, WebM, etc.)</li>
                        <li>✓ Keep file size under 500MB for faster uploads</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
