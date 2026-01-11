import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function GET() {
  const start = Date.now();

  try {
    await prisma.recording.count();

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      service: 'solar-record',
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: 'error',
        db: 'disconnected',
        error: String(e),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
