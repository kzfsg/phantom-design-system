import { useEffect, useRef, useState } from 'react';
import { FiringField, InView, MosaicBackground, Reading, SignalHeadline, State, SynapseField, Trace, Wordmark, type Tone } from '@/phantom';
import { DayTrace } from './DayTrace';
import './landing.css';

const OPTIONS = [
  { name: 'Pain medication', body: 'NSAIDs and opioids carry real risks with long-term daily use.' },
  { name: 'Injections', body: 'Temporary relief that needs repeat clinic visits.' },
  { name: 'Knee replacement', body: 'Major surgery, usually a last resort.' },
  { name: 'TENS', body: 'Drug-free relief while it runs, but on a schedule or a button, not on pain.' },
];

const LOOP = [
  { n: '1', title: 'Sense', body: 'An sEMG sleeve reads the muscles around the knee, all day.' },
  { n: '2', title: 'Detect', body: 'A personal model learns your guarding pattern, the way your muscles brace when the knee hurts.' },
  { n: '3', title: 'Stimulate', body: 'Phantom starts TENS. Relief builds over minutes.', lit: true },
  { n: '4', title: 'Adapt', body: 'Next version: intensity tunes itself to each patient.', later: true },
];

const PIPELINE = [
  { stage: 'Raw sEMG', does: 'Continuous muscle signal' },
  { stage: 'Filter', does: 'Strip motion noise' },
  { stage: 'Classify', does: 'Muscle balance and movement' },
  { stage: 'Personalize', does: 'Calibrated to each patient' },
  { stage: 'Trigger', does: 'Start TENS, aiming for under a second', lit: true },
];

const ROADMAP = [
  { when: 'Today', title: 'Knee osteoarthritis', body: 'A non-invasive sleeve with sEMG and TENS.' },
  { when: 'Next', title: 'Every joint', body: 'Hips, back, shoulders and post-surgical rehab.' },
  { when: 'Platform', title: 'Remote monitoring', body: 'Clinicians see real pain episodes between visits.' },
  { when: 'Moonshot', title: 'An objective pain signal', body: 'Pain measured from muscles, not questionnaires, for clinics and drug trials.' },
];

const MILESTONES = [
  { when: 'Oct 2026', title: 'First prototype', body: 'sEMG and TENS, wired', done: true },
  { when: 'Nov 6', title: 'eWEAR pitch', body: 'Stanford', done: true },
  { when: 'TBD', title: 'Data collection', body: 'Patients tap pain; no TENS yet' },
  { when: 'TBD', title: 'TENS pilot', body: 'Clinic site; the user confirms each session' },
  { when: 'TBD', title: 'Regulatory', body: 'FDA 510(k) for the TENS, De Novo likely for the trigger' },
];

const TEAM = [
  { name: 'Rahul', study: 'Computer Science, year 3', story: 'Lives with arthritis himself.' },
  { name: 'Zheng Feng', study: 'Computer Science, year 3', story: 'An athlete drawn into physio and health tech.' },
  { name: 'Rynius', study: 'Business, year 3', story: 'Built a posture-correcting cushion.' },
  { name: 'Kaushik', study: 'Mechanical Engineering, final year', story: 'Built a knee-rehab device.' },
];

const ASKS = [
  { title: 'Clinical partners', body: 'Orthopedists and physical therapists to guide our studies.' },
  { title: 'Pilot sites', body: 'Clinics where patients can try Phantom.' },
  { title: 'Hires', body: 'EMG and biosignal machine-learning talent.' },
];

// Illustrative only: the shape of an sEMG envelope through one guarding episode, not a recording.
const ENVELOPE = [12, 14, 13, 15, 14, 22, 38, 61, 74, 69, 52, 33, 21, 16, 14].map((value, i) => ({ value, label: `${i * 2}s` }));

const NAV_IDLE_MS = 7000;

