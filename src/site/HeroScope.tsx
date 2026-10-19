import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// A simulated sEMG trace for the hero, running the closed loop on repeat:
// quiet muscle, a guarding burst, Phantom firing TENS, recovery. Not a recording.

export type Phase = 'rest' | 'detect' | 'fire' | 'recover';

const DURATION: Record<Phase, number> = { rest: 2600, detect: 1800, fire: 2600, recover: 1300 };
const NEXT: Record<Phase, Phase> = { rest: 'detect', detect: 'fire', fire: 'recover', recover: 'rest' };

export interface ScopeReading {
  phase: Phase;
  microvolts: number;
}

export interface HeroScopeHandle {
  /** Jump straight to firing, as if the model had just detected guarding. */
  fire: () => void;
}

interface Sample {
  v: number;
  phase: Phase;
}

const PX_PER_FRAME = 3;

export const HeroScope = forwardRef<HeroScopeHandle, { onPhase: (p: Phase) => void; onReading: (r: ScopeReading) => void; still?: boolean }>(
  function HeroScope({ onPhase, onReading, still = false }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const phaseRef = useRef<Phase>('rest');
    const phaseStart = useRef(0);
    const forceFire = useRef(false);
    const cb = useRef({ onPhase, onReading });
    cb.current = { onPhase, onReading };

    useImperativeHandle(ref, () => ({
      fire: () => {
        forceFire.current = true;
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let w = 0;
      let h = 0;
      let samples: Sample[] = [];
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const resize = () => {
        const r = canvas.getBoundingClientRect();
        w = Math.max(1, Math.round(r.width));
        h = Math.max(1, Math.round(r.height));
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const cols = Math.ceil(w / PX_PER_FRAME) * PX_PER_FRAME;
        while (samples.length < cols) samples.unshift({ v: 0, phase: 'rest' });
        samples = samples.slice(-cols);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      let raf = 0;
      let tensClock = 0;
      let lastReport = 0;
      let envelope = 0.1;

      const setPhase = (p: Phase, now: number) => {
        phaseRef.current = p;
        phaseStart.current = now;
        tensClock = 0;
        cb.current.onPhase(p);
      };

      // one new sample: EMG is band-limited noise under an envelope; TENS is a train of sharp pulses
      const sample = (now: number): Sample => {
        const p = phaseRef.current;
        const t = (now - phaseStart.current) / DURATION[p];
        let target = 0.1;
        if (p === 'detect') target = 0.12 + 0.75 * Math.min(1, t * 1.3);
        if (p === 'recover') target = 0.5 * (1 - t) + 0.1;
        envelope += (target - envelope) * 0.08;
        if (p === 'fire') {
          tensClock += 1;
          const k = tensClock % 14;
          const v = k === 0 ? 0.92 : k === 1 ? -0.38 : k === 2 ? -0.12 : (Math.random() - 0.5) * 0.04;
          return { v, phase: p };
        }
        const noise = (Math.random() - 0.5) * 2 * 0.65 + Math.sin(now / 37) * 0.35;
        return { v: noise * envelope, phase: p };
      };

      const colorFor = (p: Phase) => (p === 'fire' ? '#ffffff' : p === 'detect' ? '#d0d0d0' : p === 'recover' ? '#a8a8a8' : '#6e6e6e');

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        const mid = h * 0.55;
        // baseline
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, mid);
        ctx.lineTo(w, mid);
        ctx.stroke();

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        let i = 0;
        while (i < samples.length - 1) {
          const p = samples[i].phase;
          ctx.beginPath();
          ctx.strokeStyle = colorFor(p);
          ctx.lineWidth = p === 'fire' ? 2 : 1.5;
          ctx.shadowColor = p === 'fire' ? 'rgba(255,255,255,0.8)' : 'transparent';
          ctx.shadowBlur = p === 'fire' ? 12 : 0;
          const x0 = w - (samples.length - 1 - i);
          ctx.moveTo(x0, mid - samples[i].v * h * 0.45);
          while (i < samples.length - 1 && samples[i + 1].phase === p) {
            i += 1;
            ctx.lineTo(w - (samples.length - 1 - i), mid - samples[i].v * h * 0.45);
          }
          if (i < samples.length - 1) {
            i += 1;
            ctx.lineTo(w - (samples.length - 1 - i), mid - samples[i].v * h * 0.45);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        // the write head
        const last = samples[samples.length - 1];
        ctx.fillStyle = colorFor(last.phase);
        ctx.beginPath();
        ctx.arc(w - 2, mid - last.v * h * 0.45, last.phase === 'fire' ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
      };

      if (still) {
        // a fixed frame: quiet, a burst, then a pulse train, so the idea reads without motion
        const now = performance.now();
        const fill: Phase[] = ['rest', 'detect', 'fire', 'recover'];
        const per = Math.floor(samples.length / fill.length);
        samples = [];
        fill.forEach((p) => {
          phaseRef.current = p;
          phaseStart.current = now - DURATION[p] * 0.6;
          for (let k = 0; k < per; k++) samples.push(sample(now + k * 16));
        });
        phaseRef.current = 'rest';
        draw();
        return () => ro.disconnect();
      }

      // the first rest is short, so the first pulse lands while the headline is still settling
      setPhase('rest', performance.now() - 1300);
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (forceFire.current) {
          forceFire.current = false;
          if (phaseRef.current !== 'fire') setPhase('fire', now);
        } else if (now - phaseStart.current > DURATION[phaseRef.current]) {
          setPhase(NEXT[phaseRef.current], now);
        }
        for (let k = 0; k < PX_PER_FRAME; k++) {
          samples.push(sample(now));
          samples.shift();
        }
        draw();
        if (now - lastReport > 120) {
          lastReport = now;
          const p = phaseRef.current;
          const uv = p === 'fire' ? 0 : Math.round(8 + envelope * 260 + Math.random() * 4);
          cb.current.onReading({ phase: p, microvolts: uv });
        }
      };
      raf = requestAnimationFrame(frame);

      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
      };
    }, [still]);

    return <canvas ref={canvasRef} className="scope" aria-hidden="true" />;
  },
);
