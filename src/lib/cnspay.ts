/**
 * LG CNS CNSPay 암복호화 유틸리티
 * 참고: CNSPay_Non-PG_암복호화_샘플_v1.2
 */

import crypto from "crypto";

// 환경변수에서 키 가져오기
const CNSPAY_MID = process.env.CNSPAY_MID || "cnstest30m"; // 테스트용 MID
const CNSPAY_MERCHANT_KEY = process.env.CNSPAY_MERCHANT_KEY || "";
const CNSPAY_ENC_KEY = process.env.CNSPAY_ENC_KEY || ""; // AES 암호화 키 (16바이트)
const CNSPAY_HASH_KEY = process.env.CNSPAY_HASH_KEY || ""; // Hash Salt 키

/**
 * SHA256 Salt Hash 생성 (PHP/Python 샘플 코드 기준)
 * 
 * PHP: base64_encode(hash('sha256', hash('sha256', $key.$plainText, true), false))
 * Python: base64.b64encode(hashlib.sha256(hashlib.sha256(salt+plainText).digest()).hexdigest())
 * 
 * 1차 해시: sha256(salt + plainText) -> raw bytes
 * 2차 해시: sha256(1차 해시 결과) -> raw bytes -> hex string
 * 결과: base64(hex string)
 */
export function sha256SaltHash(plainText: string, salt: string): string {
  // 1차 해시: salt + plainText -> raw bytes
  const firstHash = crypto.createHash("sha256");
  firstHash.update(salt + plainText, "utf8");
  const firstDigest = firstHash.digest(); // raw bytes (Buffer)

  // 2차 해시: 1차 해시 결과(raw bytes) -> hex string
  const secondHash = crypto.createHash("sha256");
  secondHash.update(firstDigest); // Buffer 입력
  const hexString = secondHash.digest("hex"); // hex 문자열로 출력

  // Base64 인코딩
  const base64Result = Buffer.from(hexString, "utf8").toString("base64");

  // 디버그 로그
  console.log("🔐 Hash Debug:", {
    input: `${salt.substring(0, 4)}...+${plainText}`,
    firstDigestHex: firstDigest.toString("hex").substring(0, 16) + "...",
    hexString: hexString.substring(0, 16) + "...",
    result: base64Result.substring(0, 20) + "...",
  });

  return base64Result;
}

/**
 * AES-128-CBC 암호화
 * - 키: MerchantKey 앞 16바이트 (16 bytes = AES-128)
 * - IV: MerchantKey 앞 16바이트 (키와 동일)
 * - 패딩: PKCS5/PKCS7
 * 
 * 참고: CNSPay_Non-PG_암복호화_샘플_v1.2 (PHP 샘플)
 * "key : 제공된 MerchantKey(암호화 시 앞 16byte만 사용)"
 */
