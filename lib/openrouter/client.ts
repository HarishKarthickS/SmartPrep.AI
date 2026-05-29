import { ChatMessage } from '../../types/chat';
import { OpenRouterModel } from '../../types/models';

export interface StreamOptions {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onError: (error: string) => void;
  onStart?: () => void;
}

export const defaultModelPresets: OpenRouterModel[] = [
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini 1.5 Flash (Preset)',
    description: 'Fast, lightweight, highly capable model from Google with large context window.',
    contextLength: 1000000,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini (Preset)',
    description: 'Cost-efficient, super fast intelligence from OpenAI.',
    contextLength: 128000,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (Preset)',
    description: 'OpenAI flagship high-performance model for complex reasoning and tasks.',
    contextLength: 128000,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Preset)',
    description: 'State of the art reasoning, coding, and writing from Anthropic.',
    contextLength: 200000,
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (Preset)',
    description: 'Advanced reasoning, coding, and logical capacity.',
    contextLength: 64000,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B (Preset)',
    description: 'Highly capable open-source instruction-tuned model from Meta.',
    contextLength: 131000,
  }
];

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
        } : undefined
      }));
    }
    return defaultModelPresets;
  } catch (e) {
    console.error('Error fetching models, returning presets:', e);
    return defaultModelPresets;
  }
}

export async function streamChatCompletions({
  apiKey,
  model,
  messages,
  temperature,
  signal,
  onChunk,
  onError,
  onStart
}: StreamOptions): Promise<void> {
  try {
    if (onStart) onStart();

    // Map messages to format expected by OpenAI/OpenRouter (omit system prompts if empty, format role/content)
    const formattedMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    const response = await fetch('/api/openrouter/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        temperature,
        stream: true,
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
      
      // Save the last incomplete line to process in the next chunk
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
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              onChunk(content);
            }
          } catch (err) {
            // Keep parsing other lines if a single line fails to parse
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
