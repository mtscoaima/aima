const iconv = require("iconv-lite");
const KISA_SEED = require("kisa-seed");

function processKeyOrIV(input) {
  return Buffer.from(input.substring(0, 16), "utf8");
}

const key = processKeyOrIV("4261358467855134");
const iv = processKeyOrIV("3AD8D3E22F132AC7");
const plaintext = "MMST1001/015001/TEST1234567890/20251224120000/M////////0000000000000000";
const plainBytes = iconv.encode(plaintext, "euc-kr");

try {
    // Check if it has CBC mode
    console.log("Keys:", Object.keys(KISA_SEED));
    
    // Most Korean SEED libraries have 'CBC_Encrypt' or similar
    const enc = KISA_SEED.CBC_Encrypt(key, iv, plainBytes, 0, plainBytes.length);
    const hex = Buffer.from(enc).toString("hex").toUpperCase();
    console.log("Actual:", hex);
    console.log("Expect: 68C5F58468E91228982B0AA253B1459C6BE275C805DEA5B774EC940B6EE3C993661AD553997A933A0F87A628EC90569DD163087A7FC5444BA259DC98926213BF5E47E803C1B2EAA1151C1671D0A32011");
} catch (e) {
    console.error("Error:", e.message);
}

