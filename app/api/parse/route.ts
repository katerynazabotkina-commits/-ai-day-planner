import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const SYSTEM = `Ти — асистент-планувальник. Користувач накидав хаотичний список думок
і задач. Розбий його на окремі задачі. Для кожної визнач:
- title: коротке формулювання задачі
- priority: "must" якщо терміново/важливо, інакше "nice"
- estimateMin: реалістична оцінка в хвилинах
- deadline: дата у форматі YYYY-MM-DD, якщо в тексті є час/день; інакше null

Поверни ТІЛЬКИ валідний JSON-масив, без пояснень і без markdown.`;

export interface ParsedTask {
  title: string;
  priority: 'must' | 'nice';
  estimateMin: number;
  deadline: string | null;
}

export async function POST(request: NextRequest) {
  let dump: string;
  try {
    const body = await request.json();
    dump = typeof body?.dump === 'string' ? body.dump.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!dump) {
    return NextResponse.json({ error: 'dump is required and must be a non-empty string' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Сьогодні: ${today}.\n\nТекст користувача:\n"""\n${dump}\n"""`,
        },
      ],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 });
    }

    let tasks: unknown;
    try {
      tasks = JSON.parse(textBlock.text.trim());
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid JSON', raw: textBlock.text },
        { status: 502 },
      );
    }

    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'AI returned non-array JSON', raw: textBlock.text },
        { status: 502 },
      );
    }

    return NextResponse.json(tasks as ParsedTask[]);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Invalid ANTHROPIC_API_KEY' }, { status: 401 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Rate limited — try again shortly' }, { status: 429 });
    }
    console.error('[api/parse]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
