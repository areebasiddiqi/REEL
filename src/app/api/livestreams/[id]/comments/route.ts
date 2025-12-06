import { NextRequest, NextResponse } from 'next/server';
import { firebaseComment } from '@/services/firebase-livestream';

// GET /api/livestreams/[id]/comments - Get comments for a livestream
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const streamComments = await firebaseComment.getAll(id);

        return NextResponse.json({
            success: true,
            data: streamComments,
            total: streamComments.length,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// POST /api/livestreams/[id]/comments - Add a comment to a livestream
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { userId, userName, userPhoto, content } = body;

        if (!userId || !content) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newComment = await firebaseComment.add(id, {
            userId,
            userName,
            userPhoto,
            content,
            likes: 0,
        });

        return NextResponse.json(
            { success: true, data: newComment },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to add comment' },
            { status: 500 }
        );
    }
}
