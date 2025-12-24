/**
 * KMC 본인확인서비스 암호화/복호화 모듈 (Railway Java Server 연동 방식)
 * 
 * Vercel(Serverless) 환경에서 실행 가능한 API 호출 방식으로 전환되었습니다.
 * Railway에 배포된 Java 서버(JDK 1.8 + KMC JAR)를 통해 암복호화를 수행합니다.
 */

const KMC_CRYPTO_SERVER_URL = process.env.KMC_CRYPTO_SERVER_URL || "https://kmc-crypto-server-production.up.railway.app";

/**
 * Java 서버 API를 호출하여 암복호화 수행
 */
async function callCryptoServer(endpoint: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${KMC_CRYPTO_SERVER_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as Record<string, unknown>;
  } catch (error) {
    console.error(`[KMC Crypto Server Error] Endpoint: ${endpoint}`, error);
    throw new Error(`KMC Crypto Server Request Failed: ${endpoint}`);
  }
}

/**
 * 단일 문자열 복호화 (apiToken, certNum 등)
 */
export async function kmcDecryptSimple(data: string): Promise<string> {
  const result = await callCryptoServer("/decrypt-simple", { data });
  return result.decrypted as string;
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
 * KMC 요청 데이터(tr_cert) 생성
 */
export async function generateTrCert(params: TrCertParams): Promise<string> {
  const { cpId, urlCode, certNum, date, certMet = "M", plusInfo = "" } = params;
  
  const result = await callCryptoServer("/encrypt-step1", {
    cpId,
    urlCode,
    certNum,
    date,
    certMet,
    plusInfo,
    extendVar: "0000000000000000"
  });

  return result.tr_cert as string;
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
 * KMC 결과 데이터(rec_cert) 복호화
 */
export async function parseRecCert(encryptedData: string): Promise<RecCertResult> {
  const result = await callCryptoServer("/decrypt", { rec_cert: encryptedData });
  
  if (!result.success) {
    throw new Error((result.message as string) || "Decryption failed");
  }

  const data = result.data as Record<string, string>;
  return {
    certNum: data.certNum,
    date: data.date,
    ci: data.CI,
    phoneNo: data.phoneNo,
    phoneCorp: data.phoneCorp,
    birthDay: data.birth,
    gender: data.gender,
    nation: data.nation,
    name: data.name,
    result: data.result,
    certMet: data.certMet,
    ip: data.ip,
    reserve1: data.reserve1,
    reserve2: data.reserve2,
    reserve3: data.reserve3,
    reserve4: data.reserve4,
    plusInfo: data.plusInfo,
    di: data.DI
  };
}

export function generateCertNum(): string {
  return generateDate() + Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateDate(): string {
  // 현재 시간을 KST(UTC+9)로 변환 (서버 UTC 환경 대응)
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  
  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getUTCDate()).padStart(2, "0");
  const hours = String(kstDate.getUTCHours()).padStart(2, "0");
  const minutes = String(kstDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(kstDate.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
