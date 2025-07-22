// KISA SEED CBC 복호화만 구현 (kisaSeed.ts에서 import)
import { decryptSEED as kisaSeedDecrypt } from "./kisaSeed";
import crypto from "crypto";

// KISA SEED CBC 복호화 함수
export function decryptSEED(
  encryptedStr: string,
  bszUserKey: string,
  bszIV: string
): string {
  return kisaSeedDecrypt(encryptedStr, bszUserKey, bszIV);
}

// SHA256 해시 함수
export function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}
