# Phantom design system

Phantom is a closed-loop knee wearable: an sEMG sleeve senses muscle guarding and fires TENS when pain starts. The system is built on one idea:

**Firing is light.** A resting neuron is dark; when it fires, it glows. There is no hue anywhere in the system. Greys hold the resting state, and pure white light with a glow is kept for a pulse firing, only ever on black.

```bash
npm install
npm run dev   # catalogue at http://localhost:5173
```

- CSS layer: `design-system/phantom.css` (tokens in `tokens.css`). Works without React.
- React layer: import from `@/phantom`. Never import `@/components` directly; those are raw React Bits sources.

## Rules

1. **At rest, grey.** Anything not happening right now sits in greys, on black or white.
2. **Firing is light.** `--impulse` white with `--glow` means stimulation is happening or about to. Only on dark (`.on-dark`, `.surface--void`).
3. **Unmeasured is an empty cell.** Anything not measured yet is a dashed outline (`.surface--latent`, `.state--latent`), never a borrowed number.

## Colour

| Token | Hex | Use |
| --- | --- | --- |
| `--void` / `--ink` | `#000000` | Fields, the hero; text and actions on light |
| `--cleft` | `#1C1C1C` | Surfaces and hairlines on dark |
| `--dendrite` | `#8F8F8F` | Resting signal and secondary text on dark |
| `--resting` | `#5C5C5C` | Resting signal and secondary text on light |
| `--rule` | `#D4D4D4` | Hairlines on light |
| `--glia` | `#E6E6E6` | Light surfaces |
| `--membrane` | `#F4F4F4` | The page |
| `--impulse` | `#FFFFFF` | A pulse firing |

`src/phantom/tokens.ts` mirrors these for shaders that take colours as props.

## The loop, as fields

Each field fills its parent; give the parent a height. Fields mount only near the viewport when wrapped in `<InView>`.

| Step | Preset | Source |
| --- | --- | --- |
| Sense | `MosaicBackground` (`tone="fire"` floods it with light) | Mosaic (Pro) |
| Detect | `DetectField` | Synaptic Shift (Pro) |
| Trigger | `SynapseField` | Web Threads |
| Stimulate | `FiringField` (one per view) | Neural Flash (Pro) |
| Adapt | `RestingField` | Neural Float (Pro) |

## Components

- `FireButton`: the one lit action, with Click Spark. On dark only.
- `Stimulating`: Electric Border around a surface while a session runs.
- `Reading`: Count Up figure. Never lit.
- `Trace`: Simple Graph for signals over time.
- `SignalHeadline`: Signal Type; letters light up like a nerve. Once per page, on dark.
- `Spike`, `Wordmark`: the action-potential mark.
- `State`: `rest`, `detect`, `fire`, `latent`.

## Changes to React Bits sources

- `Mosaic`: colour uniforms update in place, so a pulse can recolour it without rebuilding the WebGL context.
- `SynapticShift`: neutral channel gain (the original weighted channels 1:2:4 and tinted every colour blue).

## Adding React Bits components

The registries are configured in `components.json` and read `REACTBITS_LICENSE_KEY` from `.env.local` (gitignored; template in `.env.example`).

```bash
set -a; . ./.env.local; set +a
npx shadcn@latest add @reactbits-starter/<name>-css   # Pro
npx shadcn@latest add @react-bits/<Name>-TS-CSS      # free
```

Type is Schibsted Grotesk throughout, on a perfect-fourth scale.
