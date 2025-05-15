export interface MessageConfig {
  maxLength: number;
  minLength: number;
}

export const DEFAULT_MESSAGE_CONFIG: MessageConfig = {
  maxLength: 1000,
  minLength: 3
}; 