export function encryptAES256CBC(plainText: string, merchantKey?: string): string {
  const key = merchantKey || CNSPAY_MERCHANT_KEY;
  if (!key || key.length < 16) {
    throw new Error("MerchantKey가 설정되지 않았거나 길이가 부족합니다.");
  }

  // MerchantKey의 앞 16바이트 추출 (문자열 기준)
  const key16 = key.substring(0, 16);
  
  // 키와 IV 모두 앞 16바이트 사용 (PHP 샘플과 동일)
  const keyBuffer = Buffer.from(key16, "utf-8"); // 16 bytes
  const iv = Buffer.from(key16, "utf-8"); // 16 bytes

  // AES-128-CBC 사용 (16바이트 키 = 128비트)
  const cipher = crypto.createCipheriv("aes-128-cbc", keyBuffer, iv);
  cipher.setAutoPadding(true);

  let encrypted = cipher.update(plainText, "utf-8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Base64 인코딩
  return encrypted.toString("base64");
}

/**
 * AES-128-CBC 복호화
 */
export function decryptAES256CBC(encryptedText: string, merchantKey?: string): string {
  const key = merchantKey || CNSPAY_MERCHANT_KEY;
  if (!key || key.length < 16) {
    throw new Error("MerchantKey가 설정되지 않았거나 길이가 부족합니다.");
  }

  // MerchantKey의 앞 16바이트 추출
  const key16 = key.substring(0, 16);
  
  const keyBuffer = Buffer.from(key16, "utf-8");
  const iv = Buffer.from(key16, "utf-8");

  const decipher = crypto.createDecipheriv("aes-128-cbc", keyBuffer, iv);
  decipher.setAutoPadding(true);

  // Base64 디코딩
  const encryptedBuffer = Buffer.from(encryptedText, "base64");

  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf-8");
}

/**
 * EncryptData 생성 (거래 검증용 해시)
 * Target String: EdiDate + MID + Amt
 * 해시: SHA256 Salt Hash (MerchantKey를 salt로 사용)
 * 
 * 문서 참고: CNSPay_Non-PG_연동가이드
 * "거래 Validation Check 용도의 인증요청 Hash"
 * "a = Target String 생성 : EdiDate+MID+Amt"
 * "b = Sha256 SaltHash(a, MerchantKey) : 이 값을 설정"
 * "* 해쉬키 : 가맹점 계약 시 발급된 상점키(MerchantKey)"
 */
export function generateEncryptData(
  ediDate: string,
  mid: string,
  amt: number,
  merchantKey?: string
): string {
  const targetString = ediDate + mid + amt;
  // 문서에 따라 MerchantKey를 salt로 사용해야 함
  const salt = merchantKey || CNSPAY_MERCHANT_KEY;
  return sha256SaltHash(targetString, salt);
}

/**
 * 취소용 EncryptData 생성
 * Target String: EdiDate + MID + CancelAmt
 */
export function generateCancelEncryptData(
  ediDate: string,
  mid: string,
  cancelAmt: number,
  merchantKey?: string
): string {
  const targetString = ediDate + mid + cancelAmt;
  const salt = merchantKey || CNSPAY_MERCHANT_KEY;
  return sha256SaltHash(targetString, salt);
}

/**
 * 거래조회용 EncryptData 생성
 * Target String: EdiDate + MID + TxnId
 */
export function generateQueryEncryptData(
  ediDate: string,
  mid: string,
  txnId: string,
  merchantKey?: string
): string {
  const targetString = ediDate + mid + txnId;
  const salt = merchantKey || CNSPAY_MERCHANT_KEY;
  return sha256SaltHash(targetString, salt);
}

/**
 * 현재 날짜시간을 CNSPay 형식으로 반환
 * 형식: YYYYMMDDHH24MISS
 */
export function getEdiDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * 고유 주문번호 생성
 * 형식: C{timestamp36}_{userId}_{randomHex} (최대 40바이트 제한)
 * 예: C1a2b3c4d_123_a1b2c3d4 (약 20~25자)
 */
export function generateMoid(userId: string | number): string {
  // 타임스탬프를 base36으로 변환하여 길이 단축 (13자 -> 8자)
  const timestamp36 = Date.now().toString(36);
  const randomHex = crypto.randomBytes(3).toString("hex"); // 6자
  const userIdStr = String(userId).substring(0, 10); // 최대 10자로 제한
  
  // 총 길이: 1(C) + 8(timestamp) + 1(_) + 10(userId) + 1(_) + 6(random) = 27자 이하
  return `C${timestamp36}_${userIdStr}_${randomHex}`;
}

/**
 * CNSPay 환경변수 가져오기
 */
export function getCNSPayConfig() {
  return {
    mid: CNSPAY_MID,
    merchantKey: CNSPAY_MERCHANT_KEY,
    encKey: CNSPAY_ENC_KEY,
    hashKey: CNSPAY_HASH_KEY,
    apiUrl: process.env.CNSPAY_API_URL || "https://pg.cnspay.co.kr",
    jsPath: process.env.CNSPAY_JS_PATH || "/dlpnonv2/cnspay_tr.js",
  };
}

/**
 * 개인정보 암호화 (주문자명, 연락처, 이메일 등)
 * MerchantKey의 앞 16바이트로 AES256 암호화
 */
export function encryptPersonalInfo(value: string, merchantKey?: string): string {
  if (!value) return "";
  return encryptAES256CBC(value, merchantKey || CNSPAY_MERCHANT_KEY);
}

/**
 * 개인정보 복호화
 */
export function decryptPersonalInfo(encryptedValue: string, merchantKey?: string): string {
  if (!encryptedValue) return "";
  return decryptAES256CBC(encryptedValue, merchantKey || CNSPAY_MERCHANT_KEY);
}

// CNSPay 응답코드 정의
export const CNSPAY_RESULT_CODES = {
  SUCCESS: "0000",
  // 초기화 관련
  C101: "가맹점 ID는 필수입력사항 입니다.",
  C102: "가맹점 ID의 제한 길이가 초과 되었습니다.",
  C103: "존재하지 않는 가맹점 ID입니다.",
  // 인증 관련
  C201: "상점정보가 없습니다.",
  C203: "보안 검증 실패 오류 입니다.",
  C205: "상점서명키를 확인해 주세요.",
  C276: "인증창 닫기를 호출하였습니다.",
  // 기타
  "9999": "기타오류 발생",
} as const;

/**
 * CNSPay 응답 코드 메시지 반환
 */
export function getResultMessage(code: string): string {
  return (
    CNSPAY_RESULT_CODES[code as keyof typeof CNSPAY_RESULT_CODES] ||
    `알 수 없는 오류 (${code})`
  );
}

// 타입 정의
export interface CNSPayInitRequest {
  MID: string;
  Moid: string;
  EdiDate: string;
  GoodsNm: string;
  Amt: number;
  EncryptData: string;
  CardCd?: string;
}

export interface CNSPayInitResponse {
  ResultCd: string;
  ResultMsg: string;
  TxnId: string;
  Moid: string;
  PrDt: string;
  Width?: string;
  Height?: string;
}

export interface CNSPayApproveRequest {
  PayMethod: string;
  GoodsCnt: string;
  GoodsNm: string;
  Amt: number;
  MID: string;
  BuyerNm?: string;
  BuyerTel?: string;
  BuyerEmail?: string;
  EdiDate: string;
  EncryptData: string;
  Moid: string;
  Currency: string;
  TxnId: string;
  TrKey: string;
  SupplyAmt?: number;
  ServiceAmt?: number;
  GoodsVat?: number;
}

export interface CNSPayApproveResponse {
  ResultCd: string;
  ResultMsg: string;
  TID: string;
  Moid: string;
  MID: string;
  PayMethod: string;
  Amt: number;
  AuthDate: string;
  AuthCd: string;
  BuyerNm?: string;
  CcPartCl?: string;
  // 신용카드 추가
  CardCd?: string;
  CardNm?: string;
  CardQuota?: string;
  CardBin?: string;
  VanCd?: string;
  CardPoint?: string;
  CardInterest?: string;
  CardNo?: string;
  CardCl?: string;
  CardType?: string;
}

export interface CNSPayCancelRequest {
  MID: string;
  TID: string;
  CancelAmt: number;
  EncryptData: string;
  EdiDate: string;
  CancelMsg: string;
  PartialCancelCd: string;
  CancelNo?: number;
  CheckRemainAmt?: number;
  SupplyAmt?: number;
  ServiceAmt?: number;
  GoodsVat?: number;
  CancelIP?: string;
}

export interface CNSPayCancelResponse {
  ResultCd: string;
  ResultMsg: string;
  ErrorCd?: string;
  ErrorMsg?: string;
  CancelAmt: number;
  CancelDate: string;
  CancelTime: string;
  PayMethod: string;
  MID: string;
  TID: string;
  StateCd: string;
}

