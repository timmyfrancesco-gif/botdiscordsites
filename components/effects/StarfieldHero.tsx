"use client";

import { useEffect, useRef } from "react";

interface StarfieldHeroProps {
  className?: string;
  /** "r,g,b" decimal triplet used for the mid-trail glow of each streak. */
  color?: string;
}

interface Streak {
  x: number;
  y: number;
  len: number;
  sp: number;
  a: number;
  phase: "in" | "out";
  fadeInSpeed: number;
  fadeOutSpeed: number;
  angle: number;
}

/**
 * Occasional diagonal shooting-star streaks drawn on a transparent canvas,
 * ported from the reference theme's hero background effect. Spawns rarely
 * (~0.4% chance per frame), fades each streak in then out as it travels.
 */
export default function StarfieldHero({ className = "", color = "255,170,174" }: StarfieldHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let streaks: Streak[] = [];
    let raf = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    function spawn() {
      if (!canvas) return;
      if (Math.random() > 0.996) {
        streaks.push({
          x: Math.random() * canvas.width * 0.7,
          y: Math.random() * canvas.height * 0.5,
          len: Math.random() * 80 + 60,
          sp: Math.random() * 5 + 4,
          a: 0,
          phase: "in",
          fadeInSpeed: Math.random() * 0.06 + 0.04,
          fadeOutSpeed: Math.random() * 0.018 + 0.01,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        });
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      spawn();

      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i];

        if (s.phase === "in") {
          s.a += s.fadeInSpeed;
          if (s.a >= 1) {
            s.a = 1;
            s.phase = "out";
          }
        } else {
          s.a -= s.fadeOutSpeed;
          if (s.a <= 0) {
            streaks.splice(i, 1);
            continue;
          }
        }

        const tx = s.x + Math.cos(s.angle) * s.len;
        const ty = s.y + Math.sin(s.angle) * s.len;
        const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.5, `rgba(${color}, ${s.a * 0.5})`);
        grad.addColorStop(1, `rgba(255,255,255, ${s.a})`);

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        s.x += Math.cos(s.angle) * s.sp;
        s.y += Math.sin(s.angle) * s.sp;
      }

      raf = requestAnimationFrame(draw);
    }

    if (!reduceMotion) {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      streaks = [];
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
