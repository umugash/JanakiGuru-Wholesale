// ROYALTIMES cipher utility
// Default: R=1, O=2, Y=3, A=4, L=5, T=6, I=7, M=8, E=9, S=0

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
// e.g. encodePrice(38, "ROYALTIMES") => "YM"
// e.g. encodePrice(3.5, "ROYALTIMES") => "Y.L"
export function encodePrice(value: number | string, cipherKey: string): string {
  const key = cipherKey.toUpperCase();
  if (key.length !== 10) return String(value); // fallback if key invalid

  const digitMap: Record<string, string> = {};
  for (let i = 0; i <= 9; i++) {
    digitMap[String(i)] = key[i];
  }

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
// e.g. "220" => [220]
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
// Multiple prices: "Single: YM | Bundle: COOO"
export function encodeWholesalePrices(val: any, cipherKey: string): string {
  const prices = parseWholesalePrices(val);
  if (prices.length === 0) return "";
  if (prices.length === 1) return encodePrice(prices[0], cipherKey);
  const labels = ["Single", "Bundle", "Pack", "Bulk", "Special"];
  return prices
    .map((p, i) => `${labels[i] || `Option${i + 1}`}: ${encodePrice(p, cipherKey)}`)
    .join("  |  ");
}