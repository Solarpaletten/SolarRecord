import { NextRequest, NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { readMetadata } from '@/lib/storage';
import { webmToMp4 } from '@/lib/convert';

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

    let mp4Path = metadata.mp4Path;

    // If MP4 doesn't exist, convert on-demand
    if (!mp4Path) {
      console.log(`🔄 On-demand MP4 conversion for: ${params.id}`);
      mp4Path = await webmToMp4(params.id);
      
      if (!mp4Path) {
        return NextResponse.json(
          { error: 'MP4 conversion failed. Check if WebM exists and FFmpeg is installed.' },
          { status: 500 }
        );
      }
    } else {
      // Check if file exists
      try {
        await access(mp4Path);
      } catch {
        // File missing, try conversion
        console.log(`⚠️ MP4 file missing, reconverting: ${params.id}`);
        mp4Path = await webmToMp4(params.id);
        
        if (!mp4Path) {
          return NextResponse.json(
            { error: 'MP4 file not found and conversion failed' },
            { status: 404 }
          );
        }
      }
    }

    // Read MP4 file
    const fileBuffer = await readFile(mp4Path);

    console.log(`📥 Downloading MP4: ${params.id} (${fileBuffer.length} bytes)`);

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="recording_${params.id}.mp4"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error(`❌ MP4 download error for ${params.id}:`, error);
    return NextResponse.json(
      {
        error: 'Failed to download MP4 file',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