/** Glass nav state, as on Signal: scrolled, over a dark section (data-nav="dark"), or hidden after idling. */
function useNavState() {
  const [state, setState] = useState({ scrolled: false, dark: true, hidden: false });
  useEffect(() => {
    let idle = 0;
    const arm = () => {
      clearTimeout(idle);
      idle = window.setTimeout(() => setState((s) => ({ ...s, hidden: true })), NAV_IDLE_MS);
    };
    const update = () => {
      const probe = 36;
      const dark = [...document.querySelectorAll<HTMLElement>('[data-nav="dark"]')].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      setState({ scrolled: window.scrollY > 8, dark, hidden: false });
      arm();
    };
    const onPointer = (e: PointerEvent) => {
      if (e.clientY > 80) return;
      setState((s) => (s.hidden ? { ...s, hidden: false } : s));
      arm();
    };
    const onFocus = () => {
      setState((s) => (s.hidden ? { ...s, hidden: false } : s));
      arm();
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('focusin', onFocus);
    return () => {
      clearTimeout(idle);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('focusin', onFocus);
    };
  }, []);
  return state;
}

/** The hero fires once, after the headline lights: the page's one unprompted moment. */
function useOpeningPulse() {
  const [tone, setTone] = useState<Tone>('rest');
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timers.current.push(window.setTimeout(() => setTone('fire'), 1900));
    timers.current.push(window.setTimeout(() => setTone('rest'), 3300));
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);
  return tone;
}

