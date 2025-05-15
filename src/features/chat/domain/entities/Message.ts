import { CHAT_CONFIG } from '@/lib/chat/constants/config';

export interface IMessage {
  id: string;
  sessionId: string;
  sender: 'guest' | 'assistant';
  content: string;
  createdAt: Date;
}

export class Message implements IMessage {
  private _id: string;
  private _sessionId: string;
  private _sender: 'guest' | 'assistant';
  private _content: string;
  private _createdAt: Date;

  constructor(
    id: string,
    sessionId: string,
    sender: 'guest' | 'assistant',
    content: string,
    createdAt: Date = new Date()
  ) {
    this.validateContent(content);
    this._id = id;
    this._sessionId = sessionId;
    this._sender = sender;
    this._content = content;
    this._createdAt = createdAt;
  }

  get id(): string {
    return this._id;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get sender(): 'guest' | 'assistant' {
    return this._sender;
  }

  get content(): string {
    return this._content;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  private validateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('El contenido del mensaje no puede estar vacío');
    }

    if (content.length > CHAT_CONFIG.MESSAGES.MAX_LENGTH) {
      throw new Error(`El mensaje excede el límite de ${CHAT_CONFIG.MESSAGES.MAX_LENGTH} caracteres`);
    }

    if (content.length < CHAT_CONFIG.MESSAGES.MIN_LENGTH) {
      throw new Error(`El mensaje debe tener al menos ${CHAT_CONFIG.MESSAGES.MIN_LENGTH} caracteres`);
    }
  }

  toJSON() {
    return {
      id: this._id,
      sessionId: this._sessionId,
      sender: this._sender,
      content: this._content,
      createdAt: this._createdAt.toISOString()
    };
  }

  static fromJSON(data: any): Message {
    return new Message(
      data.id,
      data.sessionId,
      data.sender,
      data.content,
      new Date(data.createdAt)
    );
  }
} 