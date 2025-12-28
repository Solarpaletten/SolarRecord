import { NextRequest, NextResponse } from 'next/server';
import { syncToSolarCore } from '@/lib/solar-core';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, recipient } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Recording ID required' },
        { status: 400 }
      );
    }

    console.log(`🔗 Sync request: ${id} → ${recipient || 'default'}`);

    const result = await syncToSolarCore(id, recipient);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
