import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY не налаштований' }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Не вдалося прочитати аудіо' }, { status: 400 });
  }

  const audio = formData.get('audio') as File | null;
  if (!audio || audio.size === 0) {
    return NextResponse.json({ error: 'Аудіо порожнє' }, { status: 400 });
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'uk',
    });
    return NextResponse.json({ text: transcription.text });
  } catch (e: any) {
    console.error('[transcribe]', e);
    return NextResponse.json({ error: e?.message ?? 'Помилка розпізнавання' }, { status: 502 });
  }
}
