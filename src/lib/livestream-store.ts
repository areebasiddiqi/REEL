// Shared in-memory store for livestreams and comments
// This ensures data persists across API route instances using a singleton pattern

export interface LivestreamData {
    id: string;
    creatorId: string;
    creatorName: string;
    creatorPhoto?: string;
    title: string;
    description: string;
    status: 'live' | 'ended' | 'scheduled';
    viewerCount: number;
    startedAt: string;
    tags: string[];
    isPremium: boolean;
    requiredTier?: 'basic' | 'pro' | 'premium';
}

export interface CommentData {
    id: string;
    livestreamId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    content: string;
    createdAt: string;
    likes: number;
}

// Use globalThis to persist data across module reloads in development
declare global {
    var livestreamStoreData: {
        livestreams: LivestreamData[];
        comments: CommentData[];
    };
}

// Initialize global store if it doesn't exist
if (!globalThis.livestreamStoreData) {
    globalThis.livestreamStoreData = {
        livestreams: [],
        comments: [],
    };
}

// Initialize with default data if empty
if (globalThis.livestreamStoreData.livestreams.length === 0) {
    globalThis.livestreamStoreData.livestreams = [
    {
        id: '1',
        creatorId: 'creator1',
        creatorName: 'Alex Chen',
        creatorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        title: 'Web Development Tips & Tricks',
        description: 'Learn advanced web development techniques and best practices',
        status: 'live',
        viewerCount: 1234,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        tags: ['web', 'development', 'tutorial'],
        isPremium: false,
    },
    {
        id: '2',
        creatorId: 'creator2',
        creatorName: 'Sarah Johnson',
        creatorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        title: 'Design System Deep Dive',
        description: 'Building scalable design systems for modern applications',
        status: 'live',
        viewerCount: 856,
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        tags: ['design', 'ui', 'systems'],
        isPremium: true,
    },
    {
        id: '3',
        creatorId: 'creator3',
        creatorName: 'Mike Davis',
        creatorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        title: 'React Performance Optimization',
        description: 'Techniques to optimize React applications for better performance',
        status: 'live',
        viewerCount: 2105,
        startedAt: new Date(Date.now() - 1800000).toISOString(),
        tags: ['react', 'performance', 'javascript'],
        isPremium: false,
    },
    {
        id: '4',
        creatorId: 'creator4',
        creatorName: 'Emma Wilson',
        creatorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        title: 'Mobile App Development',
        description: 'Building cross-platform mobile applications',
        status: 'scheduled',
        viewerCount: 0,
        startedAt: new Date(Date.now() + 3600000).toISOString(),
        tags: ['mobile', 'development', 'flutter'],
        isPremium: false,
    },
    ];
    globalThis.livestreamStoreData.comments = [
        {
            id: '1',
            livestreamId: '1',
            userId: 'user1',
            userName: 'John Doe',
            userPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
            content: 'Great tips! Really helpful for my project.',
            createdAt: new Date(Date.now() - 300000).toISOString(),
            likes: 12,
        },
        {
            id: '2',
            livestreamId: '1',
            userId: 'user2',
            userName: 'Jane Smith',
            userPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
            content: 'Can you explain the performance optimization part more?',
            createdAt: new Date(Date.now() - 600000).toISOString(),
            likes: 5,
        },
        {
            id: '3',
            livestreamId: '1',
            userId: 'user3',
            userName: 'Bob Wilson',
            userPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
            content: 'This is exactly what I needed to know!',
            createdAt: new Date(Date.now() - 900000).toISOString(),
            likes: 28,
        },
    ];
}

// Livestream operations
export const livestreamStore = {
    getAll: () => [...globalThis.livestreamStoreData.livestreams],
    
    getById: (id: string) => {
        const stream = globalThis.livestreamStoreData.livestreams.find((s) => s.id === id);
        return stream ? { ...stream } : null;
    },
    
    create: (data: Omit<LivestreamData, 'id' | 'viewerCount' | 'startedAt' | 'status'>) => {
        const newStream: LivestreamData = {
            id: String(Date.now()),
            ...data,
            status: 'live',
            viewerCount: 0,
            startedAt: new Date().toISOString(),
        };
        globalThis.livestreamStoreData.livestreams.push(newStream);
        console.log('Store: Created livestream', newStream.id, 'Total:', globalThis.livestreamStoreData.livestreams.length);
        return { ...newStream };
    },
    
    update: (id: string, updates: Partial<LivestreamData>) => {
        const index = globalThis.livestreamStoreData.livestreams.findIndex((s) => s.id === id);
        if (index === -1) return null;
        
        globalThis.livestreamStoreData.livestreams[index] = { ...globalThis.livestreamStoreData.livestreams[index], ...updates };
        console.log('Store: Updated livestream', id);
        return { ...globalThis.livestreamStoreData.livestreams[index] };
    },
    
    delete: (id: string) => {
        const index = globalThis.livestreamStoreData.livestreams.findIndex((s) => s.id === id);
        if (index === -1) return null;
        
        const deleted = globalThis.livestreamStoreData.livestreams.splice(index, 1)[0];
        console.log('Store: Deleted livestream', id);
        return { ...deleted };
    },
};

// Comment operations
export const commentStore = {
    getAll: (livestreamId: string) => {
        return globalThis.livestreamStoreData.comments
            .filter((c) => c.livestreamId === livestreamId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((c) => ({ ...c }));
    },
    
    add: (livestreamId: string, data: Omit<CommentData, 'id' | 'livestreamId' | 'createdAt' | 'likes'>) => {
        const newComment: CommentData = {
            id: String(Date.now()),
            livestreamId,
            ...data,
            createdAt: new Date().toISOString(),
            likes: 0,
        };
        globalThis.livestreamStoreData.comments.push(newComment);
        console.log('Store: Added comment', newComment.id);
        return { ...newComment };
    },
};
