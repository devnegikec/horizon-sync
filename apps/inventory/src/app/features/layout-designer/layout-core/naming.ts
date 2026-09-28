/**
 * WMS location codes, bin-code patterns and QR codes.
 *
 * Owns every string-identity rule for the designer:
 *
 * - **Location codes.** Zone -> Aisle -> Bay -> Level -> Bin using the WMS
 *   `LayoutService` scheme: a type prefix (`Z`/`A`/`B`/`L`/`BN`) plus a
 *   zero-padded ordinal, dash-joined into `full_path`. The display form (which
 *   dashes the last segment, `BN-001`) is a read-time concern.
 * - **Bin code patterns.** A document-level *label* such as
 *   `{warehouse}/{aisle}/{side}/B{bay:03}/L{level}`. A bin's persisted identity is
 *   always its WMS `full_path`; the pattern is what the designer shows.
 * - **QR codes.** Five characters from an alphabet without `I`/`O`/`0`/`1`.
 *
 * Mirrors `core-service/app/layout_design/naming.py`.
 *
 * Design ref: ../../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md section 4
 */

/** Default document-level bin label. */
export const DEFAULT_BIN_CODE_PATTERN = '{warehouse}/{aisle}/{side}/B{bay:03}/L{level}';

/** Placeholders a pattern may use. `{bay:03}` requests zero padding. */
export const VALID_CODE_PATTERN_TOKENS: ReadonlySet<string> = new Set(['warehouse', 'aisle', 'lane', 'side', 'bay', 'level']);

const CODE_TOKEN_RE = /\{([a-z]+)(?::(\d+))?\}/g;

/** Naming schemes the materialiser can emit. */
export type NamingScheme = 'wms_typed' | 'wms_floorplan';

export const NAMING_SCHEMES: readonly NamingScheme[] = ['wms_typed', 'wms_floorplan'];

/**
 * `wms_typed` (LayoutService): every level carries its type prefix -
 * `Z01-A03-B02-L04-BN001`. This is the scheme the WMS designer and the backend
 * defaults to.
 */
export const WMS_TYPED: NamingScheme = 'wms_typed';

/**
 * `wms_floorplan` (FloorPlanGeneratorService): bare zone/aisle codes, only the
 * `B`/`L`/`BN` prefixes kept - `01-01-B01-L01-BN01`.
 */
export const WMS_FLOORPLAN: NamingScheme = 'wms_floorplan';

const TYPE_CODE_PREFIX: Record<string, string> = { zone: 'Z', aisle: 'A', bay: 'B', level: 'L', bin: 'BN' };

const SEGMENT_WIDTH = 2;
const BIN_SEGMENT_WIDTH = 3;
/**
 * Ceiling on `{bay:03}`-style zero padding.
 *
 * The width comes out of a user-authored document, and `padStart` on an unbounded one
 * either allocates an enormous string or throws a RangeError part-way through a compile.
 */
const MAX_PAD_WIDTH = 64;

/**
 * True when `pattern` has at least one placeholder, only known tokens, and no other
 * brace-shaped text.
 *
 * The recogniser alone is not enough: it only ever sees the tokens it recognises, so
 * `{warehouse}{` and `{warehouse}/{Bogus}` both satisfied it, and `formatBinCode` then
 * carried the stray text into every generated label.
 */
export function isValidCodePattern(pattern: string): boolean {
  const matches = [...pattern.matchAll(CODE_TOKEN_RE)];
  if (matches.length === 0) return false;
  if (!matches.every((match) => VALID_CODE_PATTERN_TOKENS.has(match[1]))) return false;

  return !/[{}]/.test(pattern.replace(CODE_TOKEN_RE, ''));
}

/**
 * Render a bin label from a pattern and its token values.
 *
 * A malformed pattern or an absent token renders as an empty string rather than
 * throwing, so one bad lane cannot abort a 100k-bin compile.
 */
