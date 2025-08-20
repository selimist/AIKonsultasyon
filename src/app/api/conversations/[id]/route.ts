import { NextRequest, NextResponse } from 'next/server'
import { conversationManager } from '@/lib/conversation-manager'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, { params }: any) {
  const { id } = params
  const conversation = conversationManager.getConversation(id)

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  return NextResponse.json({ conversation })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, { params }: any) {
  const { id } = params
  const deleted = conversationManager.deleteConversation(id)

  if (!deleted) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
