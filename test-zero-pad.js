const iconv = require("iconv-lite");
const { KISA_SEED_CBC } = require("@kr-yeon/kisa-seed");

function processKeyOrIV(input) { return Buffer.from(input.substring(0, 16), "utf8"); }
const key = new Uint8Array(processKeyOrIV("4261358467855134"));
const iv = new Uint8Array(processKeyOrIV("3AD8D3E22F132AC7"));
const plaintext = "MMST1001/015001/TEST1234567890/20251224120000/M////////0000000000000000";
const plainBytes = iconv.encode(plaintext, "euc-kr");

// Zero Padding
const padded = Buffer.alloc(80, 0);
plainBytes.copy(padded);

function ourEncrypt(key, iv, data) {
    let prevCipher = iv;
    const result = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i += 16) {
        const block = data.slice(i, i + 16);
        const xored = Buffer.alloc(16);
        for (let j = 0; j < 16; j++) xored[j] = block[j] ^ prevCipher[j];
        const dummyIV = new Uint8Array(16);
        const enc = KISA_SEED_CBC.SEED_CBC_Encrypt(key, dummyIV, xored, 0, 16);
        const cipherBlock = Buffer.from(enc.slice(0, 16));
        cipherBlock.copy(result, i);
        prevCipher = cipherBlock;
    }
    return result;
}

const actualHex = ourEncrypt(key, iv, padded).toString("hex").toUpperCase();
const expected = "68C5F58468E91228982B0AA253B1459C6BE275C805DEA5B774EC940B6EE3C993661AD553997A933A0F87A628EC90569DD163087A7FC5444BA259DC98926213BF5E47E803C1B2EAA1151C1671D0A32011";

console.log("Actual:", actualHex);
console.log("Expect:", expected);
if (actualHex === expected) console.log("SUCCESS! Java uses ZERO PADDING!");
else console.log("FAILURE!");

