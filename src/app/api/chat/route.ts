import { NextResponse } from 'next/server';
import { askGemini, type ChatMessage } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Limit context history to the last 12 messages to keep requests fast and focused
    const recentMessages: ChatMessage[] = body.messages
      .slice(-12)
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content.trim().slice(0, 2000) : '',
      }))
      .filter((m: ChatMessage) => m.content.length > 0);

    if (recentMessages.length === 0) {
      return NextResponse.json({ error: 'Valid user message is required' }, { status: 400 });
    }

    const reply = await askGemini(recentMessages);
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json(
      {
        reply:
          "I'm currently having trouble connecting to the AI service. For immediate technical assistance or quotations, please call or WhatsApp our engineering team at **+91 99160 48404** or email **sales@theserverfactory.com**.",
        error: err?.message || 'Internal server error',
      },
      { status: 200 } // Return 200 with fallback text so UI displays friendly message rather than a hard crash
    );
  }
}