export function formatBinCode(pattern: string, values: Record<string, string | number>): string {
  const effective = isValidCodePattern(pattern) ? pattern : DEFAULT_BIN_CODE_PATTERN;
  return effective.replace(CODE_TOKEN_RE, (_match, token: string, padding?: string) => {
    const text = String(values[token] ?? '');
    return padding ? text.padStart(Math.min(Number(padding), MAX_PAD_WIDTH), '0') : text;
  });
}

/** Trailing digit sequence of a code, or empty. `A03` -> `03`, `MAIN` -> ``. */
export function trailingDigits(rawCode: string | null | undefined): string {
  if (!rawCode) return '';
  const match = /(\d+)$/.exec(rawCode);
  return match ? match[1] : '';
}

/**
 * Build one WMS path segment, e.g. `Z01`, `A03`, `B02`, `L04`, `BN001`.
 *
 * Follows `LayoutService._build_raw_code`: the author's own code wins when it ends
 * in digits (`A03` -> `A03`), otherwise the positional `ordinal` is used - a lane
 * code `A01-L` has no trailing digits, so it becomes `B01`. Digits are zero-padded
 * to the canonical width: 2 for zone/aisle/bay/level, 3 for bin under `wms_typed`
 * and 2 under `wms_floorplan` (which is what the legacy generator emits).
 */
export function wmsSegment(locationType: string, ordinal: number, authoredCode?: string | null, scheme: NamingScheme = WMS_TYPED): string {
  let width = SEGMENT_WIDTH;
  if (locationType === 'bin') {
    width = scheme === WMS_TYPED ? BIN_SEGMENT_WIDTH : SEGMENT_WIDTH;
  }
  const digits = trailingDigits(authoredCode);
  const numeric = digits ? digits.padStart(width, '0') : String(ordinal).padStart(width, '0');

  if (scheme === WMS_FLOORPLAN && (locationType === 'zone' || locationType === 'aisle')) {
    return numeric;
  }
  return `${TYPE_CODE_PREFIX[locationType] ?? ''}${numeric}`;
}

/** Append a segment to a path, mirroring `LayoutService._generate_location_code`. */
export function joinPath(parentPath: string | null | undefined, code: string): string {
  return parentPath ? `${parentPath}-${code}` : code;
}

/**
 * Dash the final segment for display.
 * `Z01-A03-B02-L04-BN001` -> `Z01-A03-B02-L04-BN-001`.
 */
export function formatDisplayPath(fullPath: string | null | undefined): string {
  if (!fullPath) return '';
  const segments = fullPath.split('-');
  const last = segments.length - 1;
  segments[last] = segments[last].replace(/([A-Za-z]+)(\d+)/, '$1-$2');
  return segments.join('-');
}

/** Readable alphabet: no I, O, 0 or 1. */
export const QR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const QR_LENGTH = 5;

/** Injectable randomness so tests are deterministic. */
export type RandomSource = () => number;

function randomCode(random: RandomSource): string {
  let code = '';
  for (let index = 0; index < QR_LENGTH; index += 1) {
    code += QR_ALPHABET[Math.floor(random() * QR_ALPHABET.length)];
  }
  return code;
}

/**
 * Generate `count` unique 5-character QR codes, none of which appears in `existing`.
 *
 * The caller batch-queries the table once rather than issuing a query per bin; the
 * backend re-checks candidates against the `qr_code` unique constraint.
 */
export function generateQrCodes(count: number, existing: Iterable<string> = [], random: RandomSource = Math.random): string[] {
  if (count <= 0) return [];

  const taken = new Set(existing);
  const codes: string[] = [];

  for (let index = 0; index < count; index += 1) {
    let placed = false;
    for (let attempt = 0; attempt < 64 && !placed; attempt += 1) {
      const candidate = randomCode(random);
      if (!taken.has(candidate)) {
        taken.add(candidate);
        codes.push(candidate);
        placed = true;
      }
    }
    if (!placed) throw new Error('Failed to generate unique QR codes');
  }

  return codes;
}
