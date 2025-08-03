import { NextResponse } from 'next/server';
import { AIModel } from '@/lib/types';

// OpenAI models
async function getOpenAIModels(): Promise<AIModel[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      console.warn('OpenAI models API failed, using fallback');
      return [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000 },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', contextWindow: 128000 },
      ];
    }
    
    const data = await response.json() as { data: Array<{ id: string }> };
    return data.data
      .filter((model) => model.id.includes('gpt-4'))
      .map((model) => ({
        id: model.id,
        name: model.id.toUpperCase(),
        provider: 'openai',
        contextWindow: 128000,
      }));
  } catch (error) {
    console.error('OpenAI models error:', error);
    return [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000 },
    ];
  }
}

// Gemini models
async function getGeminiModels(): Promise<AIModel[]> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    
    if (!response.ok) {
      console.warn('Gemini models API failed, using fallback');
      return [
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', provider: 'gemini', contextWindow: 1000000 },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', contextWindow: 1000000 },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', contextWindow: 2000000 },
      ];
    }
    
    const data = await response.json() as { models?: Array<{ name: string }> };
    return data.models?.map((model) => {
      const realModelName = model.name.split('/')[1]; // Extract the actual model name
      return {
        id: model.name, // Keep full name as ID for API calls
        name: realModelName.toUpperCase(),
        provider: 'gemini',
        contextWindow: 1000000, // Default context window
      };
    }) || [];
  } catch (error) {
    console.error('Gemini models error:', error);
    return [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', provider: 'gemini', contextWindow: 1000000 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', contextWindow: 1000000 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', contextWindow: 2000000 },
    ];
  }
}

// Claude models
async function getClaudeModels(): Promise<AIModel[]> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': `${process.env.ANTHROPIC_API_KEY}`,
        'anthropic-version': '2023-06-01',
      },
    });
    
    if (!response.ok) {
      console.warn('Claude models API failed, using fallback');
      return [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'claude', contextWindow: 200000 },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'claude', contextWindow: 200000 },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'claude', contextWindow: 200000 },
      ];
    }
    
    const data = await response.json() as { data?: Array<{ id: string, display_name?: string }> };
    return data.data?.map((model) => ({
      id: model.id,
      name: model.display_name || model.id.toUpperCase(),
      provider: 'claude',
      contextWindow: 200000, // Default context window
    })) || [];
  } catch (error) {
    console.error('Claude models error:', error);
    return [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'claude', contextWindow: 200000 },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'claude', contextWindow: 200000 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'claude', contextWindow: 200000 },
    ];
  }
}

// Ollama models
async function getOllamaModels(): Promise<AIModel[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    
    if (!response.ok) {
      console.warn('Ollama not available, using fallback');
      return [
        { id: 'llama3.1', name: 'Llama 3.1', provider: 'ollama', contextWindow: 128000 },
        { id: 'mistral', name: 'Mistral', provider: 'ollama', contextWindow: 32000 },
      ];
    }
    
    const data = await response.json() as { models?: Array<{ name: string }> };
    return data.models?.map((model) => ({
      id: model.name,
      name: model.name.charAt(0).toUpperCase() + model.name.slice(1),
      provider: 'ollama',
      contextWindow: 8000, // Default context window
    })) || [];
  } catch (error) {
    console.error('Ollama models error:', error);
    return [
      { id: 'llama3.1', name: 'Llama 3.1 (Install Ollama)', provider: 'ollama', contextWindow: 128000 },
    ];
  }
}

export async function GET() {
  try {
    const [openaiModels, geminiModels, claudeModels, ollamaModels] = await Promise.all([
      getOpenAIModels(),
      getGeminiModels(),
      getClaudeModels(),
      getOllamaModels(),
    ]);

    const providers = [
      {
        id: 'openai',
        name: 'OpenAI',
        enabled: true,
        models: openaiModels,
        selectedModel: 'gpt-4o',
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        enabled: true,
        models: geminiModels,
        selectedModel: 'gemini-2.0-flash-exp',
      },
      {
        id: 'claude',
        name: 'Anthropic Claude',
        enabled: true,
        models: claudeModels,
        selectedModel: 'claude-3-5-sonnet-20241022',
      },
      {
        id: 'ollama',
        name: 'Ollama (Local)',
        enabled: true,
        models: ollamaModels,
        selectedModel: ollamaModels[0]?.id || 'llama3.1',
      },
    ];

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Models API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
} 