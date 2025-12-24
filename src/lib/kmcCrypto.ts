/**
 * KMC 본인확인서비스 암호화/복호화 모듈 (Java Bridge 방식)
 * 
 * KMC에서 제공한 ICERTSecu_JDK18_v2.jar를 직접 사용하여 
 * 암복호화 정합성을 100% 보장합니다.
 */

import { execSync } from "child_process";
import path from "path";

// 경로 설정
const PROJECT_ROOT = process.cwd();
const JAR_PATH = path.join(PROJECT_ROOT, "docs/(주)엠티에스컴퍼니 MMST1001 KMC본인확인서비스 암호화 모듈 2/암호화모듈(JDK 1.8)/ICERTSecu_JDK18_v2.jar");
const BRIDGE_DIR = path.join(PROJECT_ROOT, "src/lib/kmc-bridge");
const CLASSPATH = `.:${BRIDGE_DIR}:${JAR_PATH}`;

/**
 * Java 브릿지를 호출하여 암복호화 수행
 */
function callJavaBridge(action: "enc" | "dec" | "dec-simple", data: string): string {
  try {
    // 쉘에서 자바 실행
    const command = `java -cp "${CLASSPATH}" KmcBridge ${action} "${data}"`;
    const result = execSync(command, { encoding: "utf-8" });
    return result.trim();
  } catch (error) {
    console.error(`[KMC Bridge Error] Action: ${action}`, error);
    throw new Error(`KMC Java Bridge Failed: ${action}`);
  }
}

/**
 * 단일 문자열 복호화 (apiToken, certNum 등)
 */
export function kmcDecryptSimple(data: string): string {
  return callJavaBridge("dec-simple", data);
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
export function generateTrCert(params: TrCertParams): string {
  const { cpId, urlCode, certNum, date, certMet = "M", plusInfo = "" } = params;
  
  // 1차 데이터 조합 (MTS 전용 샘플 규격: 13필드, 12슬래시)
  const trCertData = [
    cpId,           // 1: 고객사ID
    urlCode,        // 2: URL 코드
    certNum,        // 3: 요청번호
    date,           // 4: 요청일시
    certMet,        // 5: 본인확인방법
    "", "", "", "", "", "", // 6~11: Spare 필드
    plusInfo,       // 12: 추가정보
    "0000000000000000"      // 13: 확장변수
  ].join("/");
  
  if (process.env.NODE_ENV !== "production") {
    console.log("[KMC Debug] trCertData:", trCertData);
  }

  // Java 브릿지를 통해 최종 tr_cert(헤더 포함) 생성
  const trCert = callJavaBridge("enc", trCertData);
  
  if (process.env.NODE_ENV !== "production") {
    console.log("[KMC Debug] Generated tr_cert (FULL):", trCert);
  }

  return trCert;
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
export function parseRecCert(encryptedData: string): RecCertResult {
  try {
    // Java 브릿지를 통해 복호화 (2단계 복호화 일괄 수행)
    const rawResult = callJavaBridge("dec", encryptedData);
    
    if (process.env.NODE_ENV !== "production") {
      console.log("[KMC Debug] Raw Decrypted String (Pipe Sep):", rawResult);
    }

    const parts = rawResult.split("|");
    
    // 복호화 필드 매핑
    return {
      certNum: parts[0],
      date: parts[1],
      ci: parts[2], // CI
      phoneNo: parts[3],
      phoneCorp: parts[4],
      birthDay: parts[5],
      gender: parts[6],
      nation: parts[7],
      name: parts[8],
      result: parts[9],
      certMet: parts[10],
      ip: parts[11],
      reserve1: parts[12],
      reserve2: parts[13],
      reserve3: parts[14],
      reserve4: parts[15],
      plusInfo: parts[16],
      di: parts[17]  // DI
    };
  } catch (error) {
    console.error("KMC Parsing Error:", error);
    throw new Error("Parsing Error");
  }
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
