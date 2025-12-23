/**
 * KMC 본인확인서비스 암호화/복호화 모듈
 *
 * Scenario N: All variable fields cleared ("")
 */

import crypto from "crypto";
import iconv from "iconv-lite";
import { KISA_SEED_CBC } from "@kr-yeon/kisa-seed";

const DEFAULT_SECU_KEY = "4261358467855134";
const DEFAULT_SEED_IV = "3AD8D3E22F132AC7";
const EXTEND_VAR = "0000000000000000";

function processKeyOrIV(input: string): string {
  if (input.length > 16) { return input.substring(input.length - 16); }
  else { return input.padEnd(16, "0"); }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) { bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16); }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex").toUpperCase();
}

export function kmcHmac(data: string | Uint8Array): string {
  return crypto.createHash("sha256").update(data).digest("hex").toLowerCase();
}

export function kmcEncrypt(plaintext: string, key: string, iv: string): string {
  try {
    const plainBytes = iconv.encode(plaintext, "euc-kr");
    const processedKey = new Uint8Array(Buffer.from(processKeyOrIV(key), "utf8"));
    const processedIV = new Uint8Array(Buffer.from(processKeyOrIV(iv), "utf8"));
    const encrypted = KISA_SEED_CBC.SEED_CBC_Encrypt(processedKey, processedIV, new Uint8Array(plainBytes), 0, plainBytes.length);
    return bytesToHex(encrypted);
  } catch { throw new Error("Encryption Error"); }
}

export function kmcDecrypt(ciphertext: string, key: string, iv: string): string {
  try {
    const encryptedBytes = hexToBytes(ciphertext);
    const processedKey = new Uint8Array(Buffer.from(processKeyOrIV(key), "utf8"));
    const processedIV = new Uint8Array(Buffer.from(processKeyOrIV(iv), "utf8"));
    const decrypted = KISA_SEED_CBC.SEED_CBC_Decrypt(processedKey, processedIV, encryptedBytes, 0, encryptedBytes.length);
    return iconv.decode(Buffer.from(decrypted), "euc-kr").trim();
  } catch { throw new Error("Decryption Error"); }
}

interface TrCertParams {
  cpId: string;
  urlCode: string;
  certNum: string;
  date: string;
  certMet?: string;
  plusInfo?: string;
}

export function generateTrCert(params: TrCertParams): string {
  const { cpId, urlCode, certNum, date } = params;
  const secuKey = process.env.KMC_SECU_KEY || DEFAULT_SECU_KEY;
  const seedIv = process.env.KMC_SEED_IV || DEFAULT_SEED_IV;
  const headerPrefix = "KMC000002-7F36131B";

  // 시나리오 N: 모든 가변 필드(5번 certMet, 14번 plusInfo)를 완전히 비움
  const trCertData = [
    cpId,           // 1
    urlCode,        // 2
    certNum,        // 3
    date,           // 4
    "",             // 5: certMet (Empty)
    "", "", "", "", "", "", "", "", // 6~13: Spares
    "",             // 14: plusInfo (Empty)
    EXTEND_VAR      // 15
  ].join("/");

  if (process.env.NODE_ENV !== "production") { console.log("[KMC Debug] trCertData (Scenario N):", trCertData); }

  const enc1 = kmcEncrypt(trCertData, secuKey, seedIv);
  const hmac = kmcHmac(enc1);
  const secondData = `${enc1}/${hmac}/${EXTEND_VAR}`;
  const enc2 = kmcEncrypt(secondData, secuKey, seedIv);

  return headerPrefix + enc2;
}

export function parseRecCert(encryptedData: string): Record<string, string> {
  const secuKey = process.env.KMC_SECU_KEY || DEFAULT_SECU_KEY;
  const seedIv = process.env.KMC_SEED_IV || DEFAULT_SEED_IV;
  try {
    const dec1 = kmcDecrypt(encryptedData, secuKey, seedIv);
    const parts1 = dec1.split("/");
    const encPara = parts1[0]; const encMsg1 = parts1[1];
    const encMsg2 = kmcHmac(encPara);
    if (encMsg1 !== encMsg2) { throw new Error("HMAC Failed"); }
    const dec2 = kmcDecrypt(encPara, secuKey, seedIv);
    const parts2 = dec2.split("/");
    return { certNum: parts2[0], date: parts2[1], ci: parts2[2] ? kmcDecrypt(parts2[2], secuKey, seedIv) : "", phoneNo: parts2[3], phoneCorp: parts2[4], birthDay: parts2[5], gender: parts2[6], nation: parts2[7], name: parts2[8], result: parts2[9], certMet: parts2[10], ip: parts2[11], di: parts2[17] ? kmcDecrypt(parts2[17], secuKey, seedIv) : "", plusInfo: parts2[16] };
  } catch { throw new Error("Parsing Error"); }
}

export function generateCertNum(): string {
  // 가이드 최소 규격인 20자 내외로 맞춤 (YYYYMMDDhhmmss + 6자리 난수)
  return generateDate() + Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateDate(): string {
  const now = new Date();
  const year = now.getFullYear(); const month = String(now.getMonth() + 1).padStart(2, "0"); const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0"); const minutes = String(now.getMinutes()).padStart(2, "0"); const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
