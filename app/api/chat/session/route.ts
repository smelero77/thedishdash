import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SupabaseSessionRepository } from '@/features/chat/infrastructure/repositories/SupabaseSessionRepository';
import { SupabaseChatRepository } from '@/features/chat/infrastructure/repositories/SupabaseChatRepository';
import { CHAT_HISTORY_LIMIT } from '@/features/chat/domain/constants/chat';

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId');
    const tableNumber = request.nextUrl.searchParams.get('tableNumber');

    if (!customerId || !tableNumber) {
      return NextResponse.json(
        { error: 'Customer ID and table number are required' }, 
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const sessionRepository = new SupabaseSessionRepository(supabase);
    const chatRepository = new SupabaseChatRepository(supabase);

    // Intentar obtener una sesión activa para el cliente
    let session = await sessionRepository.getActiveSessionByCustomerId(customerId);

    // Si no hay sesión activa o ha expirado, crear una nueva
    if (!session || new Date(session.lastActive) < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      session = await sessionRepository.createSession(customerId, tableNumber);
    }

    // Obtener el historial de mensajes
    const messages = await chatRepository.getMessageHistory(session.id);

    // Ordenar mensajes por fecha de creación
    const sortedMessages = messages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return NextResponse.json({
      sessionId: session.id,
      lastActive: session.lastActive,
      messages: sortedMessages,
    });

  } catch (error) {
    console.error('Error fetching chat session:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch chat session', details: errorMessage }, 
      { status: 500 }
    );
  }
} 