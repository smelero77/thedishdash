import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SupabaseSlotRepository } from '@/features/chat/infrastructure/repositories/SupabaseSlotRepository';
import { TimeService } from '@/features/chat/infrastructure/services/TimeService';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const slotRepository = new SupabaseSlotRepository(supabase);
    const timeService = new TimeService();

    // Obtener todos los slots
    const slots = await slotRepository.getAllSlots();
    
    // Obtener el slot actual basado en la hora
    const currentTime = timeService.getCurrentTime();
    const currentSlot = slots.find(slot => {
      const startTime = new Date(`1970-01-01T${slot.startTime}`);
      const endTime = new Date(`1970-01-01T${slot.endTime}`);
      const time = new Date(`1970-01-01T${currentTime}`);
      return time >= startTime && time <= endTime;
    });

    if (!currentSlot) {
      return NextResponse.json(
        { error: 'No active slot found' },
        { status: 404 }
      );
    }

    return NextResponse.json(currentSlot);

  } catch (error) {
    console.error('Error fetching current slot:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch current slot', details: errorMessage },
      { status: 500 }
    );
  }
} 