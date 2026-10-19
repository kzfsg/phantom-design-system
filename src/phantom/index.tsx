// Phantom React layer. Import from "@/phantom"; never from "@/components", which holds raw React Bits sources.
// Every preset here speaks the system's one rule: firing is light. Grey in the dark at rest, white glow only while a pulse fires.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Mosaic from '@/components/Mosaic';
import NeuralFloat from '@/components/NeuralFloat';
import SynapticShift from '@/components/SynapticShift';
import NeuralFlash from '@/components/NeuralFlash';
import ElectricBorder from '@/components/ElectricBorder';
import ClickSpark from '@/components/ClickSpark';
import CountUp from '@/components/CountUp';
import SignalType from '@/components/SignalType';
import SimpleGraph, { type DataPoint } from '@/components/SimpleGraph';
import WebThreads from '@/components/WebThreads';
import { color } from './tokens';
import './phantom.css';

export { color } from './tokens';
export type { DataPoint };

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** Mounts its children only once they come near the viewport, so a page of fields
 *  never holds more WebGL contexts than it shows. */
export function InView({ children, className, margin = '200px' }: { children: ReactNode; className?: string; margin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShown(entry.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return (
    <div ref={ref} className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {shown && children}
    </div>
  );
}

// ── fields: the four states of the nerve, as backgrounds ─────────────────────

export type Tone = 'rest' | 'fire';

/** Tissue. Black and white tiles over slow waves of resting signal. `tone="fire"` floods
 *  the waves with light without restarting the shader. Fills its parent. */
export function MosaicBackground({ tone = 'rest', tile = 14, children }: { tone?: Tone; tile?: number; children?: ReactNode }) {
  const reduced = useReducedMotion();
  const fire = tone === 'fire';
  return (
    <div className="ph-field" style={{ background: color.void }}>
      <Mosaic
        speed={reduced ? 0 : 0.6}
        color1={fire ? color.impulse : color.axon}
        color2={color.soma}
        color3={fire ? color.impulse : color.dendrite}
        pixelSize={tile}
        borderIntensity={0.55}
        waveIntensity={fire ? 2 : 1.4}
        waveWidth={1.4}
        quality="medium"
      >
        {children}
      </Mosaic>
    </div>
  );
}

/** Rest. Filaments drifting through the dark: the nerve before anything happens. */
export function RestingField({ children }: { children?: ReactNode }) {
  return (
    <div className="ph-field">
      <NeuralFloat
        colorCold={color.soma}
        colorHot={color.axon}
        backgroundColor={color.void}
        speed={0.45}
        strands={10}
        pulseSpeed={2.5}
        coreIntensity={0.7}
        haloStrength={0.4}
        chromaticAberration={0}
        dpr={1.5}
      >
        {children}
      </NeuralFloat>
    </div>
  );
}

/** Detect. Tendrils pulse and shift as the model reads the muscle. Still grey: nothing has fired. */
export function DetectField({ children }: { children?: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <div className="ph-field" style={{ background: color.void }}>
      <SynapticShift color={color.dendrite} speed={reduced ? 0 : 0.35} intensity={1.6} complexity={8} breathing={!reduced} />
      {children && <div className="ph-field__content">{children}</div>}
    </div>
  );
}

/** Synapse. Threads meeting at bright junctions; pointing lights them and a click carries a pulse across.
 *  For anything about connection: sensor to model, model to stimulator. */
export function SynapseField({ children }: { children?: ReactNode }) {
  return (
    <div className="ph-field" style={{ background: color.void }}>
      <WebThreads colors={[color.soma, color.axon]} coreColor={color.impulse} backgroundColor={color.void} threadCount={7} nodes={3} pinch={0.7} glow={0.03} speed={0.18} pulses={1} dpr={1.5} />
      {children && <div className="ph-field__content">{children}</div>}
    </div>
  );
}

/** Fire. A storm of white filaments: the moment Phantom starts TENS. The brightest thing in the system; use for that moment only. */
export function FiringField({ children }: { children?: ReactNode }) {
  return (
    <div className="ph-field">
      <NeuralFlash color={color.glia} hotColor={color.impulse} backgroundColor={color.void} speed={0.7} intensity={2.2} density={2.2} contrast={1.6}>
        {children}
      </NeuralFlash>
    </div>
  );
}

// ── marks and type ───────────────────────────────────────────────────────────

/** An action potential: flat at rest, a sharp rise, an undershoot, recovery.
 *  Phantom's mark and its divider. `firing` sends light along the spike. */
export function Spike({ width = 160, firing = false, className }: { width?: number; firing?: boolean; className?: string }) {
  const h = width * 0.3;
  return (
    <svg className={`ph-spike ${firing ? 'is-firing' : ''} ${className ?? ''}`} width={width} height={h} viewBox="0 0 160 48" fill="none" aria-hidden>
      <path className="ph-spike__rest" d="M0 34 H58" />
      <path className="ph-spike__pulse" d="M58 34 C62 34 63 33 65 30 L72 3 L79 42 C81 46 84 44 88 39 C92 35 96 34 102 34" />
      <path className="ph-spike__rest" d="M102 34 H160" />
    </svg>
  );
}

/** The wordmark: Phantom with its spike. */
export function Wordmark({ size = '2rem', firing = false }: { size?: string; firing?: boolean }) {
  return (
    <span className="ph-wordmark" style={{ fontSize: size }}>
      <Spike width={64} firing={firing} />
      <span>Phantom</span>
    </span>
  );
}

/** A headline that lights up like a nerve: dark, a few flickers, then held. Once per page. */
export function SignalHeadline({ text, as = 'h1', className, trigger = 'view' }: { text: string; as?: 'h1' | 'h2' | 'p'; className?: string; trigger?: 'mount' | 'view' }) {
  return (
    <SignalType
      as={as}
      text={text}
      className={className}
      color="currentColor"
      glowColor={color.impulse}
      unlit="outline"
      outlineOpacity={0.22}
      glow={0.5}
      flickers={2}
      stagger={0.05}
      trigger={trigger}
      clickCycle={false}
      instability={0}
      interference={0}
    />
  );
}

// ── components ───────────────────────────────────────────────────────────────

/** The one lit action. Sparks at the press like a synapse firing. Place it on dark. */
export function FireButton({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <ClickSpark sparkColor={[color.impulse, color.axon]} sparkCount={10} sparkRadius={28} sparkSize={9} shape="streak" glow={0.6} duration={450} disabled={disabled} style={{ display: 'inline-block', width: 'auto', height: 'auto' }}>
      <button type="button" className="btn btn--fire" onClick={onClick} disabled={disabled}>
        {children}
      </button>
    </ClickSpark>
  );
}

/** A region where every click sparks like a synapse firing. On dark; fills its parent. */
export function SparkArea({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ClickSpark className={className} sparkColor={[color.impulse, color.axon]} sparkCount={14} sparkRadius={44} sparkSize={12} shape="streak" glow={0.7} duration={520}>
      {children}
    </ClickSpark>
  );
}

/** A surface that carries current while stimulation runs. `active={false}` is the same surface at rest. */
export function Stimulating({ active, children, className }: { active: boolean; children: ReactNode; className?: string }) {
  return (
    <ElectricBorder
      className={className}
      active={active}
      color={color.impulse}
      glowColor={color.impulse}
      borderRadius={28}
      chaos={0.45}
      strands={2}
      arcs={1}
      intensity={0.75}
      cursorRadius={70}
    >
      {children}
    </ElectricBorder>
  );
}

/** A figure that counts up once it's seen. Ink, never lit: a number is evidence, not a pulse. */
export function Reading({ to, prefix, suffix, decimals = 0, label }: { to: number; prefix?: string; suffix?: string; decimals?: number; label: ReactNode }) {
  return (
    <figure className="ph-reading">
      <CountUp
        to={to}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        duration={1.6}
        className="t-figure"
        style={{ color: 'currentColor' }}
      />
      <figcaption className="t-body">{label}</figcaption>
    </figure>
  );
}

/** A signal over time: an sEMG envelope, relief over a session. */
export function Trace({ data, height = 220, tone = 'rest' }: { data: DataPoint[]; height?: number; tone?: Tone }) {
  const line = tone === 'fire' ? color.ink : color.resting;
  return (
    <div className="ph-trace">
      <SimpleGraph data={data} height={height} lineColor={line} dotColor={line} curved gradientFade showGrid gridLines="horizontal" gridStyle="dotted" dotSize={6} graphLineThickness={2.5} animateOnScroll animateOnce />
    </div>
  );
}

export type LoopState = 'rest' | 'detect' | 'fire' | 'latent';

const STATE_LABEL: Record<LoopState, string> = { rest: 'At rest', detect: 'Reading', fire: 'Stimulating', latent: 'Not measured yet' };

/** A status mark for the loop. */
export function State({ is, children }: { is: LoopState; children?: ReactNode }) {
  return <span className={`state state--${is}`}>{children ?? STATE_LABEL[is]}</span>;
}
