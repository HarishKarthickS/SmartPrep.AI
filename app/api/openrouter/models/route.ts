import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '')?.trim();

    // OpenRouter models endpoint doesn't strictly require a key, but it's better to supply one
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Use /models/user if authenticated to get personalized results (provider filters, etc.)
    const endpoint = apiKey ? 'https://openrouter.ai/api/v1/models/user' : 'https://openrouter.ai/api/v1/models';

    const openRouterResponse = await fetch(endpoint, {
      method: 'GET',
      headers,
      next: { revalidate: 3600 }, // cache results for an hour in Next.js
    });

    if (!openRouterResponse.ok) {
      return NextResponse.json(
        { error: `OpenRouter returned status ${openRouterResponse.status}` },
        { status: openRouterResponse.status }
      );
    }

    const data = await openRouterResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching OpenRouter models:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
