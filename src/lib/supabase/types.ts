export interface Database {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string;
          customer_id: string;
          table_number: string;
          started_at: string;
          last_active: string;
          system_context: string;
          time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
          is_active: boolean;
        };
        Insert: {
          id?: string;
          customer_id: string;
          table_number: string;
          started_at: string;
          last_active: string;
          system_context: string;
          time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
          is_active: boolean;
        };
        Update: {
          id?: string;
          customer_id?: string;
          table_number?: string;
          started_at?: string;
          last_active?: string;
          system_context?: string;
          time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night';
          is_active?: boolean;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant' | 'staff';
          content: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'user' | 'assistant' | 'staff';
          content: string;
          timestamp: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'user' | 'assistant' | 'staff';
          content?: string;
          timestamp?: string;
        };
      };
    };
  };
} 