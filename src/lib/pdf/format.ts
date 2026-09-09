export type DocFormat = 'a4' | 'a5' | 'thermal80' | 'thermal58';

const MM_TO_PT = 2.83465;

/**
 * Thermal rolls are unbounded in length, so their page height is left
 * unset — @react-pdf/renderer then auto-sizes the page height to fit
 * whatever content it actually has (a real ESC/POS raw-printing path is
 * future work, see README). A fixed tall placeholder height was used here
 * before, but browsers "fit to page" print scaling shrinks the *whole*
 * page proportionally to fit a much-taller-than-actual page onto one
 * sheet/roll length, which visibly shrank the 80mm width too — auto height
 * keeps the page close to its real content size instead.
 */
export function pageSizeFor(format: DocFormat): [number] | [number, number] {
  switch (format) {
    case 'a4':
      return [595.28, 841.89];
    case 'a5':
      return [419.53, 595.28];
    case 'thermal80':
      return [80 * MM_TO_PT];
    case 'thermal58':
      return [58 * MM_TO_PT];
  }
}

export function isThermal(format: DocFormat) {
  return format === 'thermal80' || format === 'thermal58';
}

export function baseFontSize(format: DocFormat) {
  return isThermal(format) ? 8 : 10;
}
