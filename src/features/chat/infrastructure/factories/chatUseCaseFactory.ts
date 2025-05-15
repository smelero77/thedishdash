import { supabase } from '@/lib/supabase/client';
import { ChatUseCase } from '@/features/chat/application/use-cases/ChatUseCase';
import { 
  SessionRepository,
  ChatRepository,
  MenuRepository,
  SlotRepository,
  OpenAIClient,
  TimeProvider
} from '@/features/chat/domain/ports';
import { 
  SupabaseSessionRepository,
  SupabaseChatRepository,
  SupabaseMenuRepository,
  SupabaseSlotRepository,
  OpenAIService,
  TimeService
} from '@/features/chat/infrastructure';
import { 
  FilterService,
  SlotService,
  RecommendationService 
} from '@/features/chat/domain/services';
import { CHAT_CONFIG } from '@/lib/chat/constants/config';

export function createChatUseCase(): ChatUseCase {
  // Crear servicios
  const timeSvc: TimeProvider = new TimeService();
  const openAI: OpenAIClient = new OpenAIService(
    process.env.OPENAI_API_KEY || '',
    {
      model: CHAT_CONFIG.model,
      dimensions: CHAT_CONFIG.dimensions
    }
  );

  // Crear repositorios
  const sessionRepo: SessionRepository = new SupabaseSessionRepository(supabase);
  const chatRepo: ChatRepository = new SupabaseChatRepository(supabase);
  const menuRepo: MenuRepository = new SupabaseMenuRepository(supabase, openAI);
  const slotRepo: SlotRepository = new SupabaseSlotRepository(supabase);

  // Crear servicios de dominio
  const filterSvc = new FilterService(openAI);
  const slotSvc = new SlotService(slotRepo, timeSvc);
  const recSvc = new RecommendationService(menuRepo);

  // Crear y retornar el caso de uso
  return new ChatUseCase(
    sessionRepo,
    chatRepo,
    filterSvc,
    slotSvc,
    recSvc
  );
} 