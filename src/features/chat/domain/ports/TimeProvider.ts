export interface TimeProvider {
  // Obtención de tiempo actual
  getCurrentTime(): Date;
  
  // Obtención de período del día
  getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night';
} 