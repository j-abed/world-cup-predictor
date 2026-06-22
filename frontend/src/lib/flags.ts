/**
 * Maps this dataset's FIFA-style 3-letter team codes (data/teams.csv) to
 * flag-icons codes (ISO 3166-1 alpha-2, plus flag-icons' UK home-nation
 * extensions for England/Scotland/Wales/Northern Ireland).
 */
const TEAM_FLAG_CODE: Record<string, string> = {
  MEX: "mx",
  RSA: "za",
  KOR: "kr",
  CZE: "cz",
  CAN: "ca",
  BIH: "ba",
  QAT: "qa",
  SUI: "ch",
  BRA: "br",
  MAR: "ma",
  SCO: "gb-sct",
  HTI: "ht",
  USA: "us",
  PAR: "py",
  AUS: "au",
  TUR: "tr",
  GER: "de",
  CUW: "cw",
  CIV: "ci",
  ECU: "ec",
  NED: "nl",
  JPN: "jp",
  SWE: "se",
  TUN: "tn",
  BEL: "be",
  EGY: "eg",
  IRI: "ir",
  NZL: "nz",
  ESP: "es",
  CPV: "cv",
  KSA: "sa",
  URU: "uy",
  FRA: "fr",
  SEN: "sn",
  IRQ: "iq",
  NOR: "no",
  ARG: "ar",
  DZA: "dz",
  AUT: "at",
  JOR: "jo",
  POR: "pt",
  COD: "cd",
  UZB: "uz",
  COL: "co",
  ENG: "gb-eng",
  CRO: "hr",
  GHA: "gh",
  PAN: "pa",
  WAL: "gb-wls",
  NIR: "gb-nir",
};

/** Returns the flag-icons class suffix for a team code, or null if unknown/TBD. */
export function flagCodeFor(code: string | null | undefined): string | null {
  if (!code) return null;
  return TEAM_FLAG_CODE[code] ?? null;
}
