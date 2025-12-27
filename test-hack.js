const iconv = require("iconv-lite");
const { KISA_SEED_CBC } = require("@kr-yeon/kisa-seed");

function processKeyOrIV(input) {
  return Buffer.from(input.substring(0, 16), "utf8");
}

const key = new Uint8Array(processKeyOrIV("4261358467855134"));
const iv = new Uint8Array(processKeyOrIV("3AD8D3E22F132AC7"));
const plaintext = "MMST1001/015001/TEST1234567890/20251224120000/M////////0000000000000000";
const plainBytes = iconv.encode(plaintext, "euc-kr");

// PKCS5 Padding Manual
const padLen = 16 - (plainBytes.length % 16);
const padded = Buffer.alloc(plainBytes.length + padLen, padLen);
plainBytes.copy(padded);

console.log("Plaintext len:", plainBytes.length);
console.log("Padded len:", padded.length);

// Encrypt the padded data. Library will add ANOTHER 16 bytes of padding.
const enc = KISA_SEED_CBC.SEED_CBC_Encrypt(key, iv, new Uint8Array(padded), 0, padded.length);
console.log("Full Enc len:", enc.length);

// The first 'padded.length' bytes should be our encrypted data!
const ourEnc = enc.slice(0, padded.length);
const hex = Buffer.from(ourEnc).toString("hex").toUpperCase();

const expected = "68C5F58468E91228982B0AA253B1459C6BE275C805DEA5B774EC940B6EE3C993661AD553997A933A0F87A628EC90569DD163087A7FC5444BA259DC98926213BF5E47E803C1B2EAA1151C1671D0A32011";

console.log("Actual:", hex);
console.log("Expect:", expected);

if (hex === expected) {
    console.log("SUCCESS! Manual padding + Slice works!");
} else {
    console.log("FAILURE!");
}

