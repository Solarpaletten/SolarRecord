import { NextRequest, NextResponse } from 'next/server';
import { translateTranscript } from '@/lib/recording-translate';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recording_id, target_language = 'ru' } = body;

    if (!recording_id) {
      return NextResponse.json(
        { error: 'Recording ID required' },
        { status: 400 }
      );
    }

    console.log(`🌐 Translation request: ${recording_id} → ${target_language}`);

    const result = await translateTranscript({
      recordingId: recording_id,
      targetLanguage: target_language,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Translation completed',
      recording_id,
      translation_path: result.translationPath,
    });
  } catch (error) {
    console.error('❌ Translation error:', error);
    return NextResponse.json(
      {
        error: 'Translation failed',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
