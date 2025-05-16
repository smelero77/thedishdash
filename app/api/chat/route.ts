import { NextResponse } from 'next/server';
import { ChatService } from '@/lib/chat';
import { EMBEDDING_CONFIG } from '@/lib/embeddings/constants/config';
import { v4 as uuidv4 } from 'uuid';
import { isValidUUID } from '@/utils/validation';

// Validar variables de entorno
const requiredEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

// Verificar que todas las variables de entorno necesarias estén definidas
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const chatService = new ChatService(
  process.env.OPENAI_API_KEY!,
  EMBEDDING_CONFIG
);

export async function POST(request: Request) {
  try {
    const { message: userMessage, sessionId, alias, categoryId } = await request.json();
    console.log('Mensaje recibido:', { userMessage, sessionId, alias, categoryId });
    
    if (!userMessage || !alias) {
      console.log('Error: Faltan mensaje o alias');
      return NextResponse.json(
        { error: 'Faltan mensaje o alias' },
        { status: 400 }
      );
    }

    // 1) Si no hay sessionId válido, crea nueva
    let sid = isValidUUID(sessionId) ? sessionId : uuidv4();
    if (sid !== sessionId) {
      console.log('Usando nueva sesión:', sid);
    }

    // 2) Procesa el mensaje
    console.log('Procesando mensaje...');
    try {
      const result = await chatService.processMessage(sid, alias, userMessage, categoryId);
      console.log('Resultado del procesamiento:', JSON.stringify(result, null, 2));
      
      // 3) Devuelve respuesta estructurada + sessionId
      return NextResponse.json({
        response: result,
        sessionId: sid
      });
    } catch (error) {
      console.error('Error detallado en chatService.processMessage:', error);
      
      // Manejar errores específicos de OpenAI
      if (error instanceof Error && error.message.includes('OpenAI')) {
        console.error('Error de OpenAI:', error);
        return NextResponse.json(
          { error: 'Error al conectar con el servicio de IA' },
          { status: 503 }
        );
      }

      // Manejar errores de Supabase
      if (error instanceof Error && error.message.includes('Supabase')) {
        console.error('Error de Supabase:', error);
        return NextResponse.json(
          { error: 'Error al conectar con la base de datos' },
          { status: 503 }
        );
      }

      throw error; // Re-lanzar otros errores para el manejo general
    }
  } catch (error) {
    console.error('Error detallado en el procesamiento del mensaje:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 