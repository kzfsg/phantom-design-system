// Mirrors design-system/tokens.css for components that take colours as props (WebGL, canvas).
export const color = {
  void: '#000000',
  ink: '#000000',
  cleft: '#1c1c1c',
  dendrite: '#8f8f8f',
  resting: '#5c5c5c',
  rule: '#d4d4d4',
  glia: '#e6e6e6',
  membrane: '#f4f4f4',
  impulse: '#ffffff',
  /** mid-grey for the darker band of a shader at rest */
  soma: '#5a5a5a',
  /** light grey for the brighter band of a shader at rest */
  axon: '#bdbdbd',
} as const;
