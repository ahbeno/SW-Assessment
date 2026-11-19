/**
 * Singapore UEN format validation.
 *  1. Business (ACRA):            nnnnnnnnX     – 9 chars
 *  2. Local Company (ACRA):       yyyynnnnnX    – 10 chars
 *  3. Other Registered Entities:  TyyPQnnnnX    – 10 chars
 * Format only; does not verify the check letter or that the entity exists.
 */

export const ENTITY_TYPES = {
  // ACRA
  LP: { name: 'Limited Partnership', agency: 'ACRA' },
  LL: { name: 'Limited Liability Partnership', agency: 'ACRA' },
  FC: { name: 'Foreign Company', agency: 'ACRA' },
  PF: { name: 'Public Accounting Firm', agency: 'ACRA' },
  // Enterprise Singapore
  RF: {
    name: 'Representative Office (Foreign Company / Government Agency / Trade Association / Non-Profit)',
    agency: 'ESG',
  },
  // Muis
  MQ: { name: 'Mosque', agency: 'Muis' },
  MM: { name: 'Madrasah', agency: 'Muis' },
  // MCI
  NB: { name: 'News Bureau', agency: 'MCI' },
  // MCCY
  CC: { name: 'Charity / Institution of a Public Character', agency: 'MCCY – Charities Unit' },
  CS: { name: 'Cooperative Society', agency: 'MCCY – Registry of Co-operative Societies' },
  MB: { name: 'Mutual Benefit Organisation', agency: 'MCCY – Registry of Mutual Benefit Organisation' },
  // Mindef
  FM: { name: 'Foreign Military Unit', agency: 'Mindef' },
  // MOE
  GS: { name: 'Government / Government-Aided School', agency: 'MOE' },
  // MFA
  DP: { name: 'High Commission / Embassy', agency: 'MFA' },
  CP: { name: 'Consulate', agency: 'MFA' },
  NR: { name: 'International Organisation (registered with MFA)', agency: 'MFA' },
  // MOH
  CM: { name: 'Healthcare – Medical Clinic only', agency: 'MOH' },
  CD: { name: 'Healthcare – Dental Clinic only', agency: 'MOH' },
  MD: { name: 'Healthcare – Medical and Dental Clinic', agency: 'MOH' },
  HS: { name: 'Healthcare – Hospital', agency: 'MOH' },
  VH: { name: 'Healthcare – Voluntary Welfare Home', agency: 'MOH' },
  CH: { name: 'Healthcare – Commercial Home', agency: 'MOH' },
  MH: { name: 'Healthcare – Maternity Home', agency: 'MOH' },
  CL: { name: 'Healthcare – Clinical Laboratory', agency: 'MOH' },
  XL: { name: 'Healthcare – X-ray Laboratory', agency: 'MOH' },
  CX: { name: 'Healthcare – Clinical and X-ray Laboratory', agency: 'MOH' },
  HC: { name: 'Healthcare Service Provider', agency: 'MOH' },
  // MLAW
  RP: { name: 'Foreign Law Practice Representative Office', agency: 'MLAW' },
  // MOM
  TU: { name: 'Trade Union', agency: 'MOM' },
  // MND
  TC: { name: 'Town Council', agency: 'MND' },
  // MAS
  FB: { name: 'Financial Representative Office – Bank', agency: 'MAS' },
  FN: { name: 'Financial Representative Office – Insurance', agency: 'MAS' },
  // PA
  PA: { name: 'PA Service', agency: "People's Association" },
  PB: { name: 'Grassroots Unit', agency: "People's Association" },
  // ROS
  SS: { name: 'Society', agency: 'ROS' },
  // SLA
  MC: { name: 'Management Corporation', agency: 'SLA' },
  SM: { name: 'Subsidiary Management Corporation', agency: 'SLA' },
  // SNDGO
  GA: { name: 'Government Agency (Organ of State, Ministry, Department)', agency: 'SNDGO' },
  GB: { name: 'Statutory Board / Body performing public duties', agency: 'SNDGO' },
};

const PREFIX_CENTURY = { R: 1800, S: 1900, T: 2000 };

const BUSINESS_RE = /^(\d{8})([A-Z])$/;
const LOCAL_COMPANY_RE = /^(\d{4})(\d{5})([A-Z])$/;
const OTHER_ENTITY_RE = /^([RST])(\d{2})([A-Z]{2})(\d{4})([A-Z])$/;

const fail = (error) => ({ valid: false, error });

export function validateUEN(input, currentYear = new Date().getFullYear()) {
  const uen = String(input ?? '').trim().toUpperCase();

  if (!uen) return fail('Please enter a UEN.');
  if (!/^[A-Z0-9]+$/.test(uen)) {
    return fail('UEN may only contain letters and digits (no spaces or symbols).');
  }
  if (uen.length !== 9 && uen.length !== 10) {
    return fail(`UEN must be 9 or 10 characters long (you entered ${uen.length}).`);
  }

  // 1. Business – nnnnnnnnX
  if (uen.length === 9) {
    const m = BUSINESS_RE.exec(uen);
    if (!m) return fail('A 9-character UEN must be 8 digits followed by a check letter (e.g. 12345678A).');
    return {
      valid: true,
      uen,
      type: 'business',
      label: 'Business (registered with ACRA)',
      details: { number: m[1], checkLetter: m[2] },
    };
  }

  // 2. Local Company – yyyynnnnnX
  if (/^\d/.test(uen)) {
    const m = LOCAL_COMPANY_RE.exec(uen);
    if (!m) return fail('A 10-character UEN starting with a digit must be a 4-digit year, 5 digits and a check letter (e.g. 199012345X).');
    const year = Number(m[1]);
    if (year < 1800 || year > currentYear) {
      return fail(`Year of incorporation ${m[1]} is not valid (expected 1800–${currentYear}).`);
    }
    return {
      valid: true,
      uen,
      type: 'local-company',
      label: 'Local Company (registered with ACRA)',
      details: { year, number: m[2], checkLetter: m[3] },
    };
  }

  // 3. Other Registered Entities – TyyPQnnnnX
  const m = OTHER_ENTITY_RE.exec(uen);
  if (!m) {
    return fail('A 10-character UEN starting with a letter must look like T08LL1234A: T/S/R, 2-digit year, 2-letter entity type, 4 digits, check letter.');
  }
  const [, prefix, yy, pq, running, checkLetter] = m;
  const year = PREFIX_CENTURY[prefix] + Number(yy);
  if (year > currentYear) {
    return fail(`Issuance year ${year} (from "${prefix}${yy}") is in the future.`);
  }
  const entity = ENTITY_TYPES[pq];
  if (!entity) {
    return fail(`"${pq}" is not a recognised entity-type indicator.`);
  }
  return {
    valid: true,
    uen,
    type: 'other-entity',
    label: 'Other Registered Entity',
    details: {
      year,
      entityTypeCode: pq,
      entityType: entity.name,
      issuedBy: entity.agency,
      number: running,
      checkLetter,
    },
  };
}