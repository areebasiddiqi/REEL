import { NextRequest, NextResponse } from 'next/server';
import { firebaseLivestream } from '@/services/firebase-livestream';

// GET /api/livestreams/[id] - Get a specific livestream
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
            data: livestream,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch livestream' },
            { status: 500 }
        );
    }
}

// PATCH /api/livestreams/[id] - Update a livestream
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        await firebaseLivestream.update(id, body);

        const updated = await firebaseLivestream.getById(id);

        if (!updated) {
            return NextResponse.json(
                { success: false, error: 'Livestream not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updated,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update livestream' },
            { status: 500 }
        );
    }
}

// DELETE /api/livestreams/[id] - Delete a livestream
export async function DELETE(
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

        await firebaseLivestream.delete(id);

        return NextResponse.json({
            success: true,
            data: livestream,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete livestream' },
            { status: 500 }
        );
    }
}
