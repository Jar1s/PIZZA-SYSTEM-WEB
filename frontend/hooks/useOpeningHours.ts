import { useEffect, useState } from 'react';
import { getNextOpeningTime, isCurrentlyOpen, OpeningHours } from '@/lib/opening-hours';

export function useOpeningHours(openingHours?: OpeningHours | null) {
  const [isOpen, setIsOpen] = useState(() => isCurrentlyOpen(openingHours));
  const [nextOpening, setNextOpening] = useState(() => getNextOpeningTime(openingHours));

  useEffect(() => {
    const update = () => {
      setIsOpen(isCurrentlyOpen(openingHours));
      setNextOpening(getNextOpeningTime(openingHours));
    };

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [openingHours]);

  return { isOpen, nextOpening };
}
