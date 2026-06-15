/**
 * OKLCH-derived color palette for Canvas 2D rendering.
 * CSS uses var(--xxx) from styles.css; Canvas uses these constants.
 * All values are OKLCH-decimals converted to hex/rgb for Canvas compatibility.
 */
const COLORS = {
  // Backgrounds
  bgDeepest:    '#0f0f14',
  bgDeep:       '#111820',
  bgBase:       '#131b13',
  bgRaised:     '#182018',
  bgOverlay:    '#1d261d',

  // Primary neon green
  green900:     '#1a4a1a',
  green700:     '#2a8a2a',
  green500:     '#3aee3a',
  green400:     '#4aff4a',
  green300:     '#66ff66',
  green100:     '#b0ffb0',

  // Cyan
  cyan500:      '#00ffff',
  cyan300:      '#80ffff',

  // Amber
  amber500:     '#ffaa00',
  amber300:      '#ffdd66',

  // Red
  red500:       '#ff3333',
  red300:       '#ff7777',

  // Text
  textPrimary:  '#66ff66',
  textMuted:    '#40aa40',
  textDim:      '#225522',

  // Glow helpers (with alpha)
  glowGreen:      'rgba(58,238,58,0.3)',
  glowGreenStrong:'rgba(58,238,58,0.5)',
  glowCyan:       'rgba(0,255,255,0.5)',
  glowRed:        'rgba(255,51,51,0.4)',
  glowAmber:      'rgba(255,170,0,0.4)',

  // Tile / grid
  tileGrass:    '#1a3a1a',
  tileDirt:     '#2a2a1a',
  tileStone:    '#1a1a2a',
  tileWater:    '#0a1a3a',
  tileMoss:     '#1a3a2a',
  tileLava:     '#3a1a0a',

  // Specific entity colors
  wallColor:    '#2a5a2a',
  mineColor:    '#aa5500',
  proxyColor:   '#0a3a5a',
  lilyColor:    '#0a4a2a',
  rootColor:    '#3a0a3a',
};
