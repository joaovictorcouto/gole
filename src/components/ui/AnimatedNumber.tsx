import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number; // ms
  decimals?: number;
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Smoothly tweens between previous and next numeric value using rAF.
 * Cancels in-flight tween if value changes mid-animation and resumes
 * from the current displayed value.
 */
export function AnimatedNumber({ value, duration = 600, decimals = 0, format, className, style }: Props) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(value);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    fromRef.current = display;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const text = format ? format(display) : display.toFixed(decimals);
  return <span className={className} style={style}>{text}</span>;
}
