import crypto from "crypto";

const WORDLIST = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
  "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
  "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
  "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance",
  "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album",
  "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone",
  "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among",
  "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry",
  "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
  "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april",
];

export function generateTotpSecret(length = 16): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = crypto.randomBytes(length);
  let secret = "";
  for (let i = 0; i < length; i += 1) {
    secret += alphabet[bytes[i] % alphabet.length];
  }
  return secret;
}

export function generateBackupCodes(count = 4): string[] {
  return Array.from({ length: count }, () => {
    const partA = crypto.randomInt(1000, 9999);
    const partB = crypto.randomInt(1000, 9999);
    return `${partA}-${partB}`;
  });
}

export function generateRecoverySeedWords(count = 12): string[] {
  const words: string[] = [];
  while (words.length < count) {
    const word = WORDLIST[crypto.randomInt(0, WORDLIST.length)];
    if (!words.includes(word)) words.push(word);
  }
  return words;
}

export function hashSeedWords(words: string[]): string {
  const normalized = words.map((w) => w.trim().toLowerCase()).join(" ");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function verifySeedWords(words: string[], seedHash: string): boolean {
  return hashSeedWords(words) === seedHash;
}
