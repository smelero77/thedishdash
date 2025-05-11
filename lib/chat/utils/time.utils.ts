export const getTimeOfDay = (hour: number): string => {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'noon';
  if (hour >= 16 && hour < 20) return 'afternoon';
  if (hour >= 20 && hour < 24) return 'evening';
  return 'night';
}; 