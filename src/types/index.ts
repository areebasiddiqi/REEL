// User Types
export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: 'viewer' | 'creator';
    bio?: string;
    followers: number;
    following: number;
    points: number;
    createdAt: Date;
    subscriptionTier?: 'basic' | 'pro' | 'premium';
    premiumPlan?: 'free' | 'premium';
    premiumExpiresAt?: Date;
    stripeCustomerId?: string;
}

// Livestream Types
export interface Livestream {
    id: string;
    creatorId: string;
    creatorName: string;
    creatorPhoto?: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    status: 'live' | 'ended' | 'scheduled';
    viewerCount: number;
    startedAt: Date;
    endedAt?: Date;
    tags: string[];
    isPremium: boolean;
    requiredTier?: 'basic' | 'pro' | 'premium';
}

export interface LivestreamParticipant {
    userId: string;
    userName: string;
    userPhoto?: string;
    joinedAt: Date;
    peerId?: string;
}

// Video Types
export interface Video {
    id: string;
    creatorId: string;
    creatorName: string;
    creatorPhoto?: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    duration: number; // in seconds
    views: number;
    likes: number;
    uploadedAt: Date;
    tags: string[];
    privacy: 'public' | 'subscribers' | 'members';
    requiredTier?: 'basic' | 'pro' | 'premium';
    status: 'processing' | 'ready' | 'failed';
}

// Challenge Types
export interface Challenge {
    id: string;
    creatorId: string;
    creatorName: string;
    creatorPhoto?: string;
    title: string;
    description: string;
    requirements: string[];
    pointsReward: number;
    thumbnailUrl?: string;
    startDate: Date;
    endDate: Date;
    participants: number;
    completions: number;
    tags: string[];
    status: 'active' | 'ended';
}

export interface ChallengeSubmission {
    id: string;
    challengeId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    submissionUrl: string; // video or image URL
    description: string;
    submittedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    likes: number;
}

// Subscription Types
export interface PlatformSubscription {
    tier: 'basic' | 'pro' | 'premium';
    price: number;
    features: string[];
}

export interface CreatorMembership {
    id: string;
    creatorId: string;
    name: string;
    price: number;
    benefits: string[];
    subscriberCount: number;
}

// Comment Types
export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    content: string;
    createdAt: Date;
    likes: number;
    replies?: Comment[];
}

export interface LivestreamComment extends Comment {
    livestreamId: string;
}

export interface VideoComment extends Comment {
    videoId: string;
}

// Notification Types
export interface Notification {
    id: string;
    userId: string;
    type: 'livestream' | 'video' | 'challenge' | 'subscription' | 'comment' | 'like';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: Date;
}

// Points Types
export interface PointsTransaction {
    id: string;
    userId: string;
    points: number;
    reason: string;
    type: 'earned' | 'spent';
    relatedId?: string; // challengeId, videoId, etc.
    createdAt: Date;
}

// Friend Request Types
export interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserPhoto?: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
}

// Messaging Types
export interface Conversation {
    id: string;
    participants: string[];
    participantNames: Record<string, string>;
    participantPhotos: Record<string, string>;
    lastMessage?: string;
    lastMessageAt?: Date;
    unreadCount: Record<string, number>;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    read: boolean;
}

// Premium & Subscription Types
export interface CreatorSubscription {
    id: string;
    creatorId: string;
    creatorName: string;
    price: number; // Monthly price in cents
    description: string;
    benefits: string[];
    subscriberCount: number;
    active: boolean;
    createdAt: Date;
}

export interface UserSubscription {
    id: string;
    userId: string;
    creatorId: string;
    subscriptionId: string; // Stripe subscription ID
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd: Date;
    createdAt: Date;
}
