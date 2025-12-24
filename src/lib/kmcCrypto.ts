/**
 * KMC 본인확인서비스 순수 Node.js 암호화 모듈 (Vercel 호환)
 * 
 * KMC JAR 모듈(ICERTSecu_JDK18_v2.jar)의 내부 로직을 전수 분석하여 
 * 순수 TypeScript로 완벽 이식했습니다. 자바(JRE) 없이 Vercel에서도 구동 가능합니다.
 */

import iconv from "iconv-lite";
import { KISA_SEED_CBC } from "@kr-yeon/kisa-seed";

// KMC 전용 설정 상수 (JAR에서 추출)
const DEFAULT_SECU_KEY = "4261358467855134";
const DEFAULT_SEED_IV = "3AD8D3E22F132AC7";
const EXTEND_VAR = "0000000000000000";
const HEADER_PREFIX = "KMC000002-7F36131B";

/**
 * KMC 전용 커스텀 SHA-256 구현
 * (표준 SHA-256에서 K 상수를 변형시킨 버전)
 */
export function kmcHash(data: string): string {
  const kmcK = [
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0xe49b69c1, 0xefbe4786, 0xfc19dc6, 0x240ca1cc,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5
  ];

  function rightRotate(v: number, n: number): number {
    return (v >>> n) | (v << (32 - n));
  }

  const asciiBytes = Buffer.from(data, "utf8");
  const words: number[] = [];
  for (let i = 0; i < asciiBytes.length * 8; i += 8) {
    words[i >> 5] |= (asciiBytes[i / 8] & 0xff) << (24 - (i % 32));
  }

  const asciiLen = asciiBytes.length * 8;
  words[asciiLen >> 5] |= 0x80 << (24 - (asciiLen % 32));
  
  const lastWordIdx = (((asciiLen + 64) >> 9) << 4) + 15;
  while (words.length <= lastWordIdx) words.push(0);
  words[lastWordIdx] = asciiLen;

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    while (w.length < 16) w.push(0);
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 = (rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3)) >>> 0;
        const s1 = (rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10)) >>> 0;
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
      }

      const S1 = (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + kmcK[j] + w[j]) >>> 0;
      const S0 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map(x => (x >>> 0).toString(16).padStart(8, '0'))
    .join('')
    .toLowerCase();
}

/**
 * PKCS7 패딩 추가
 */
function addPadding(data: Buffer): Buffer {
  const blockSize = 16;
  const paddingSize = blockSize - (data.length % blockSize);
  const padding = Buffer.alloc(paddingSize, paddingSize);
  return Buffer.concat([data, padding]);
}

/**
 * PKCS7 패딩 제거
 */
function removePadding(data: Buffer): Buffer {
  if (data.length === 0) return data;
  const paddingSize = data[data.length - 1];
  if (paddingSize > 16 || paddingSize <= 0) return data;
  return data.slice(0, data.length - paddingSize);
}

function processKeyOrIV(input: string): string {
  if (input.length > 16) return input.substring(input.length - 16);
  return input.padEnd(16, "0");
}

/**
 * KMC 암호화 (순수 JS)
 */
export function kmcEncrypt(plaintext: string, key: string = DEFAULT_SECU_KEY, iv: string = DEFAULT_SEED_IV): string {
  const plainBytes = iconv.encode(plaintext, "euc-kr");
  const paddedBytes = addPadding(Buffer.from(plainBytes));
  const processedKey = new Uint8Array(Buffer.from(processKeyOrIV(key), "utf8"));
  const processedIV = new Uint8Array(Buffer.from(processKeyOrIV(iv), "utf8"));

  const encrypted = KISA_SEED_CBC.SEED_CBC_Encrypt(
    processedKey,
    processedIV,
    new Uint8Array(paddedBytes),
    0,
    paddedBytes.length
  );

  return HEADER_PREFIX + Buffer.from(encrypted).toString("hex").toUpperCase();
}

/**
 * KMC 복호화 (순수 JS)
 */
export function kmcDecrypt(ciphertext: string, key: string = DEFAULT_SECU_KEY, iv: string = DEFAULT_SEED_IV): string {
  let targetCipher = ciphertext;
  if (targetCipher.startsWith(HEADER_PREFIX)) {
    targetCipher = targetCipher.substring(HEADER_PREFIX.length);
  }

  const encryptedBytes = Buffer.from(targetCipher, "hex");
  const processedKey = new Uint8Array(Buffer.from(processKeyOrIV(key), "utf8"));
  const processedIV = new Uint8Array(Buffer.from(processKeyOrIV(iv), "utf8"));

  const decrypted = KISA_SEED_CBC.SEED_CBC_Decrypt(
    processedKey,
    processedIV,
    new Uint8Array(encryptedBytes),
    0,
    encryptedBytes.length
  );

  const unpaddedBytes = removePadding(Buffer.from(decrypted));
  return iconv.decode(unpaddedBytes, "euc-kr").trim();
}

/**
 * 단일 문자열 복호화 (apiToken, certNum 등)
 */
export function kmcDecryptSimple(data: string): string {
  return kmcDecrypt(data);
}

interface TrCertParams {
  cpId: string;
  urlCode: string;
  certNum: string;
  date: string;
  certMet?: string;
  plusInfo?: string;
}

/**
 * KMC 요청 데이터(tr_cert) 생성 (순수 JS)
 */
export function generateTrCert(params: TrCertParams): string {
  const { cpId, urlCode, certNum, date, certMet = "M", plusInfo = "" } = params;
  
  const trCertData = [
    cpId, urlCode, certNum, date, certMet,
    "", "", "", "", "", "",
    plusInfo,
    EXTEND_VAR
  ].join("/");

  const enc1 = kmcEncrypt(trCertData);
  const hmac = kmcHash(enc1);
  const secondData = `${enc1}/${hmac}/${EXTEND_VAR}`;
  
  return kmcEncrypt(secondData);
}

interface RecCertResult {
  certNum: string;
  date: string;
  ci: string;
  phoneNo: string;
  phoneCorp: string;
  birthDay: string;
  gender: string;
  nation: string;
  name: string;
  result: string;
  certMet: string;
  ip: string;
  reserve1: string;
  reserve2: string;
  reserve3: string;
  reserve4: string;
  plusInfo: string;
  di: string;
}

/**
 * KMC 결과 데이터(rec_cert) 복호화 (순수 JS)
 */
export function parseRecCert(encryptedData: string): RecCertResult {
  const dec1 = kmcDecrypt(encryptedData);
  const parts1 = dec1.split("/");
  const encPara = parts1[0];
  
  const dec2 = kmcDecrypt(encPara);
  const parts2 = dec2.split("/");
  
  // CI/DI 복호화
  if (parts2[2]) parts2[2] = kmcDecrypt(parts2[2]);
  if (parts2[17]) parts2[17] = kmcDecrypt(parts2[17]);

  return {
    certNum: parts2[0],
    date: parts2[1],
    ci: parts2[2],
    phoneNo: parts2[3],
    phoneCorp: parts2[4],
    birthDay: parts2[5],
    gender: parts2[6],
    nation: parts2[7],
    name: parts2[8],
    result: parts2[9],
    certMet: parts2[10],
    ip: parts2[11],
    reserve1: parts2[12],
    reserve2: parts2[13],
    reserve3: parts2[14],
    reserve4: parts2[15],
    plusInfo: parts2[16],
    di: parts2[17]
  };
}

export function generateCertNum(): string {
  return generateDate() + Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
