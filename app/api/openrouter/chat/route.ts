import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '')?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key is required. Please set it in Settings or Onboarding.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { messages, model, temperature, stream = true, session_id, user } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required.' },
        { status: 400 }
      );
    }

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://smartprep.ai',
        'X-Title': 'SmartPrep',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature ?? 0.7,
        stream,
        session_id,
        user,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { error: { message: errorText } };
      }

      const errorMessage = errorJson?.error?.message || `OpenRouter returned status ${openRouterResponse.status}`;
      return NextResponse.json(
        { error: errorMessage },
        { status: openRouterResponse.status }
      );
    }

    if (stream) {
      return new Response(openRouterResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await openRouterResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in openrouter proxy route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error in proxy' },
      { status: 500 }
    );
  }
}
