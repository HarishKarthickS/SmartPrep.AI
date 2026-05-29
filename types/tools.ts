export interface ToolInput {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string;
}

export interface AITool {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  inputs: ToolInput[];
  systemPrompt: string;
  userPromptTemplate: string; // template string with double braces like {{topic}}
  modelPreset?: string;
}

export interface AIToolRun {
  id: string;
  toolId: string;
  inputs: Record<string, string>;
  output: string;
  timestamp: number;
  model: string;
}
