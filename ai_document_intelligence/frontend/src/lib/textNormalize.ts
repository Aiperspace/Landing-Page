/**
 * Typography normalization for rendered and exported content.
 *
 * Strips unicode variants (em/en dashes, curly quotes, ellipsis, non-breaking
 * spaces, zero-width chars, decorative bullets) down to plain ASCII
 * equivalents. Applied at the render/export boundary; stored content
 * is untouched.
 */

const REPLACEMENTS: Array<[RegExp, string]> = [
  // Dashes: en (U+2013), em (U+2014), horizontal bar (U+2015), minus sign (U+2212)
  [/[–—―−]/g, '-'],

  // Double quotes: LEFT/RIGHT (U+201C/D), LOW-9 (U+201E), REVERSED (U+201F),
  //                PRIME DOUBLE (U+2033), REVERSED PRIME DOUBLE (U+2036)
  [/[“”„‟″‶]/g, '"'],

  // Single quotes / apostrophes: LEFT/RIGHT (U+2018/9), LOW-9 (U+201A), REVERSED (U+201B),
  //                              PRIME (U+2032), REVERSED PRIME (U+2035)
  [/[‘’‚‛′‵]/g, "'"],

  // Horizontal ellipsis (U+2026)
  [/…/g, '...'],

  // Whitespace variants collapsed to a normal space:
  //  U+00A0 NBSP
  //  U+2000-U+200A various fixed-width spaces
  //  U+202F NARROW NO-BREAK SPACE
  //  U+205F MEDIUM MATHEMATICAL SPACE
  //  U+3000 IDEOGRAPHIC SPACE
  [/[  -   　]/g, ' '],

  // Decorative bullet variants inside prose
  //  U+2022 BULLET, U+25CF BLACK CIRCLE, U+25AA BLACK SMALL SQUARE, U+25E6 WHITE BULLET
  [/[•●▪◦]/g, '*'],

  // Guillemets
  [/«/g, '<<'],
  [/»/g, '>>'],

  // Zero-width characters:
  //  U+200B ZWSP, U+200C ZWNJ, U+200D ZWJ, U+FEFF ZWNBSP / BOM
  [/[​‌‍﻿]/g, ''],
];

export function normalizeTypography(input: string): string {
  if (!input) return input;
  let out = input;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** Normalize every section's content in a document. Returns a new object. */
export function normalizeDocument<T extends { sections: Array<{ title: string; content: string }> }>(
  doc: T,
): T {
  return {
    ...doc,
    sections: doc.sections.map((s) => ({
      ...s,
      content: normalizeTypography(s.content),
    })),
  };
}
