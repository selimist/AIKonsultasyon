import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if required environment variables are set
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGoogle = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

    const allServicesHealthy = hasOpenAI && hasGoogle && hasAnthropic;
    const status = allServicesHealthy ? 'healthy' : 'unhealthy';

    // Determine configuration source
    const configSource = process.env.OPENAI_API_KEY?.startsWith('sk-') ? 'Environment variables' : 'Configuration files';

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        openai: hasOpenAI,
        google: hasGoogle,
        anthropic: hasAnthropic
      },
      configuration: {
        source: configSource,
        maxRounds: parseInt(process.env.DISCUSSION_MAX_ROUNDS || '3'),
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed' 
      },
      { status: 500 }
    );
  }
} 