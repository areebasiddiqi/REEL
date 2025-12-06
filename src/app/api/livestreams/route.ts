import { NextRequest, NextResponse } from 'next/server';
import { firebaseLivestream } from '@/services/firebase-livestream';

// GET /api/livestreams - Get all livestreams with optional filtering
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status') as 'live' | 'scheduled' | null;
        const search = searchParams.get('search');

        let filtered = await firebaseLivestream.getAll(status || undefined);

        // Filter by search query
        if (search) {
            const query = search.toLowerCase();
            filtered = filtered.filter(
                (stream) =>
                    stream.title.toLowerCase().includes(query) ||
                    stream.creatorName.toLowerCase().includes(query) ||
                    stream.tags.some((tag: string) => tag.toLowerCase().includes(query))
            );
        }

        return NextResponse.json({
            success: true,
            data: filtered,
            total: filtered.length,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch livestreams' },
            { status: 500 }
        );
    }
}

// POST /api/livestreams - Create a new livestream
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { creatorId, creatorName, creatorPhoto, title, description, tags, isPremium } = body;

        if (!creatorId || !title) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newLivestream = await firebaseLivestream.create({
            creatorId,
            creatorName,
            creatorPhoto,
            title,
            description,
            status: 'live',
            viewerCount: 0,
            tags: tags || [],
            isPremium: isPremium || false,
        });

        return NextResponse.json(
            { success: true, data: newLivestream },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create livestream' },
            { status: 500 }
        );
    }
}
