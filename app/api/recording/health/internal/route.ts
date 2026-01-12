import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Check uploads directory exists
    const uploadsPath = path.join(process.cwd(), 'uploads');
    await fs.access(uploadsPath);
    
    // Count metadata files
    const metadataPath = path.join(uploadsPath, 'metadata');
    let recordingCount = 0;
    try {
      const files = await fs.readdir(metadataPath);
      recordingCount = files.filter(f => f.endsWith('.json')).length;
    } catch {
      // metadata folder may not exist yet
    }

    return NextResponse.json({
      status: 'healthy',
      storage: 'ok',
      recordings: recordingCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: (error as Error).message },
      { status: 500 }
    );
  }
}
