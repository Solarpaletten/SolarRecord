import { NextResponse } from 'next/server';
import { listRecordings } from '@/lib/recording-storage';

// Force dynamic to read files at runtime
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const recordings = await listRecordings();
    return NextResponse.json(recordings);
  } catch (error) {
    console.error('❌ Error listing files:', error);
    return NextResponse.json(
      { error: 'Failed to list recordings' },
      { status: 500 }
    );
  }
}
