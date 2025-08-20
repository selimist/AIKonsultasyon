import { NextRequest, NextResponse } from 'next/server'
import { conversationManager } from '@/lib/conversation-manager'

// ✅ Next.js App Router doğru tip imzası
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const conversation = conversationManager.getConversation(id)

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Failed to get conversation:', error)
    return NextResponse.json({ error: 'Failed to get conversation' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const deleted = conversationManager.deleteConversation(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete conversation:', error)
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
  }
}
