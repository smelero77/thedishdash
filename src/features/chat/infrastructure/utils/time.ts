export function getTimeOfDay(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'mañana';
  } else if (hour >= 12 && hour < 18) {
    return 'tarde';
  } else {
    return 'noche';
  }
}

export function isWithinTimeRange(hour: number, startHour: number, endHour: number): boolean {
  return hour >= startHour && hour < endHour;
} 