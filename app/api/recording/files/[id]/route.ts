import { NextRequest, NextResponse } from 'next/server';
import { readMetadata, deleteRecording } from '@/lib/recording-storage';

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

    return NextResponse.json(metadata);
  } catch (error) {
    console.error(`❌ Error getting file ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to get recording' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🗑️ Deleting recording: ${params.id}`);
    
    const success = await deleteRecording(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: `Recording ${params.id} deleted successfully`,
    });
  } catch (error) {
    console.error(`❌ Error deleting ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete recording' },
      { status: 500 }
    );
  }
}
