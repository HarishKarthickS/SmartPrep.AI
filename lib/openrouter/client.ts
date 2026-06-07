import { ChatMessage } from '../../types/chat';
import { OpenRouterModel } from '../../types/models';

export interface StreamOptions {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  signal?: AbortSignal;
  sessionId?: string;
  userId?: string;
  onChunk: (chunk: string, reasoning?: string) => void;
  onError: (error: string) => void;
  onStart?: () => void;
}

export const defaultModelPresets: OpenRouterModel[] = [];

export async function fetchModels(apiKey?: string): Promise<OpenRouterModel[]> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch('/api/openrouter/models', {
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch models: status ${res.status}`);
    }

    const json = await res.json();
    if (json.data && Array.isArray(json.data)) {
      return json.data.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description,
        contextLength: m.context_length,
        pricing: m.pricing ? {
          prompt: m.pricing.prompt,
          completion: m.pricing.completion
        } : undefined,
        architecture: m.architecture ? {
          modality: m.architecture.modality,
          tokenizer: m.architecture.tokenizer,
          instruct_type: m.architecture.instruct_type,
          input_modalities: m.architecture.input_modalities,
          output_modalities: m.architecture.output_modalities
        } : undefined
      }));
    }
    return [];
  } catch (e) {
    console.error('Error fetching models:', e);
    return [];
  }
}

export async function streamChatCompletions({
  apiKey,
  model,
  messages,
  temperature,
  signal,
  sessionId,
  userId,
  onChunk,
  onError,
  onStart
}: StreamOptions): Promise<void> {
  try {
    if (onStart) onStart();

    // Map and sanitize messages to format expected by OpenAI/OpenRouter
    const formattedMessages = messages
      .filter(m => m.content && m.content.trim().length > 0)
      .map(({ role, content }) => ({
        role,
        content: content
          .trim()
          .replace(/User Safety:\s*safe\n?/gi, '')
          .replace(/Response Safety:\s*safe\n?/gi, ''),
      }));

    if (formattedMessages.length === 0) {
      throw new Error('No valid message content to send.');
    }

    const response = await fetch('/api/openrouter/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-OpenRouter-Experimental-Metadata': 'enabled', 
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        temperature: temperature ?? 0.7,
        stream: true,
        session_id: sessionId,
        user: userId,
        stream_options: { include_usage: true },
      }),
      signal,
    });

    if (!response.ok) {
      let errText = 'An error occurred';
      try {
        const errJson = await response.json();
        errText = errJson.error || errText;
      } catch {
        errText = await response.text() || errText;
      }
      throw new Error(errText);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!reader) {
      throw new Error('Response body has no reader.');
    }

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        if (cleanLine.startsWith('data: ')) {
          const dataText = cleanLine.substring(6).trim();

          if (dataText === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataText);
            const delta = parsed.choices?.[0]?.delta;
            const content = delta?.content || '';
            const reasoning = delta?.reasoning || '';
            
            if (content || reasoning) {
              onChunk(content, reasoning);
            }
          } catch (err) {
            console.debug('Failed to parse line JSON:', dataText, err);
          }
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Chat generation aborted by user.');
    } else {
      onError(error?.message || 'Network error occurred while connecting to AI.');
    }
  }
}
