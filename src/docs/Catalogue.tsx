import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  DetectField,
  FireButton,
  FiringField,
  InView,
  MosaicBackground,
  Reading,
  RestingField,
  SignalHeadline,
  Spike,
  State,
  Stimulating,
  SynapseField,
  Trace,
  Wordmark,
  type Tone,
} from '@/phantom';
import './docs.css';

const DARK = [
  { name: 'Void', hex: '#000000', use: 'Fields, the hero, text and actions on light' },
  { name: 'Cleft', hex: '#1C1C1C', use: 'Surfaces and hairlines on dark' },
];

const REST = [
  { name: 'Dendrite', hex: '#8F8F8F', use: 'Resting signal and secondary text on dark' },
  { name: 'Resting', hex: '#5C5C5C', use: 'Resting signal and secondary text on light' },
  { name: 'Rule', hex: '#D4D4D4', use: 'Hairlines on light' },
  { name: 'Glia', hex: '#E6E6E6', use: 'Light surfaces' },
  { name: 'Membrane', hex: '#F4F4F4', use: 'The page' },
];

const LOOP: { step: string; title: string; body: string; field: ReactNode; wide?: boolean }[] = [
  {
    step: '1',
    title: 'Sense',
    body: 'Mosaic. The muscle as black and white tiles of signal, read continuously by the sleeve. The default background for anything about sensing.',
    field: <MosaicBackground tile={12} />,
  },
  {
    step: '2',
    title: 'Detect',
    body: 'Synaptic Shift. Grey tendrils that pulse while the personal model reads the guarding pattern. Nothing has fired yet.',
    field: <DetectField />,
  },
  {
    step: '3',
    title: 'Trigger',
    body: 'Web Threads. The synapse: threads meet at bright junctions and a decision crosses the gap. Point at the junctions; click to send a pulse across. Use it wherever one part hands off to another.',
    field: <SynapseField />,
    wide: true,
  },
  {
    step: '4',
    title: 'Stimulate',
    body: 'Neural Flash. The storm of white light when Phantom starts TENS. The brightest field in the system; one per view, for that moment only.',
    field: <FiringField />,
  },
  {
    step: '5',
    title: 'Adapt',
    body: 'Neural Float. Filaments settling as relief builds, the nerve returning to rest. Quiet sections, loading and empty states.',
    field: <RestingField />,
  },
];

// Illustrative only: the shape of an sEMG envelope during a guarding episode, not a recording.
const ENVELOPE = [12, 14, 13, 15, 14, 22, 38, 61, 74, 69, 52, 33, 21, 16, 14].map((value, i) => ({ value, label: `${i * 2}s` }));

function Section({ id, title, intro, children }: { id: string; title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <section className="ds-row" aria-labelledby={id}>
      <div className="ds-row__head">
        <h2 id={id} className="t-title">
          {title}
        </h2>
        <div className="t-note">{intro}</div>
      </div>
      <div className="ds-row__body">{children}</div>
    </section>
  );
}

function Swatch({ name, hex, use, chip }: { name: string; hex: string; use: string; chip?: string }) {
  return (
    <li className="ds-swatch">
      <span className={`ds-swatch__chip ${chip ?? ''}`} style={{ background: chip ? undefined : hex }} />
      <span className="t-heading">{name}</span>
      <span className="t-reading ds-swatch__hex">{hex}</span>
      <span className="t-note">{use}</span>
    </li>
  );
}

function Hero() {
  const [tone, setTone] = useState<Tone>('rest');
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const fire = () => {
    window.clearTimeout(timer.current);
    setTone('fire');
    timer.current = window.setTimeout(() => setTone('rest'), 1400);
  };

  return (
    <header className="ds-hero on-dark">
      <div className="ds-hero__field">
        <MosaicBackground tone={tone} tile={16} />
      </div>
      <div className="ds-hero__scrim" />
      <div className="ds-hero__inner">
        <div className="ds-hero__top">
          <Wordmark size="1.5rem" firing={tone === 'fire'} />
          <span className="ds-hero__state" aria-live="polite">
            <State is={tone === 'fire' ? 'fire' : 'rest'}>{tone === 'fire' ? 'Pulse firing' : 'At rest'}</State>
          </span>
        </div>
        <div className="ds-hero__main">
          <SignalHeadline text="Phantom" className="t-hero" trigger="mount" />
          <p className="t-lede">Pain relief that listens to your body. This is its design system, built on how a nerve fires.</p>
          <FireButton onClick={fire}>Fire a pulse</FireButton>
        </div>
      </div>
    </header>
  );
}

