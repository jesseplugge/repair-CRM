function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function toHex(r: number, g: number, b: number) {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
}

function darken(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex);
  return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/** Mixes the accent color toward white — used for text on dark surfaces (the sidebar). */
function lighten(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex);
  return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function toRgba(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Derives every shade the UI needs from one business-chosen hex color:
 * a hover-darkened button state, a lightened variant for text on the dark
 * sidebar, and translucent tints for soft backgrounds/borders that work over
 * both light and dark surfaces without needing separate light/dark variants.
 */
export function buildAccentTokens(hex: string): Record<string, string> {
  const safe = /^#[0-9a-fA-F]{3,6}$/.test(hex) ? hex : '#0C7C82';
  return {
    '--accent': safe,
    '--accent-hover': darken(safe, 0.12),
    '--accent-light': lighten(safe, 0.4),
    '--accent-soft': toRgba(safe, 0.12),
    '--accent-border-soft': toRgba(safe, 0.35),
  };
}
