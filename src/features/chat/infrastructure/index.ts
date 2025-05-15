import { createClient } from '@supabase/supabase-js';
import { 
  SessionRepository,
  ChatRepository,
  MenuRepository,
  OpenAIClient,
  TimeProvider
} from '@/features/chat/domain/ports';
import { SupabaseSessionRepository } from './repositories/SupabaseSessionRepository';
import { SupabaseChatRepository } from './repositories/SupabaseChatRepository';
import { SupabaseMenuRepository } from './repositories/SupabaseMenuRepository';
import { SupabaseSlotRepository } from './repositories/SupabaseSlotRepository';
import { OpenAIService } from './services/OpenAIService';
import { TimeService } from './services/TimeService';

export interface InfrastructureConfig {
  supabase: {
    url: string;
    key: string;
  };
  openai: {
    apiKey: string;
    organization?: string;
  };
}

export class Infrastructure {
  public readonly sessionRepository: SessionRepository;
  public readonly chatRepository: ChatRepository;
  public readonly menuRepository: MenuRepository;
  public readonly openAIClient: OpenAIClient;
  public readonly timeProvider: TimeProvider;

  constructor(config: InfrastructureConfig) {
    const supabase = createClient(config.supabase.url, config.supabase.key);

    this.sessionRepository = new SupabaseSessionRepository(supabase);
    this.chatRepository = new SupabaseChatRepository(supabase);
    this.menuRepository = new SupabaseMenuRepository(supabase);
    this.openAIClient = new OpenAIService(config.openai);
    this.timeProvider = new TimeService();
  }
}

// Export all repositories
export { SupabaseSessionRepository } from './repositories/SupabaseSessionRepository';
export { SupabaseChatRepository } from './repositories/SupabaseChatRepository';
export { SupabaseMenuRepository } from './repositories/SupabaseMenuRepository';
export { SupabaseSlotRepository } from './repositories/SupabaseSlotRepository';

// Export all services
export { OpenAIService } from './services/OpenAIService';
export { TimeService } from './services/TimeService';

// Export all other modules
// export * from './controllers';
// export * from './constants';
// export * from './openai'; 