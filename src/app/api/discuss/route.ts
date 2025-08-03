import { NextRequest, NextResponse } from 'next/server';
import { DiscussionEngine } from '@/lib/discussion-engine';
import { conversationManager } from '@/lib/conversation-manager';
import { AIProvider, FollowUpContext } from '@/lib/types';

const discussionEngine = new DiscussionEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      question, 
      selectedProviders, 
      maxRounds = 3, 
      conversationId,
      moderatorProvider
    } = body;

    // Validate input
    if (!question || !selectedProviders || selectedProviders.length === 0) {
      return NextResponse.json(
        { error: 'Question and at least one AI provider are required' },
        { status: 400 }
      );
    }

    // Validate providers
    const validProviders = ['openai', 'gemini', 'claude', 'ollama'];
    const providers: AIProvider[] = selectedProviders.filter((p: AIProvider) => 
      validProviders.includes(p.id) && p.enabled
    );

    if (providers.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid provider must be enabled' },
        { status: 400 }
      );
    }

    // Get conversation context if this is a follow-up
    let context: FollowUpContext | undefined;
    let targetConversationId = conversationId;

    if (conversationId) {
      const conversationContext = conversationManager.getConversationContext(conversationId);
      context = {
        originalQuestion: conversationContext.previousQuestions[0] || question,
        previousAnswers: conversationContext.previousAnswers,
        conversationHistory: []
      };
    } else {
      // Create new conversation if none provided
      const newConversation = conversationManager.createConversation(question);
      targetConversationId = newConversation.id;
    }

    console.log(`Starting discussion with ${providers.length} providers...`);
    const result = await discussionEngine.startDiscussion(
      question, 
      providers, 
      maxRounds, 
      context,
      moderatorProvider
    );

    // Save discussion to conversation
    if (targetConversationId) {
      conversationManager.addDiscussion(targetConversationId, result);
    }

    return NextResponse.json({ 
      ...result, 
      conversationId: targetConversationId 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const providers = await discussionEngine.getAvailableProviders();
    return NextResponse.json({ providers });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get providers' },
      { status: 500 }
    );
  }
} 