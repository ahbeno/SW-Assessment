import { describe, it, expect } from 'vitest';
import { validateUEN, ENTITY_TYPES } from './uen.js';

const YEAR = 2026;
const v = (s) => validateUEN(s, YEAR);

describe('validateUEN – input handling', () => {
  it('rejects empty / whitespace / nullish input', () => {
    for (const s of ['', '   ', null, undefined]) {
      const r = v(s);
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/enter a UEN/i);
    }
  });

  it('rejects symbols and inner spaces', () => {
    expect(v('1234-5678A').valid).toBe(false);
    expect(v('1234 5678A').valid).toBe(false);
  });

  it('rejects wrong lengths', () => {
    expect(v('1234567A').error).toMatch(/9 or 10/);
    expect(v('12345678901A').error).toMatch(/9 or 10/);
  });

  it('trims and uppercases input', () => {
    const r = v('  12345678a ');
    expect(r.valid).toBe(true);
    expect(r.uen).toBe('12345678A');
  });
});

describe('validateUEN – Business (nnnnnnnnX)', () => {
  it('accepts 8 digits + letter', () => {
    const r = v('12345678A');
    expect(r.valid).toBe(true);
    expect(r.type).toBe('business');
    expect(r.details).toEqual({ number: '12345678', checkLetter: 'A' });
  });

  it('rejects missing check letter', () => {
    expect(v('123456789').valid).toBe(false);
  });

  it('rejects letters inside the number', () => {
    expect(v('1234A678B').valid).toBe(false);
  });
});

describe('validateUEN – Local Company (yyyynnnnnX)', () => {
  it('accepts a valid local company UEN', () => {
    const r = v('199012345X');
    expect(r.valid).toBe(true);
    expect(r.type).toBe('local-company');
    expect(r.details.year).toBe(1990);
    expect(r.details.number).toBe('12345');
  });

  it('accepts current year and 1800 boundary', () => {
    expect(v('202612345A').valid).toBe(true);
    expect(v('180012345A').valid).toBe(true);
  });

  it('rejects future and pre-1800 years', () => {
    expect(v('202712345A').valid).toBe(false);
    expect(v('179912345A').valid).toBe(false);
  });

  it('rejects missing check letter / trailing digit', () => {
    expect(v('1990123456').valid).toBe(false);
  });

  it('rejects letter in the middle', () => {
    expect(v('1990A2345X').valid).toBe(false);
  });
});

describe('validateUEN – Other Registered Entities (TyyPQnnnnX)', () => {
  it('accepts the documented example T08LL1234A', () => {
    const r = v('T08LL1234A');
    expect(r.valid).toBe(true);
    expect(r.type).toBe('other-entity');
    expect(r.details).toMatchObject({
      year: 2008,
      entityTypeCode: 'LL',
      entityType: 'Limited Liability Partnership',
      issuedBy: 'ACRA',
      number: '1234',
      checkLetter: 'A',
    });
  });

  it('maps S → 1900s and R → 1800s', () => {
    expect(v('S99SS0001A').details.year).toBe(1999);
    expect(v('R50MC0001A').details.year).toBe(1850);
  });

  it('rejects an unknown prefix letter', () => {
    expect(v('X08LL1234A').valid).toBe(false);
  });

  it('rejects an unknown entity-type indicator', () => {
    const r = v('T08ZZ1234A');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/ZZ/);
  });

  it('rejects a future issuance year', () => {
    expect(v('T27LL1234A').valid).toBe(false);
    expect(v('T26LL1234A').valid).toBe(true);
  });

  it('rejects non-digit running number', () => {
    expect(v('T08LL12A4A').valid).toBe(false);
  });

  it('rejects digits in the PQ position', () => {
    expect(v('T08L11234A').valid).toBe(false);
  });
});

describe('ENTITY_TYPES', () => {
  it('contains all indicators from the official list', () => {
    const expected = [
      'LP', 'LL', 'FC', 'PF', 'RF', 'MQ', 'MM', 'NB', 'CC', 'CS', 'MB', 'FM', 'GS',
      'DP', 'CP', 'NR', 'CM', 'CD', 'MD', 'HS', 'VH', 'CH', 'MH', 'CL', 'XL', 'CX',
      'HC', 'RP', 'TU', 'TC', 'FB', 'FN', 'PA', 'PB', 'SS', 'MC', 'SM', 'GA', 'GB',
    ];
    expect(Object.keys(ENTITY_TYPES).sort()).toEqual([...expected].sort());
  });

  it.each(Object.keys(ENTITY_TYPES))('accepts indicator %s', (pq) => {
    expect(v(`T10${pq}0001A`).valid).toBe(true);
  });
});