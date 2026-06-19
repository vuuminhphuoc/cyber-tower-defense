/**
 * OKLCH-derived color palette for Canvas 2D rendering.
 * CSS uses var(--xxx) from styles.css; Canvas uses these constants.
 * All values are OKLCH-decimals converted to hex/rgb for Canvas compatibility.
 */
const COLORS = {
  // Backgrounds (hue 145, very low chroma)
  bgDeepest:    '#0f0f14',
  bgDeep:       '#111820',
  bgBase:       '#0f1a0f',
  bgRaised:     '#162016',
  bgOverlay:    '#1d261d',
  bgFog:        '#141428',

  // Primary neon green (hue 145)
  green900:     '#1a4a1a',
  green700:     '#2a8a2a',
  green500:     '#3aee3a',
  green400:     '#4aff4a',
  green300:     '#66ff66',
  green100:     '#b0ffb0',

  // Cyan accents (hue 195)
  cyan500:      '#00ffff',
  cyan300:      '#80ffff',
  cyan700:      '#00aaaa',

  // Amber accents (hue 73)
  amber500:     '#ffaa00',
  amber300:     '#ffdd66',
  amber700:     '#aa6600',

  // Red / danger (hue 27)
  red500:       '#ff3333',
  red300:       '#ff7777',
  red700:       '#aa2222',

  // Yellow
  yellow:       '#ffff00',

  // Text
  textPrimary:  '#66ff66',
  textMuted:    '#40aa40',
  textDim:      '#225522',
  textWhite:    '#ffffff',
  textGray:     '#aaaaaa',
  textDark:     '#020806',

  // Glow helpers (with alpha)
  glowGreen:      'rgba(58,238,58,0.3)',
  glowGreenStrong:'rgba(58,238,58,0.5)',
  glowCyan:       'rgba(0,255,255,0.5)',
  glowRed:        'rgba(255,51,51,0.4)',
  glowAmber:      'rgba(255,170,0,0.4)',

  // Tile / grid base (alternating)
  tileGrassA:   '#0a1a0a',
  tileGrassB:   '#0e220e',
  tileWaterA:   '#0a2e4a',
  tileWaterB:   '#0c3555',
  tileGraveA:   '#2a1520',
  tileGraveB:   '#351a28',
  tileBevelDark: 'rgba(0,0,0,0.45)',
  tileBevelGlow: 'rgba(0,255,65,0.08)',
  tileEdgeWater:'rgba(0,220,255,0.22)',
  tileEdgeGrass:'rgba(0,255,65,0.18)',
  tileFrame:    'rgba(0,255,65,0.25)',

  // Terrain styles (matching TERRAIN_STYLE in grid.js)
  terrain: {
    serverRackA:  '#1a1a2e',
    serverRackB:  '#20203a',
    serverRackIcon:'#55aaff',
    overheatedA:  '#2e1a0a',
    overheatedB:  '#3a2010',
    overheatedIcon:'#ff7733',
    signalDelayA: '#1a1030',
    signalDelayB: '#221540',
    signalDelayIcon:'#aa77ff',
    uplinkA:      '#0a2030',
    uplinkB:      '#0e2840',
    uplinkIcon:   '#55ccff',
    quantumA:     '#1a0a2e',
    quantumB:     '#22103a',
    quantumIcon:  '#cc55ff',
    entangledA:   '#0a2e2a',
    entangledB:   '#103a35',
    entangledIcon:'#55ffcc',
  },

  // UI overlays
  overlayDark:  'rgba(0,0,0,0.85)',
  overlayMedium:'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.5)',
  fogPulse:     'rgba(20,20,40,0.8)',
  frozenTint:   '#7ec8e3',
  shadowDark:   'rgba(0,0,0,0.8)',

  // Progress bars
  progressBg:   '#3a2614',
  progressFill: '#2ecc71',
  bossHpHigh:   '#ff3333',
  bossHpMid:    '#ffaa00',
  bossHpLow:    '#ffdd44',
  hpBarBg:      '#333333',
  hpBarFrame:   'rgba(0,0,0,0.6)',
  hpBarGreen:   'rgba(0,255,65,0.3)',

  // Specific entity / effect colors
  wall:         '#2a5a2a',
  mine:         '#aa5500',
  proxy:        '#0a3a5a',
  lily:         '#0a4a2a',
  root:         '#3a0a3a',
  bombRadius:   '#ff6600',
  scannerPulse: '#00ff41',
  warning:      '#ff3333',
  banner:       'rgba(231,76,60,0.9)',
  pauseBtn:     '#ff3333',

  // Utility
  transparent:  'transparent',
  black:        '#000000',
  white:        '#ffffff',
  gold:         '#ffd700',
  orange:       '#ff9800',
};
