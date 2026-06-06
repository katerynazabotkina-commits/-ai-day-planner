import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY не налаштований' }, { status: 500 });
  }

  // Groq gives free Whisper access — sign up at console.groq.com, no credit card needed.
  const client = new OpenAI({
    apiKey:  process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });

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
    const transcription = await client.audio.transcriptions.create({
      file:     audio,
      model:    'whisper-large-v3-turbo', // Groq's fastest free Whisper model
      language: 'uk',
    });
    return NextResponse.json({ text: transcription.text });
  } catch (e: any) {
    console.error('[transcribe]', e);
    return NextResponse.json({ error: e?.message ?? 'Помилка розпізнавання' }, { status: 502 });
  }
}
