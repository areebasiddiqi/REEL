import { NextRequest, NextResponse } from 'next/server';
import { firebaseLivestream } from '@/services/firebase-livestream';

// GET /api/livestreams/[id]/stream - Get stream status and viewer count
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const livestream = await firebaseLivestream.getById(id);

        if (!livestream) {
            return NextResponse.json(
                { success: false, error: 'Livestream not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: livestream.id,
                title: livestream.title,
                status: livestream.status,
                viewerCount: livestream.viewerCount,
                creatorName: livestream.creatorName,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to get stream status' },
            { status: 500 }
        );
    }
}

// PATCH /api/livestreams/[id]/stream - Update viewer count
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action } = body;

        const livestream = await firebaseLivestream.getById(id);
        if (!livestream) {
            return NextResponse.json(
                { success: false, error: 'Livestream not found' },
                { status: 404 }
            );
        }

        let newViewerCount = livestream.viewerCount;

        if (action === 'increment') {
            newViewerCount = await firebaseLivestream.addViewer(id);
        } else if (action === 'decrement') {
            newViewerCount = await firebaseLivestream.removeViewer(id);
        }

        console.log(`Stream ${id}: Viewer count updated to ${newViewerCount}`);

        return NextResponse.json({
            success: true,
            data: {
                id: id,
                viewerCount: newViewerCount,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update stream' },
            { status: 500 }
        );
    }
}
