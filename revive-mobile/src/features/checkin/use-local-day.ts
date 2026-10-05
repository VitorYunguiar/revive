import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { localDateKey } from '@/domain/formats';

export function useLocalDay() {
  const [day, setDay] = useState(() => localDateKey());
  useEffect(() => {
    const update = () => setDay(localDateKey());
    // Covers midnight and timezone changes while the form remains open.
    const timer = setInterval(update, 30_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') update();
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return day;
}
