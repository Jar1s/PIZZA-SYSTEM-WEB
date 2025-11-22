/**
 * Utility functions for handling opening hours and automatic maintenance mode
 */

// OpeningHours type - defined locally since it's not exported from shared
interface OpeningHours {
  enabled: boolean;
  timezone?: string;
  days: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
}

/**
 * Get current day name in lowercase (monday, tuesday, etc.)
 */
export function getCurrentDayName(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current time in minutes since midnight (local time or timezone)
 */
function getCurrentTimeMinutes(timezone?: string): number {
  const now = timezone 
    ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    : new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Check if the restaurant is currently open based on opening hours
 */
export function isCurrentlyOpen(openingHours: OpeningHours | null | undefined): boolean {
  if (!openingHours || !openingHours.enabled) {
    return true; // If not configured, assume always open
  }

  const currentDay = getCurrentDayName();
  const daySchedule = openingHours.days[currentDay];

  if (!daySchedule || daySchedule.closed) {
    return false; // Closed today
  }

  const currentTime = getCurrentTimeMinutes(openingHours.timezone);
  const openTime = timeToMinutes(daySchedule.open);
  const closeTime = timeToMinutes(daySchedule.close);

  // Handle overnight hours (e.g., 22:00 - 02:00)
  if (closeTime < openTime) {
    // Open overnight
    return currentTime >= openTime || currentTime < closeTime;
  } else {
    // Normal hours
    return currentTime >= openTime && currentTime < closeTime;
  }
}

/**
 * Get next opening time (for display purposes)
 */
export function getNextOpeningTime(openingHours: OpeningHours | null | undefined): string | null {
  if (!openingHours || !openingHours.enabled) {
    return null;
  }

  const currentDay = getCurrentDayName();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayIndex = days.indexOf(currentDay);

  // Check today first
  const todaySchedule = openingHours.days[currentDay];
  if (todaySchedule && !todaySchedule.closed) {
    const currentTime = getCurrentTimeMinutes(openingHours.timezone);
    const closeTime = timeToMinutes(todaySchedule.close);
    
    // If still open today, return today's close time
    if (currentTime < closeTime) {
      return `Dnes do ${todaySchedule.close}`;
    }
  }

  // Find next open day
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = days[nextDayIndex];
    const nextDaySchedule = openingHours.days[nextDay];

    if (nextDaySchedule && !nextDaySchedule.closed) {
      const dayNames = {
        sunday: 'Nedeľa',
        monday: 'Pondelok',
        tuesday: 'Utorok',
        wednesday: 'Streda',
        thursday: 'Štvrtok',
        friday: 'Piatok',
        saturday: 'Sobota',
      };
      return `${dayNames[nextDay as keyof typeof dayNames]} ${nextDaySchedule.open} - ${nextDaySchedule.close}`;
    }
  }

  return null; // No opening hours found
}

/**
 * Get default opening hours (all days 10:00 - 22:00)
 */
export function getDefaultOpeningHours(): OpeningHours {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const defaultDays: OpeningHours['days'] = {};
  
  days.forEach(day => {
    defaultDays[day] = {
      open: '10:00',
      close: '22:00',
      closed: false,
    };
  });

  return {
    enabled: false,
    timezone: 'Europe/Bratislava',
    days: defaultDays,
  };
}

