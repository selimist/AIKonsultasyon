import { NextRequest } from 'next/server';
import { DiscussionEngine } from '@/lib/discussion-engine';
import { AIProvider, DiscussionMessage } from '@/lib/types';

const discussionEngine = new DiscussionEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, selectedProviders, maxRounds = 3, moderatorProvider } = body;

    // Validate input
    if (!question || !selectedProviders || selectedProviders.length === 0) {
      return new Response('Invalid input', { status: 400 });
    }

    // Validate providers
    const validProviders = ['openai', 'gemini', 'claude', 'ollama'];
    const providers: AIProvider[] = selectedProviders.filter((p: AIProvider) => 
      validProviders.includes(p.id) && p.enabled
    );

    if (providers.length === 0) {
      return new Response('No valid providers', { status: 400 });
    }

    // Create a readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await discussionEngine.streamDiscussion(
            question,
            providers,
            maxRounds,
            // onMessage callback
            (message: DiscussionMessage) => {
              const data = JSON.stringify({ type: 'message', message: message });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            },
            // onConsensus callback
            (hasConsensus: boolean, finalAnswer?: string) => {
              const data = JSON.stringify({ 
                type: 'finalAnswer', 
                finalAnswer: finalAnswer 
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            },
            undefined, // context
            moderatorProvider
          );

          // Send completion signal
          const completeData = JSON.stringify({ type: 'complete' });
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
          controller.close();
        } catch (error) {
          const errorData = JSON.stringify({ 
            type: 'error', 
            data: { message: 'Discussion failed' } 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Streaming API Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 