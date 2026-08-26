"use client";

import * as React from "react";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number; // in ms
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: boolean;
  className?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 2000,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = true,
  className,
}: CountUpProps) {
  const [count, setCount] = React.useState<number>(from);
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const animateCount = () => {
      const startTime = performance.now();

      const updateCounter = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic formula for organic deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = from + (to - from) * easeOut;

        setCount(currentVal);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          setCount(to);
        }
      };

      requestAnimationFrame(updateCounter);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateCount();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [to, from, duration]);

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals);
    if (!separator) return fixed;

    const parts = fixed.split(".");
    parts[0] = parseInt(parts[0], 10).toLocaleString("en-US");
    return parts.join(".");
  };

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}
