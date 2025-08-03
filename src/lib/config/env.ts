// Environment configuration with system priority
export const env = {
  // AI Provider API Keys (System env has priority over .env files)
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    required: true,
  },
  google: {
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    required: true,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    required: true,
  },
  
  // Optional configurations
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    required: false,
  },
  
  // App settings
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'AI Konsültasyon',
    maxRounds: parseInt(process.env.DISCUSSION_MAX_ROUNDS || '3'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};

// Validation function
export function validateEnvironment() {
  const missing: string[] = [];
  
  if (!env.openai.apiKey) missing.push('OPENAI_API_KEY');
  if (!env.google.apiKey) missing.push('GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY');
  if (!env.anthropic.apiKey) missing.push('ANTHROPIC_API_KEY');
  
  if (missing.length > 0) {
    const errorMessage = `
🚨 Missing required environment variables:
${missing.map(key => `  - ${key}`).join('\n')}

You can set them in:
1. System environment (.zshrc, .bashrc) - RECOMMENDED
2. .env.local file in project root

For system environment (priority):
export OPENAI_API_KEY="your-key-here"
export GEMINI_API_KEY="your-key-here"  
export ANTHROPIC_API_KEY="your-key-here"

Then restart your terminal and run: npm run dev
    `;
    
    if (env.app.nodeEnv === 'development') {
      console.error(errorMessage);
    }
    
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ All required environment variables are set');
  console.log(`📊 Configuration loaded from: ${getConfigSource()}`);
}

function getConfigSource(): string {
  const sources: string[] = [];
  
  // Check which source each key comes from
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_')) {
    sources.push('System environment');
  }
  
  if (sources.length === 0) {
    sources.push('.env files');
  }
  
  return sources.join(', ');
}

// Export individual configs for easy access
export const openaiConfig = {
  apiKey: env.openai.apiKey!,
};

export const googleConfig = {
  apiKey: env.google.apiKey!,
};

export const anthropicConfig = {
  apiKey: env.anthropic.apiKey!,
};

export const ollamaConfig = {
  baseUrl: env.ollama.baseUrl,
};

export const appConfig = {
  name: env.app.name,
  maxRounds: env.app.maxRounds,
  nodeEnv: env.app.nodeEnv,
}; 