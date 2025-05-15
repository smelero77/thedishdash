import { NextRequest, NextResponse } from 'next/server';
import { ChatController } from '@/features/chat/infrastructure/controllers/ChatController';
import { createChatUseCase } from '@/features/chat/infrastructure/factories/chatUseCaseFactory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const useCase = createChatUseCase();
    const controller = new ChatController(useCase);
    const response = await controller.handleChat(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 