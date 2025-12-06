import { Livestream, LivestreamComment } from '@/types';

const API_BASE = '/api/livestreams';

// Livestream API functions
export const livestreamAPI = {
    // Get all livestreams with optional filtering
    getAll: async (status?: 'all' | 'live' | 'scheduled', search?: string): Promise<Livestream[]> => {
        try {
            const params = new URLSearchParams();
            if (status && status !== 'all') params.append('status', status);
            if (search) params.append('search', search);

            const response = await fetch(`${API_BASE}?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch livestreams');

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching livestreams:', error);
            throw error;
        }
    },

    // Get a specific livestream by ID
    getById: async (id: string): Promise<Livestream> => {
        try {
            const response = await fetch(`${API_BASE}/${id}`);
            if (!response.ok) throw new Error('Livestream not found');

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching livestream:', error);
            throw error;
        }
    },

    // Create a new livestream
    create: async (livestream: Omit<Livestream, 'id' | 'viewerCount' | 'startedAt' | 'status'>): Promise<Livestream> => {
        try {
            console.log('API: Creating livestream with payload:', livestream);
            
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(livestream),
            });

            console.log('API: Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create livestream');
            }

            const data = await response.json();
            console.log('API: Response data:', data);
            
            if (!data.data) {
                throw new Error('No data returned from API');
            }
            
            return data.data;
        } catch (error: any) {
            console.error('Error creating livestream:', error);
            throw new Error(error.message || 'Failed to create livestream');
        }
    },

    // Update a livestream
    update: async (id: string, updates: Partial<Livestream>): Promise<Livestream> => {
        try {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!response.ok) throw new Error('Failed to update livestream');

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error updating livestream:', error);
            throw error;
        }
    },

    // Delete a livestream
    delete: async (id: string): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete livestream');
        } catch (error) {
            console.error('Error deleting livestream:', error);
            throw error;
        }
    },
};

// Comment API functions
export const commentAPI = {
    // Get all comments for a livestream
    getAll: async (livestreamId: string): Promise<LivestreamComment[]> => {
        try {
            const response = await fetch(`${API_BASE}/${livestreamId}/comments`);
            if (!response.ok) throw new Error('Failed to fetch comments');

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    },

    // Add a comment to a livestream
    add: async (livestreamId: string, comment: Omit<LivestreamComment, 'id' | 'livestreamId' | 'createdAt' | 'likes'>): Promise<LivestreamComment> => {
        try {
            const response = await fetch(`${API_BASE}/${livestreamId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(comment),
            });

            if (!response.ok) throw new Error('Failed to add comment');

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    },
};
