import { NextResponse } from 'next/server';
import { askGemini, type ChatMessage } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Limit context history to the last 8 messages to keep requests fast and focused
    const recentMessages: ChatMessage[] = body.messages
      .slice(-8)
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content.trim().slice(0, 1500) : '',
      }))
      .filter((m: ChatMessage) => m.content.length > 0);

    if (recentMessages.length === 0) {
      return NextResponse.json({ error: 'Valid user message is required' }, { status: 400 });
    }

    // 7.5-second hard ceiling to strictly beat Netlify's 10s gateway timeout
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(
          `### The Server Factory Hardware Advisory\n\nFor real-time pricing, stock availability, and customized server builds:\n\n* **Call or WhatsApp Engineers:** **+91 99160 48404**\n* **Formal RFQ / Quotation:** [Submit Spec on Contact Page](/contact)\n* **Email:** **sales@theserverfactory.com**\n\nOur team in Bangalore provides custom configurations dispatched within 24–48 hours across India.`
        );
      }, 7500);
    });

    const reply = await Promise.race([askGemini(recentMessages), timeoutPromise]);

    return NextResponse.json({ reply }, { status: 200 });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json(
      {
        reply:
          "For immediate technical assistance or quotations, please call or WhatsApp our engineering team directly at **+91 99160 48404** or submit your requirement on our [Contact & Custom Quote Page](/contact).",
      },
      { status: 200 }
    );
  }
}
