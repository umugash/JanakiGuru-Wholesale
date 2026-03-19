// ROYALTIMES cipher utility
// Mapping: 1=R, 2=O, 3=Y, 4=A, 5=L, 6=T, 7=I, 8=M, 9=E, 0=S
// key[0]=R=1, key[1]=O=2, ... key[8]=E=9, key[9]=S=0

let cachedKey: string | null = null;

export function getDefaultKey(): string {
  return "ROYALTIMES";
}

export function setCachedKey(key: string) {
  cachedKey = key.toUpperCase();
}

export function getCachedKey(): string {
  return cachedKey || getDefaultKey();
}

// Encode a number using the cipher key
// ROYALTIMES: key[0]=R→1, key[1]=O→2, ..., key[8]=E→9, key[9]=S→0
// So digit d maps to: d===0 ? key[9] : key[d-1]
// e.g. encodePrice(38, "ROYALTIMES") => "YM"  (3→Y, 8→M)
// e.g. encodePrice(3.5, "ROYALTIMES") => "Y.L" (3→Y, 5→L)
// e.g. encodePrice(360, "ROYALTIMES") => "YTS" (3→Y, 6→T, 0→S)
export function encodePrice(value: number | string, cipherKey: string): string {
  const key = cipherKey.toUpperCase();
  if (key.length !== 10) return String(value);

  // Build map: digit → cipher character
  // key[0] represents 1, key[1] represents 2, ..., key[8] represents 9, key[9] represents 0
  const digitMap: Record<string, string> = {
    "1": key[0],
    "2": key[1],
    "3": key[2],
    "4": key[3],
    "5": key[4],
    "6": key[5],
    "7": key[6],
    "8": key[7],
    "9": key[8],
    "0": key[9],
  };

  const str = String(value);
  return str
    .split("")
    .map(ch => {
      if (ch === ".") return ".";
      if (ch === "-") return "-";
      return digitMap[ch] ?? ch;
    })
    .join("");
}

// Parse multiple wholesale prices from slash-separated string
// e.g. "220/2000" => [220, 2000]
// e.g. "38" => [38]
export function parseWholesalePrices(val: any): number[] {
  if (!val && val !== 0) return [];
  const str = String(val).trim();
  if (!str) return [];
  return str
    .split("/")
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter(n => !isNaN(n));
}

// Encode wholesale prices to display labels
// Single price: "YM"
// Multiple prices: "Single: YM | Bundle: YTS"
export function encodeWholesalePrices(val: any, cipherKey: string): string {
  const prices = parseWholesalePrices(val);
  if (prices.length === 0) return "";
  if (prices.length === 1) return encodePrice(prices[0], cipherKey);
  const labels = ["Single", "Bundle", "Pack", "Bulk", "Special"];
  return prices
    .map((p, i) => `${labels[i] || `Option${i + 1}`}: ${encodePrice(p, cipherKey)}`)
    .join("  |  ");
}