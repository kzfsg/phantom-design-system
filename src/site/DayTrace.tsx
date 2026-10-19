import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/phantom';

// One illustrative day, not patient data: when pain shows up, and when each kind of TENS runs.
const HOURS = 24;
const SCHEDULED = [8, 11, 14, 17, 20]; // open-loop sessions start on the hour and run 60 minutes
const PAIN = [3.2, 11.5, 15.4, 22.8]; // episodes arrive with no trigger, including at night
const DAY_MS = 9000;

const W = 960;
const X0 = 120;
const X1 = W - 24;
const x = (h: number) => X0 + ((X1 - X0) * h) / HOURS;

/** Spike path for a pulse at hour h on a baseline y. */
function pulsePath(h: number, y: number) {
  const c = x(h);
  return `M${c - 14} ${y} C${c - 9} ${y} ${c - 8} ${y - 2} ${c - 6} ${y - 6} L${c - 1} ${y - 34} L${c + 5} ${y + 10} C${c + 7} ${y + 14} ${c + 10} ${y + 11} ${c + 14} ${y + 4} C${c + 17} ${y + 1} ${c + 20} ${y} ${c + 26} ${y}`;
}

/** Scheduled TENS against pain, across one day. A playhead sweeps the day once it's seen;
 *  Phantom's pulse lights only as the playhead crosses each pain episode. */
export function DayTrace() {
  const reduced = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const raf = useRef(0);
  const [t, setT] = useState(0); // hours elapsed

  const play = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / DAY_MS);
      setT(p * HOURS);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (reduced) {
      setT(HOURS);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play();
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf.current);
    };
  }, [reduced, play]);

  const rowScheduled = 70;
  const rowPain = 150;
  const rowPhantom = 238;
  const ticks = [0, 6, 12, 18, 24];
  const clock = (h: number) => `${String(h % 24).padStart(2, '0')}:00`;

  return (
    <figure className="day">
      <svg ref={ref} className="day__svg" viewBox={`0 0 ${W} 300`} role="img" aria-labelledby="day-title day-desc">
        <title id="day-title">One day of knee pain, against two kinds of TENS</title>
        <desc id="day-desc">
          Scheduled TENS runs five hour-long sessions at 8, 11, 14, 17 and 20 o'clock. Pain arrives four times, at about 3:10, 11:30, 15:25 and 22:50, and
          three of those episodes fall outside a session. Phantom fires once at the start of each episode.
        </desc>

        {ticks.map((h) => (
          <g key={h}>
            <line className="day__grid" x1={x(h)} x2={x(h)} y1={30} y2={268} />
            <text className="day__tick" x={x(h)} y={292} textAnchor={h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}>
              {clock(h)}
            </text>
          </g>
        ))}

        <text className="day__label" x={0} y={rowScheduled + 5}>
          Scheduled
        </text>
        <line className="day__base" x1={X0} x2={X1} y1={rowScheduled} y2={rowScheduled} />
        {SCHEDULED.map((h) => (
          <rect key={h} className={`day__session ${t >= h ? 'is-on' : ''}`} x={x(h)} y={rowScheduled - 12} width={x(h + 1) - x(h)} height={24} rx={6} />
        ))}

        <text className="day__label" x={0} y={rowPain + 5}>
          Pain
        </text>
        <line className="day__base day__base--faint" x1={X0} x2={X1} y1={rowPain} y2={rowPain} />
        {PAIN.map((h) => (
          <g key={h} className={`day__pain ${t >= h ? 'is-on' : ''}`}>
            <circle cx={x(h)} cy={rowPain} r={9} />
            <circle className="day__pain-ring" cx={x(h)} cy={rowPain} r={20} />
          </g>
        ))}

        <text className="day__label day__label--lit" x={0} y={rowPhantom + 5}>
          Phantom
        </text>
        <line className="day__base" x1={X0} x2={X1} y1={rowPhantom} y2={rowPhantom} />
        {PAIN.map((h) => (
          <path key={h} className={`day__pulse ${t >= h ? 'is-lit' : ''}`} d={pulsePath(h, rowPhantom)} />
        ))}

        {t > 0 && t < HOURS && <line className="day__playhead" x1={x(t)} x2={x(t)} y1={24} y2={272} />}
      </svg>
      <figcaption className="day__caption">
        <span className="t-note">An illustrative day, not patient data. Three of four episodes land between scheduled sessions.</span>
        {!reduced && (
          <button type="button" className="btn btn--quiet btn--sm" onClick={play}>
            Replay the day
          </button>
        )}
      </figcaption>
    </figure>
  );
}
