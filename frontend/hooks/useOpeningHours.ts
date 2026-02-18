import { useEffect, useState } from 'react';
import { getNextOpeningTime, isCurrentlyOpen, OpeningHours } from '@/lib/opening-hours';

export function useOpeningHours(openingHours?: OpeningHours | null) {
  const [isOpen, setIsOpen] = useState(() => isCurrentlyOpen(openingHours));
  const [nextOpening, setNextOpening] = useState(() => getNextOpeningTime(openingHours));

  useEffect(() => {
    console.log('[useOpeningHours] Opening hours changed:', {
      hasOpeningHours: !!openingHours,
      enabled: openingHours?.enabled,
      isOpen: isCurrentlyOpen(openingHours)
    });
    
    const update = () => {
      const newIsOpen = isCurrentlyOpen(openingHours);
      const newNextOpening = getNextOpeningTime(openingHours);
      setIsOpen(newIsOpen);
      setNextOpening(newNextOpening);
    };

    update();

    // Update every minute
    const intervalId = setInterval(update, 60_000);
    return () => clearInterval(intervalId);
  }, [openingHours]);

  return {
    isOpen,
    nextOpening,
    enabled: Boolean(openingHours ? openingHours.enabled !== false : true),
  };
}

