import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '@/features/chat';

const chatService = new ChatService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, customerId, tableNumber, message, context } = body;

    if (!customerId || !tableNumber || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const response = await chatService.processMessage(
      sessionId,
      customerId,
      tableNumber,
      message,
      context
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 