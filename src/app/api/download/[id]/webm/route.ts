import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { readMetadata } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const metadata = await readMetadata(params.id);
    
    if (!metadata) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Read WebM file
    const fileBuffer = await readFile(metadata.videoPath);

    console.log(`📥 Downloading WebM: ${params.id} (${fileBuffer.length} bytes)`);

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/webm',
        'Content-Disposition': `attachment; filename="recording_${params.id}.webm"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error(`❌ WebM download error for ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to download WebM file' },
      { status: 500 }
    );
  }
}
