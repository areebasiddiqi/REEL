import { NextRequest, NextResponse } from 'next/server';
import { livestreamStore } from '@/lib/livestream-store';

// Debug endpoint to check livestream store status
export async function GET(request: NextRequest) {
    try {
        const all = livestreamStore.getAll();
        
        return NextResponse.json({
            success: true,
            debug: {
                totalLivestreams: all.length,
                livestreams: all.map(s => ({
                    id: s.id,
                    title: s.title,
                    creatorName: s.creatorName,
                })),
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