export default function Landing() {
  const nav = useNavState();
  const tone = useOpeningPulse();

  return (
    <div className="site">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className={`nav${nav.scrolled ? ' is-scrolled' : ''}${nav.dark ? ' is-dark' : ''}${nav.hidden ? ' is-hidden' : ''}`}>
        <div className="wrap nav__inner">
          <a className="nav__brand" href="#/" aria-label="Phantom home">
            <Wordmark size="1.4rem" firing={tone === 'fire'} />
          </a>
          <nav aria-label="Sections">
            <ul className="nav__links">
              <li>
                <a href="#problem">The problem</a>
              </li>
              <li>
                <a href="#how">How it works</a>
              </li>
              <li>
                <a href="#evidence">Evidence</a>
              </li>
              <li>
                <a href="#team">Team</a>
              </li>
            </ul>
          </nav>
          <a className="btn btn--sm nav__cta" href="#join">
            Work with us
          </a>
        </div>
      </header>

      <main id="main">
        {/* hero: the tissue at rest, firing once */}
        <section className="hero on-dark" data-nav="dark">
          <div className="hero__field" aria-hidden="true">
            <MosaicBackground tone={tone} tile={16} />
          </div>
          <div className="hero__scrim" aria-hidden="true" />
          <div className="wrap hero__inner">
            <SignalHeadline text="Phantom" className="t-hero hero__mark" trigger="mount" />
            <p className="hero__title t-display">Pain relief that listens to your body.</p>
            <p className="t-lede">A closed-loop wearable for knee osteoarthritis. It reads your muscles and starts TENS when pain does.</p>
            <div className="hero__actions">
              <a className="btn btn--fire" href="#how">
                See how it works
              </a>
              <span className="hero__status" aria-live="polite">
                <State is={tone === 'fire' ? 'fire' : 'rest'}>{tone === 'fire' ? 'Pulse firing' : 'Listening'}</State>
              </span>
            </div>
          </div>
        </section>

        {/* problem */}
        <section className="band" id="problem">
          <div className="wrap split">
            <div className="split__copy">
              <h2 className="t-display">Arthritis pain doesn't keep a schedule.</h2>
              <blockquote className="quote">
                <p className="t-title t-voice">“I could be lying down, and my knee starts to hurt. All I can do is massage my leg. It never has a trigger.”</p>
                <footer className="t-body">Nirmala, 79</footer>
              </blockquote>
              <p className="t-body t-muted">The pain starts sharp, then settles into a dull ache that lasts for hours.</p>
            </div>
            <div className="split__figures">
              <Reading to={595} suffix="M" label="people lived with osteoarthritis in 2020. The knee is the most affected joint." />
              <Reading to={75} prefix="+" suffix="%" label="projected growth in knee osteoarthritis cases by 2050." />
              <p className="t-note">Source: GBD 2021 Osteoarthritis Collaborators, The Lancet Rheumatology, 2023.</p>
            </div>
          </div>
        </section>

        {/* options */}
        <section className="band band--glia">
          <div className="wrap">
            <h2 className="t-display band__head">Today's options all come with trade-offs.</h2>
            <dl className="options">
              {OPTIONS.map((o) => (
                <div key={o.name} className={`options__row ${o.name === 'TENS' ? 'options__row--tens' : ''}`}>
                  <dt className="t-title">{o.name}</dt>
                  <dd className="t-body">{o.body}</dd>
                </div>
              ))}
            </dl>
            <p className="t-lede t-voice options__close">Exercise and physical therapy come first. TENS is a drug-free add-on, and Phantom makes it smarter.</p>
          </div>
        </section>

        {/* the shift: schedule vs signal */}
        <section className="band band--void on-dark" data-nav="dark">
          <div className="wrap">
            <div className="band__head shift__head">
              <h2 className="t-display">TENS runs on a schedule, not on your pain.</h2>
              <p className="t-body">
                Open-loop devices like Quell restart 60-minute sessions on a timer or at the press of a button, whether or not pain is there. With fixed daily
                sessions, the body can build tolerance; in arthritic animal models, it appeared by day 4.
              </p>
            </div>
            <DayTrace />
            <p className="t-display shift__line is-lit">Stimulate when pain happens, at a dose set to you.</p>
            <p className="t-note shift__sources">
              Sources: Quell 2.0 product materials; NeuroMetrix (2020); Chandran and Sluka, Pain (2003); Sato et al., J Pain (2012); Dailey et al., Arthritis
              Rheumatol (2020).
            </p>
          </div>
        </section>

        {/* how it works: the loop over the synapse */}
        <section className="loop on-dark" id="how" data-nav="dark">
          <div className="loop__field" aria-hidden="true">
            <InView>
              <SynapseField />
            </InView>
          </div>
          <div className="loop__scrim" aria-hidden="true" />
          <div className="wrap loop__inner">
            <h2 className="t-display">Phantom makes your body the switch.</h2>
            <ol className="loop__steps">
              {LOOP.map((s) => (
                <li key={s.n} className={`loop__step ${s.lit ? 'is-lit-step' : ''}`}>
                  <span className="loop__n t-reading">{s.n}</span>
                  <h3 className="t-title">
                    {s.title}
                    {s.later && <span className="loop__later t-note"> V2</span>}
                  </h3>
                  <p className="t-body">{s.body}</p>
                </li>
              ))}
            </ol>
            <p className="t-note loop__note">
              Precedent: GrindCare already uses jaw sEMG to detect night-time clenching and trigger stimulation right away.
            </p>
          </div>
        </section>

        {/* inside */}
        <section className="band">
          <div className="wrap">
            <h2 className="t-display band__head">Two modules and a personalized model.</h2>
            <div className="inside">
              <div className="inside__hardware">
                <h3 className="t-heading">Hardware</h3>
                <div className="surface inside__module">
                  <p className="t-title">Sensing sleeve</p>
                  <p className="t-body">sEMG over the knee muscles, plus a motion sensor.</p>
                </div>
                <div className="surface inside__module">
                  <p className="t-title">TENS module</p>
                  <p className="t-body">Pads at the inner and outer knee joint line, paused while the sleeve reads.</p>
                </div>
                <div className="surface--latent inside__tbd">
                  <State is="latent" />
                  <p className="t-body">Wired v0 to wireless, battery life, wear time, and how older users put it on each day.</p>
                </div>
              </div>
              <div className="inside__pipeline">
                <h3 className="t-heading">Signal pipeline</h3>
                <ol className="pipeline">
                  {PIPELINE.map((p) => (
                    <li key={p.stage} className={`pipeline__stage ${p.lit ? 'is-trigger' : ''}`}>
                      <span className="pipeline__name">{p.stage}</span>
                      <span className="t-body pipeline__does">{p.does}</span>
                    </li>
                  ))}
                </ol>
                <p className="t-note">The trigger time is a target. It hasn't been measured yet.</p>
              </div>
            </div>
          </div>
        </section>

        {/* evidence */}
        <section className="band band--glia" id="evidence">
          <div className="wrap">
            <div className="band__head">
              <h2 className="t-display">Early proof: what we've measured so far.</h2>
              <p className="t-body t-muted">n = 1, a team member, not a patient. It shows the signal is readable, not yet that it detects pain.</p>
            </div>
            <div className="evidence">
              {['At rest', 'Walking', 'Bracing the knee'].map((label) => (
                <figure key={label} className="evidence__cell">
                  <figcaption className="t-heading">{label}</figcaption>
                  <div className="surface--latent evidence__plot">
                    <State is="latent">Plot of our own quad and hamstring sEMG</State>
                  </div>
                </figure>
              ))}
            </div>
            <div className="evidence__next">
              <div className="surface surface--void on-dark evidence__measure">
                <h3 className="t-title">What we'll measure in people with knee OA</h3>
                <p className="t-body">Whether each person's EMG shifts when they tap “pain now”, beyond what movement explains.</p>
              </div>
              <figure className="evidence__shape">
                <Trace data={ENVELOPE} height={180} />
                <figcaption className="t-note">
                  The shape we're looking for: muscle activity rising as the knee guards. Illustrative, not a recording. In 165 knee OA patients, more pain
                  went with more hamstring–quad co-activation (Knee Surg Relat Res, 2026).
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* where it goes */}
        <section className="band">
          <div className="wrap">
            <h2 className="t-display band__head">Moonshot: an objective measure of pain.</h2>
            <ol className="roadmap">
              {ROADMAP.map((r) => (
                <li key={r.when} className={`roadmap__item ${r.when === 'Moonshot' ? 'roadmap__item--far' : ''}`}>
                  <span className="t-reading roadmap__when">{r.when}</span>
                  <h3 className="t-title">{r.title}</h3>
                  <p className="t-body">{r.body}</p>
                </li>
              ))}
            </ol>
            <p className="t-body t-muted roadmap__why">
              Pain is still measured with questionnaires. A labeled dataset of muscle signals at pain onset is the first step.
            </p>

            <h3 className="t-title milestones__head">Where we are</h3>
            <ol className="milestones">
              {MILESTONES.map((m) => (
                <li key={m.title} className={`milestones__item ${m.done ? 'is-done' : 'is-latent'}`}>
                  <span className="t-reading milestones__when">{m.when}</span>
                  <span className="milestones__dot" aria-hidden="true" />
                  <p className="t-heading">{m.title}</p>
                  <p className="t-note">{m.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* team */}
        <section className="band band--glia" id="team">
          <div className="wrap">
            <h2 className="t-display band__head">A team that lives this problem.</h2>
            <ul className="team">
              {TEAM.map((p) => (
                <li key={p.name} className="team__person">
                  <span className="team__photo surface--latent" aria-hidden="true" />
                  <p className="t-title">{p.name}</p>
                  <p className="t-note">{p.study}</p>
                  <p className="t-body">{p.story}</p>
                </li>
              ))}
            </ul>
            <p className="t-note">All four are in the NUS Overseas College entrepreneurship program.</p>
          </div>
        </section>

        {/* close the loop */}
        <section className="cta on-dark" id="join" data-nav="dark">
          <div className="cta__field" aria-hidden="true">
            <InView>
              <FiringField />
            </InView>
          </div>
          <div className="cta__scrim" aria-hidden="true" />
          <div className="wrap cta__inner">
            <h2 className="t-hero cta__title is-lit">Help us close the loop</h2>
            <p className="t-lede">Pain relief that arrives when your body asks for it.</p>
            <ol className="asks">
              {ASKS.map((a, i) => (
                <li key={a.title} className="asks__item">
                  <span className="t-reading asks__n">{i + 1}</span>
                  <h3 className="t-title">{a.title}</h3>
                  <p className="t-body">{a.body}</p>
                </li>
              ))}
            </ol>
            <div className="cta__contact surface--latent">
              <State is="latent">Contact email coming soon</State>
            </div>
          </div>
        </section>
      </main>

      <footer className="wrap site__foot">
        <Wordmark size="1.25rem" />
        <p className="t-note">
          eWEAR Health Prize, Stanford, November 6, 2026. NUS Overseas College. <a href="#/system">Design system</a>
        </p>
      </footer>
    </div>
  );
}
