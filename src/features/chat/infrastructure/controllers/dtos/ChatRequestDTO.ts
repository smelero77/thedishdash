import { WeatherContext } from '@/features/chat/domain/entities/WeatherContext';

export interface ChatRequestDTO {
  message: string;
  deviceId: string;
  tableCode: string;
  weather?: WeatherContext;
}

export class ChatRequestDTOValidator {
  static validate(dto: ChatRequestDTO): string[] {
    const errors: string[] = [];
    if (!dto.message?.trim()) errors.push('El mensaje es requerido');
    if (!dto.deviceId?.trim()) errors.push('El ID del dispositivo es requerido');
    if (!dto.tableCode?.trim()) errors.push('El código de mesa es requerido');
    return errors;
  }
} 