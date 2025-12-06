'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react';
import { createChallenge, uploadChallengeThumbnail } from '@/services/challenge-service';
import { getDownloadURL } from 'firebase/storage';

export default function CreateChallengePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState<string[]>(['']);
    const [pointsReward, setPointsReward] = useState(100);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const addRequirement = () => {
        setRequirements([...requirements, '']);
    };

    const updateRequirement = (index: number, value: string) => {
        const newRequirements = [...requirements];
        newRequirements[index] = value;
        setRequirements(newRequirements);
    };

    const removeRequirement = (index: number) => {
        setRequirements(requirements.filter((_, i) => i !== index));
    };

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);

        try {
            let thumbnailUrl = '';

            // Upload thumbnail if provided
            if (thumbnail) {
                const uploadTask = uploadChallengeThumbnail(thumbnail, user.uid, setUploadProgress);
                await uploadTask;
                thumbnailUrl = await getDownloadURL(uploadTask.snapshot.ref);
            }

            // Create challenge
            const challengeId = await createChallenge({
                creatorId: user.uid,
                creatorName: user.displayName || 'Anonymous',
                creatorPhoto: user.photoURL,
                title,
                description,
                requirements: requirements.filter(r => r.trim() !== ''),
                pointsReward,
                thumbnailUrl,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                tags,
                status: 'active',
            });

            alert('Challenge created successfully!');
            router.push(`/challenges/${challengeId}`);
        } catch (error: any) {
            console.error('Error creating challenge:', error);
            alert(error.message || 'Failed to create challenge');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

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
                        <Link href="/" className="text-2xl font-bold gradient-text">
                            ReelTalk
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="glass-card p-8">
                    <h1 className="text-3xl font-bold mb-6">Create Challenge</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Challenge Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="input w-full"
                                placeholder="Enter challenge title"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input w-full min-h-[120px]"
                                placeholder="Describe your challenge..."
                                required
                            />
                        </div>

                        {/* Requirements */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Requirements</label>
                            {requirements.map((req, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={req}
                                        onChange={(e) => updateRequirement(index, e.target.value)}
                                        className="input flex-1"
                                        placeholder={`Requirement ${index + 1}`}
                                    />
                                    {requirements.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRequirement(index)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addRequirement}
                                className="btn btn-secondary mt-2"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Requirement
                            </button>
                        </div>

                        {/* Points Reward */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Points Reward</label>
                            <input
                                type="number"
                                value={pointsReward}
                                onChange={(e) => setPointsReward(parseInt(e.target.value))}
                                className="input w-full"
                                min="1"
                                required
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Start Date</label>
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="input w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">End Date</label>
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="input w-full"
                                    required
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Tags</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                    className="input flex-1"
                                    placeholder="Add a tag"
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    className="btn btn-secondary"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="flex items-center gap-1 bg-[hsl(var(--surface))] px-3 py-1 rounded-full text-sm"
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Thumbnail (Optional)</label>
                            <div className="flex items-center gap-4">
                                <label className="btn btn-secondary cursor-pointer">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Choose Image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailChange}
                                        className="hidden"
                                    />
                                </label>
                                {thumbnailPreview && (
                                    <img
                                        src={thumbnailPreview}
                                        alt="Thumbnail preview"
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Upload Progress */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-[hsl(var(--surface))] rounded-full h-2">
                                <div
                                    className="bg-[hsl(var(--primary))] h-2 rounded-full transition-all"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full disabled:opacity-50"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Challenge'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
