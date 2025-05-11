import { NextResponse } from 'next/server';
import { ChatService } from '@/lib/chat/service';

const chatService = new ChatService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  process.env.OPENAI_API_KEY!,
  {
    model: 'text-embedding-3-small',
    dimensions: 1536,
    encodingFormat: 'float'
  }
);

export async function POST(request: Request) {
  try {
    const { message, sessionId } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await chatService.processMessage(message, sessionId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 