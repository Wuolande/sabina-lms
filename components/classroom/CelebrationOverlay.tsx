"use client";

import * as React from "react";

interface CelebrationOverlayProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
  count?: number;
}

export function CelebrationOverlay({
  show,
  onComplete,
  message = "Awesome Job! Keep up the great work!",
  count = 1,
}: CelebrationOverlayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!show) return;

    // Play pleasant audio chime using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };
      // Victory fanfare arpeggio: C5 - E5 - G5 - C6
      playTone(523.25, 0, 0.25);
      playTone(659.25, 0.15, 0.25);
      playTone(783.99, 0.3, 0.3);
      playTone(1046.50, 0.45, 0.6);
    } catch {}

    // Confetti particles simulation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#F9C31C", "#14209C", "#10B981", "#EC4899", "#8B5CF6", "#F59E0B", "#3B82F6"];
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      vx: number;
      vy: number;
      rot: number;
      vRot: number;
      shape: "circle" | "rect" | "star";
    }> = [];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height * 0.45 + (Math.random() - 0.5) * 100,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.9) * 20,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.6 ? "star" : Math.random() > 0.3 ? "rect" : "circle",
      });
    }

    let animationFrame: number;
    let startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 3500) {
        if (onComplete) onComplete();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45; // gravity
        p.rot += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          // Star
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + i * 72) * Math.PI) / 180) * p.size);
            ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (p.size / 2));
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Floating Trophy & Reward Card */}
      <div className="relative z-10 flex flex-col items-center gap-3 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.35)] text-center animate-bounce duration-1000 max-w-sm mx-4">
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse">
          <span className="text-5xl select-none">🏆</span>
          <div className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-xs px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
            +{count}
          </div>
        </div>

        <div>
          <span className="inline-block text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full mb-1">
            Praise Awarded!
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
            Trophy Received!
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xs font-medium leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
