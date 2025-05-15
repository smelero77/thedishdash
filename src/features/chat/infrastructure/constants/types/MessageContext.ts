import { Message } from '../../../domain/entities/Message';
import { TimeOfDay } from '../../../domain/types/TimeOfDay';
import { WeatherContext } from './WeatherContext';

export interface MessageContext {
  weather?: WeatherContext;
  timeOfDay: TimeOfDay;
  previousMessages: Message[];
  currentSlot?: string;
} 