import { NextRequest, NextResponse } from 'next/server';
import { conversationManager } from '@/lib/conversation-manager';

export async function GET() {
  try {
    const conversations = conversationManager.getAllConversations();
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return NextResponse.json(
      { error: 'Failed to get conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstQuestion } = body;

    if (!firstQuestion) {
      return NextResponse.json(
        { error: 'First question is required' },
        { status: 400 }
      );
    }

    const conversation = conversationManager.createConversation(firstQuestion);
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
} 