export default function Catalogue() {
  const [stimulating, setStimulating] = useState(false);

  return (
    <>
      <Hero />
      <main className="ds-board">
        <Section
          id="idea"
          title="Firing is light"
          intro={
            <p>
              A resting neuron is dark. When it fires, it lights up, then recovers. Phantom works the same way: it stays still until the muscles
              signal pain, and the interface does too. There is no colour in the system. Brightness is the signal.
            </p>
          }
        >
          <div className="ds-rules">
            <figure className="ds-rule">
              <div className="ds-rule__stage">
                <Spike width={200} />
              </div>
              <figcaption>
                <strong>At rest, grey.</strong> Everything that isn't happening right now sits in greys, on black or white.
              </figcaption>
            </figure>
            <figure className="ds-rule">
              <button type="button" className="ds-rule__stage ds-rule__stage--press" onClick={(e) => e.currentTarget.classList.toggle('is-on')} aria-label="Fire the spike">
                <Spike width={200} className="ds-rule__spike" />
              </button>
              <figcaption>
                <strong>Firing is light.</strong> Pure white with a glow means a pulse is firing, and only ever on dark. Press the trace.
              </figcaption>
            </figure>
            <figure className="ds-rule">
              <div className="ds-rule__stage surface--latent">TBD: plot of our own sEMG</div>
              <figcaption>
                <strong>Unmeasured is an empty cell.</strong> Anything we haven't measured yet is a dashed outline that says so, never a borrowed number.
              </figcaption>
            </figure>
          </div>
        </Section>

        <Section id="colour" title="Colour" intro={<p>Black and white only. Greys hold the resting state; pure white light is kept for a pulse firing, and only on black.</p>}>
          <h3 className="t-heading ds-sub">The dark</h3>
          <ul className="ds-swatches">
            {DARK.map((c) => (
              <Swatch key={c.name} {...c} />
            ))}
          </ul>
          <h3 className="t-heading ds-sub">
            <State is="rest" />
          </h3>
          <ul className="ds-swatches">
            {REST.map((c) => (
              <Swatch key={c.name} {...c} />
            ))}
          </ul>
          <div className="surface surface--void on-dark ds-firing">
            <h3 className="t-heading">
              <State is="fire">Firing</State>
            </h3>
            <ul className="ds-swatches">
              <Swatch name="Impulse" hex="#FFFFFF" use="A neuron firing. Stimulate, trigger" chip="ds-swatch__chip--lit" />
              <Swatch name="Glow" hex="rgba(255, 255, 255, 0.55)" use="The halo around anything firing" chip="ds-swatch__chip--glow" />
            </ul>
          </div>
          <h3 className="t-heading ds-sub">
            <State is="latent" />
          </h3>
          <ul className="ds-swatches">
            <Swatch name="Latent" hex="1.5px dashed" use="Not measured yet. An outline, not a colour" chip="ds-swatch__chip--latent" />
          </ul>
        </Section>

        <Section
          id="type"
          title="Type"
          intro={
            <p>
              Schibsted Grotesk throughout: heavy and tight for headlines, as the deck sets them, with tabular figures so live readings don't jitter. The
              scale steps by a perfect fourth.
            </p>
          }
        >
          <div className="ds-type">
            <div className="ds-type__row">
              <span className="t-note">Hero, 800</span>
              <span className="t-hero ds-type__hero">Phantom</span>
            </div>
            <div className="ds-type__row">
              <span className="t-note">Display, 750</span>
              <span className="t-display">Phantom makes your body the switch</span>
            </div>
            <div className="ds-type__row">
              <span className="t-note">Title, 700</span>
              <span className="t-title">Two modules and a personalized model</span>
            </div>
            <div className="ds-type__row">
              <span className="t-note">Heading, 650</span>
              <span className="t-heading">Sensing sleeve</span>
            </div>
            <div className="ds-type__row">
              <span className="t-note">Lede, 400</span>
              <span className="t-lede">Pain relief that arrives when your body asks for it.</span>
            </div>
            <div className="ds-type__row">
              <span className="t-note">Body, 400</span>
              <span className="t-body">
                The sleeve reads the muscles around the knee. A personal model learns your guarding pattern, and when it sees one, Phantom starts TENS.
                Relief builds over minutes.
              </span>
            </div>
            <div className="ds-type__row">
              <span className="t-note">Voice, 500 italic</span>
              <span className="t-lede t-voice">Stimulate when pain happens, at a dose set to you.</span>
            </div>
            <div className="ds-type__row">
              <span className="t-note">Figure, 800 tabular</span>
              <span className="t-figure">
                0.8 s
              </span>
            </div>
          </div>
        </Section>

        <Section
          id="fields"
          title="The loop, as fields"
          intro={
            <p>
              Five backgrounds, one for each step of the closed loop. Each is a React Bits shader recoloured to the system. Fields mount only when they
              scroll near, so a page never runs more than it shows.
            </p>
          }
        >
          <ol className="ds-loop">
            {LOOP.map((s) => (
              <li key={s.title} className={`ds-loop__step ${s.wide ? 'ds-loop__step--wide' : ''}`}>
                <div className="ds-loop__field">
                  <InView>{s.field}</InView>
                  <span className="ds-loop__label on-dark">
                    <span className="t-reading">{s.step}</span>
                    <span className="t-heading">{s.title}</span>
                  </span>
                </div>
                <p className="t-note">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="components"
          title="Components"
          intro={
            <p>
              Each one wraps a React Bits source with the system's rule built in. Import them from <code>@/phantom</code>, never from{' '}
              <code>@/components</code>.
            </p>
          }
        >
          <div className="ds-grid">
            <article className="ds-cell ds-cell--wide surface--void ds-cell--dark on-dark">
              <h3 className="t-heading">Stimulating</h3>
              <p className="t-note">Electric Border. Current runs around the surface only while a session does. Off, it's the same surface at rest.</p>
              <div className="ds-stage">
                <Stimulating active={stimulating} className="ds-session">
                  <div className="surface ds-session__card ds-session__card--cleft">
                    <State is={stimulating ? 'fire' : 'rest'} />
                    <p className="t-display">{stimulating ? 'Relief session running' : 'Listening to your knee'}</p>
                    <p className="t-note">{stimulating ? '34 minutes left. Relief builds over the first few.' : 'Phantom will start a session when your muscles guard.'}</p>
                    <button type="button" className="btn btn--quiet" onClick={() => setStimulating((v) => !v)}>
                      {stimulating ? 'Stop session' : 'Start a session now'}
                    </button>
                  </div>
                </Stimulating>
              </div>
            </article>

            <article className="ds-cell surface--void ds-cell--dark on-dark">
              <h3 className="t-heading">Actions</h3>
              <p className="t-note">Click Spark on the fire action, so pressing it reads as a synapse firing. It is lit, so it lives on dark. Every other action is a grey cell or an outline.</p>
              <div className="ds-stage ds-stage--row">
                <FireButton>Start relief</FireButton>
                <button type="button" className="btn">
                  Calibrate sleeve
                </button>
                <button type="button" className="btn btn--quiet">
                  Log pain now
                </button>
              </div>
            </article>

            <article className="ds-cell">
              <h3 className="t-heading">States</h3>
              <p className="t-note">One mark per step of the loop. Only the firing state moves.</p>
              <div className="ds-stage ds-stage--column">
                <State is="rest" />
                <State is="detect" />
                <State is="fire" />
                <State is="latent" />
              </div>
            </article>

            <article className="ds-cell">
              <h3 className="t-heading">Readings</h3>
              <p className="t-note">Count Up, once, when the figure is seen. Never lit: a number is evidence, not a pulse.</p>
              <div className="ds-stage ds-stage--column">
                <Reading to={595} suffix="M" label="people lived with osteoarthritis in 2020; the knee is the most affected joint" />
                <Reading to={75} prefix="+" suffix="%" label="projected growth in knee OA cases by 2050" />
              </div>
            </article>

            <article className="ds-cell">
              <h3 className="t-heading">Trace</h3>
              <p className="t-note">Simple Graph for signals over time. Below: an illustrative sEMG envelope through one guarding episode, not a recording.</p>
              <div className="ds-stage">
                <Trace data={ENVELOPE} height={200} />
              </div>
            </article>

            <article className="ds-cell ds-cell--wide surface--void ds-cell--dark on-dark">
              <h3 className="t-heading">Signal headline</h3>
              <p className="t-note">Signal Type. Letters light up the way a nerve does: dark, a couple of flickers, then held. Once per page, on dark.</p>
              <div className="ds-stage">
                <SignalHeadline as="p" text="Help us close the loop" className="t-display" />
              </div>
            </article>
          </div>
        </Section>

        <Section id="use" title="Using it" intro={<p>The CSS layer works on its own. The React layer adds the fields and components.</p>}>
          <pre className="ds-code">
            <code>{`import '../design-system/phantom.css';
import { MosaicBackground, FireButton, Stimulating, Reading, State } from '@/phantom';

<div style={{ height: '70vh' }}>
  <MosaicBackground tone={firing ? 'fire' : 'rest'} />
</div>

<button className="btn">Calibrate sleeve</button>
<span className="state state--detect">Reading</span>`}</code>
          </pre>
        </Section>
      </main>
      <footer className="ds-foot">
        <Wordmark size="1.25rem" />
        <span className="t-note">Shaders and components from React Bits, adapted for Phantom. <a href="#/">Back to the landing page</a></span>
      </footer>
    </>
  );
}
