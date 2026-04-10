import { useRef, useEffect, useCallback } from "react";

/**
 * Hook qui déclenche un callback une fois au click, puis en continu si on maintient.
 * Retourne les event handlers à passer sur le bouton.
 *
 * @param {() => void} onTick  Fonction appelée à chaque tick
 * @param {number}     delay   Délai avant répétition (ms, défaut 400)
 * @param {number}     interval Intervalle de répétition (ms, défaut 150)
 */
export function useHoldButton(onTick, delay = 400, interval = 150) {
  const intervalRef = useRef(null);
  const timeoutRef  = useRef(null);
  const tickRef     = useRef(onTick);
  useEffect(() => { tickRef.current = onTick; });

  const start = useCallback(() => {
    tickRef.current();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => tickRef.current(), interval);
    }, delay);
  }, [delay, interval]);

  const stop = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  }, []);

  return {
    onMouseDown:  start,
    onMouseUp:    stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd:   stop,
  };
}
