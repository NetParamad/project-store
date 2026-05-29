"use client";

import { useRef, useEffect, type ReactNode } from "react";

export function Marquee({ children, speed = 1 }: { children: ReactNode; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf: number;
    let isPaused = false;

    const pause = () => { isPaused = true; };
    const resume = () => { isPaused = false; };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause);
    el.addEventListener("touchend", resume);

    let last = performance.now();
    function tick(now: number) {
      if (!el) return;
      if (!isPaused && el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0;
      }
      if (!isPaused) {
        el.scrollLeft += (now - last) * 0.05 * speed;
      }
      last = now;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [speed]);

  return (
    <div ref={ref} className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-6">
        {children}
      </div>
    </div>
  );
}
