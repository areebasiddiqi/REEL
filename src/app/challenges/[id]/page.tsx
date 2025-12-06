'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Calendar, Users, Play, Upload, Check, X } from 'lucide-react';
import { getChallenge, getChallengeSubmissions, submitChallengeEntry, approveSubmission, rejectSubmission } from '@/services/challenge-service';
import { uploadVideo } from '@/services/video-service';
import { getDownloadURL } from 'firebase/storage';
import { Challenge, ChallengeSubmission } from '@/types';

export default function ChallengeDetailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!params.id) return;

            try {
                setIsLoading(true);
                setError(null);

                const challengeData = await getChallenge(params.id as string);
                if (!challengeData) {
                    setError('Challenge not found');
                    return;
                }
                setChallenge(challengeData);

                const submissionsData = await getChallengeSubmissions(params.id as string);
                setSubmissions(submissionsData);
            } catch (err: any) {
                setError(err.message || 'Failed to load challenge');
                console.error('Error fetching challenge:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [params.id]);

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
        }
    };

    const handleSubmitEntry = async () => {
        if (!user || !challenge || !videoFile) return;

        setIsSubmitting(true);

        try {
            // Upload video
            const uploadTask = uploadVideo(videoFile, user.uid, setUploadProgress);
            await uploadTask;
            const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);

            // Submit entry
            await submitChallengeEntry(
                challenge.id,
                user.uid,
                user.displayName || 'Anonymous',
                user.photoURL,
                videoUrl,
                description
            );

            alert('Entry submitted successfully!');
            setShowSubmitModal(false);
            setVideoFile(null);
            setDescription('');

            // Refresh submissions
            const submissionsData = await getChallengeSubmissions(challenge.id);
            setSubmissions(submissionsData);
        } catch (error: any) {
            console.error('Error submitting entry:', error);
            alert(error.message || 'Failed to submit entry');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async (submissionId: string) => {
        if (!challenge) return;

        try {
            await approveSubmission(challenge.id, submissionId);
            alert('Submission approved!');

            // Refresh submissions
            const submissionsData = await getChallengeSubmissions(challenge.id);
            setSubmissions(submissionsData);
        } catch (error: any) {
            console.error('Error approving submission:', error);
            alert(error.message || 'Failed to approve submission');
        }
    };

    const handleReject = async (submissionId: string) => {
        if (!challenge) return;

        try {
            await rejectSubmission(challenge.id, submissionId);
            alert('Submission rejected');

            // Refresh submissions
            const submissionsData = await getChallengeSubmissions(challenge.id);
            setSubmissions(submissionsData);
        } catch (error: any) {
            console.error('Error rejecting submission:', error);
            alert(error.message || 'Failed to reject submission');
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        );
    }

    if (!user) {
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
            <main className="max-w-7xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-500 text-lg">{error}</p>
                    </div>
                ) : challenge ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Challenge Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Thumbnail */}
                            {challenge.thumbnailUrl && (
                                <div className="relative bg-black rounded-xl overflow-hidden">
                                    <img
                                        src={challenge.thumbnailUrl}
                                        alt={challenge.title}
                                        className="w-full aspect-video object-cover"
                                    />
                                </div>
                            )}

                            {/* Details */}
                            <div className="glass-card p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <h1 className="text-3xl font-bold flex-1">{challenge.title}</h1>
                                    <div className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold flex items-center gap-2">
                                        <Trophy className="w-5 h-5" />
                                        {challenge.pointsReward} pts
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 mb-6 text-[hsl(var(--foreground-muted))]">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span>{challenge.participants} participants</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Play className="w-4 h-4" />
                                        <span>{challenge.completions} completed</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Ends {formatDate(challenge.endDate)}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-[hsl(var(--foreground-muted))] mb-6">
                                    {challenge.description}
                                </p>

                                {/* Requirements */}
                                <div className="mb-6">
                                    <h3 className="font-bold mb-3">Requirements:</h3>
                                    <ul className="space-y-2">
                                        {challenge.requirements.map((req, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-[hsl(var(--foreground-muted))]">{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {challenge.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-sm bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] px-3 py-1 rounded-full"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Submit Button */}
                                {challenge.status === 'active' && user.uid !== challenge.creatorId && (
                                    <button
                                        onClick={() => setShowSubmitModal(true)}
                                        className="btn btn-primary w-full"
                                    >
                                        Submit Entry
                                    </button>
                                )}
                            </div>

                            {/* Submissions */}
                            <div className="glass-card p-6">
                                <h2 className="text-2xl font-bold mb-4">Submissions ({submissions.length})</h2>

                                {submissions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {submissions.map((submission) => (
                                            <div key={submission.id} className="bg-[hsl(var(--surface))] rounded-lg overflow-hidden">
                                                <video
                                                    src={submission.submissionUrl}
                                                    controls
                                                    className="w-full aspect-video object-cover bg-black"
                                                />
                                                <div className="p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <img
                                                            src={submission.userPhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                                            alt={submission.userName}
                                                            className="w-8 h-8 rounded-full"
                                                        />
                                                        <p className="font-medium">{submission.userName}</p>
                                                        <span
                                                            className={`ml-auto text-xs px-2 py-1 rounded-full ${submission.status === 'approved'
                                                                    ? 'bg-green-500/20 text-green-500'
                                                                    : submission.status === 'rejected'
                                                                        ? 'bg-red-500/20 text-red-500'
                                                                        : 'bg-yellow-500/20 text-yellow-500'
                                                                }`}
                                                        >
                                                            {submission.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[hsl(var(--foreground-muted))] mb-3">
                                                        {submission.description}
                                                    </p>

                                                    {/* Approve/Reject Buttons (only for challenge creator) */}
                                                    {user.uid === challenge.creatorId && submission.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleApprove(submission.id)}
                                                                className="flex-1 btn btn-primary py-2 text-sm"
                                                            >
                                                                <Check className="w-4 h-4 mr-1" />
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(submission.id)}
                                                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm flex items-center justify-center"
                                                            >
                                                                <X className="w-4 h-4 mr-1" />
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-[hsl(var(--foreground-muted))] py-8">
                                        No submissions yet. Be the first!
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Creator Info */}
                        <div className="lg:col-span-1">
                            <div className="glass-card p-6 sticky top-24">
                                <h3 className="font-bold mb-4">Challenge Creator</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src={challenge.creatorPhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                        alt={challenge.creatorName}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium">{challenge.creatorName}</p>
                                        <p className="text-sm text-[hsl(var(--foreground-muted))]">Creator</p>
                                    </div>
                                </div>
                                <button className="btn btn-primary w-full">Follow</button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>

            {/* Submit Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">Submit Entry</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Video</label>
                                <label className="btn btn-secondary cursor-pointer w-full">
                                    <Upload className="w-4 h-4 mr-2" />
                                    {videoFile ? videoFile.name : 'Choose Video'}
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input w-full min-h-[100px]"
                                    placeholder="Describe your submission..."
                                />
                            </div>

                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="w-full bg-[hsl(var(--surface))] rounded-full h-2">
                                    <div
                                        className="bg-[hsl(var(--primary))] h-2 rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSubmitEntry}
                                    disabled={!videoFile || isSubmitting}
                                    className="btn btn-primary flex-1 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                                <button
                                    onClick={() => setShowSubmitModal(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
