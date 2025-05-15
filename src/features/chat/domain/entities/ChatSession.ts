import { TimeOfDay } from '../types/TimeOfDay';
import { CHAT_CONFIG } from '@/lib/chat/constants/config';

export interface ChatSession {
  id: string;
  clienteId: string;
  aliasMesa: string;
  startedAt: Date;
  lastActive: Date;
  systemContext: string;
  timeOfDay: TimeOfDay;
}

export class ChatSessionImpl implements ChatSession {
  constructor(
    private readonly _id: string,
    private readonly _clienteId: string,
    private readonly _aliasMesa: string,
    private readonly _startedAt: Date,
    private _lastActive: Date,
    private readonly _systemContext: string,
    private readonly _timeOfDay: TimeOfDay
  ) {}

  get id(): string {
    return this._id;
  }

  get clienteId(): string {
    return this._clienteId;
  }

  get aliasMesa(): string {
    return this._aliasMesa;
  }

  get startedAt(): Date {
    return this._startedAt;
  }

  get lastActive(): Date {
    return this._lastActive;
  }

  get systemContext(): string {
    return this._systemContext;
  }

  get timeOfDay(): TimeOfDay {
    return this._timeOfDay;
  }

  updateLastActive(): void {
    this._lastActive = new Date();
  }

  isInactive(): boolean {
    const now = new Date();
    const inactiveTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutos
    return this._lastActive < inactiveTime;
  }

  toJSON(): Record<string, string> {
    return {
      id: this._id,
      clienteId: this._clienteId,
      aliasMesa: this._aliasMesa,
      startedAt: this._startedAt.toISOString(),
      lastActive: this._lastActive.toISOString(),
      systemContext: this._systemContext,
      timeOfDay: this._timeOfDay
    };
  }

  static fromJSON(data: Record<string, string>): ChatSessionImpl {
    return new ChatSessionImpl(
      data.id,
      data.clienteId,
      data.aliasMesa,
      new Date(data.startedAt),
      new Date(data.lastActive),
      data.systemContext,
      data.timeOfDay as TimeOfDay
    );
  }
} 