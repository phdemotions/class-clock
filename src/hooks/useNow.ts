import { useEffect, useState } from "react";

/** Current time, updated exactly on each new second. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, 1000 - (Date.now() % 1000) + 5);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);
  return now;
}
