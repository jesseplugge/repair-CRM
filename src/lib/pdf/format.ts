export type DocFormat = 'a4' | 'a5' | 'thermal80' | 'thermal58';

const MM_TO_PT = 2.83465;

/**
 * @react-pdf/renderer pages are fixed-size. Thermal rolls are unbounded in
 * length, so we approximate with a generously tall fixed page — printers cut
 * after the content and viewers just see trailing white space, which is an
 * acceptable v1 trade-off (see README: real ESC/POS raw printing is future work).
 */
export function pageSizeFor(format: DocFormat): [number, number] {
  switch (format) {
    case 'a4':
      return [595.28, 841.89];
    case 'a5':
      return [419.53, 595.28];
    case 'thermal80':
      return [80 * MM_TO_PT, 1600];
    case 'thermal58':
      return [58 * MM_TO_PT, 1600];
  }
}

export function isThermal(format: DocFormat) {
  return format === 'thermal80' || format === 'thermal58';
}

export function baseFontSize(format: DocFormat) {
  return isThermal(format) ? 8 : 10;
}
