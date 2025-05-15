import type { Slot } from '@/types/menu';

/**
 * Determina el Slot activo basado en la hora actual y una lista de slots.
 * @param slots Array de objetos Slot disponibles.
 * @param currentDate Objeto Date que representa la hora actual (o la hora a comprobar).
 * @returns El objeto Slot activo o null si ninguno está activo.
 */
export function getCurrentSlot(slots: Slot[], currentDate: Date = new Date()): Slot | null {
    if (!slots || slots.length === 0) {
        return null;
    }

    const currentTimeInMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

    const activeSlot = slots.find(slot => {
        const [startHour, startMinute] = slot.start_time.split(':').map(Number);
        const [endHour, endMinute] = slot.end_time.split(':').map(Number);
        let slotStartMinutes = startHour * 60 + startMinute;
        let slotEndMinutes = endHour * 60 + endMinute;

        if (isNaN(slotStartMinutes) || isNaN(slotEndMinutes)) {
            console.warn(`[getCurrentSlot] Slot con ID ${slot.id} ('${slot.name}') tiene tiempos inválidos: ${slot.start_time} - ${slot.end_time}`);
            return false;
        }

        if (slotEndMinutes < slotStartMinutes) {
            return currentTimeInMinutes >= slotStartMinutes || currentTimeInMinutes < slotEndMinutes;
        } else {
            return currentTimeInMinutes >= slotStartMinutes && currentTimeInMinutes < slotEndMinutes;
        }
    });

    return activeSlot || null;
} 