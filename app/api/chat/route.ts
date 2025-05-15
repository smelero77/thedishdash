import { NextRequest, NextResponse } from 'next/server';
import { ChatController } from '@/features/chat/infrastructure/controllers/ChatController';
import { ChatRequest } from '@/features/chat/infrastructure/controllers/types';
import { createChatUseCase } from '@/features/chat/infrastructure/factories/chatUseCaseFactory';

// Crear una instancia del controlador
const chatController = new ChatController(createChatUseCase());

export async function POST(request: NextRequest) {
  console.log('=== INICIO DEL ENDPOINT DE CHAT ===');

  try {
    const body = await request.json();
    console.log('1. Request body:', body);

    const { message, sessionId, tableNumber, alias, weather, categoryId } = body;

    // Mapear correctamente a ChatRequest
    const chatRequest: ChatRequest = {
      message,
      deviceId: alias,
      tableCode: tableNumber?.toString() || '0',
      weather,
      categoryId,
      sessionId
    };

    console.log('2. Request mapeado:', chatRequest);

    const result = await chatController.handleChat(chatRequest);
    console.log('3. Respuesta del controlador:', result);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error en el endpoint:', err);
    return NextResponse.json(
      { 
        error: err.message || 'Error interno del servidor',
        details: err.stack
      }, 
      { status: 500 }
    );
  } finally {
    console.log('=== FIN DEL ENDPOINT DE CHAT ===\n');
  }
} 