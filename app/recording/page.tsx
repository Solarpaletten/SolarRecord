// app/recording/page.tsx
import { Recorder, ShareButton } from '@/components/recording';


export const metadata = {
  title: 'Recording | SOLAR',
  description: 'Record and transcribe audio/video',
};

export default function RecordingPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Запись</h1>
      <Recorder />
    </main>
  );
}