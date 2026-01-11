import { NextRequest, NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { readMetadata } from '@/lib/recording-storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const metadata = await readMetadata(params.id);
    
    if (!metadata || !metadata.pdfPath) {
      return NextResponse.json(
        { error: 'PDF not found or not yet generated' },
        { status: 404 }
      );
    }

    // Check if file exists
    try {
      await access(metadata.pdfPath);
    } catch {
      return NextResponse.json(
        { error: 'PDF file not found on disk' },
        { status: 404 }
      );
    }

    // Read PDF file
    const fileBuffer = await readFile(metadata.pdfPath);

    console.log(`📥 Downloading PDF: ${params.id} (${fileBuffer.length} bytes)`);

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="solar_recorder_${params.id}.pdf"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error(`❌ PDF download error for ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to download PDF file' },
      { status: 500 }
    );
  }
}
