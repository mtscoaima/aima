const iconv = require("iconv-lite");
const { KISA_SEED_CBC } = require("@kr-yeon/kisa-seed");

function processKeyOrIV(input) { return Buffer.from(input.substring(0, 16), "utf8"); }
const key = new Uint8Array(processKeyOrIV("4261358467855134"));
const iv = new Uint8Array(processKeyOrIV("3AD8D3E22F132AC7"));
const plaintext = "MMST1001/015001/TEST1234567890/20251224120000/M////////0000000000000000";
const plainBytes = iconv.encode(plaintext, "euc-kr");

// Zero Padding
const paddedLen = Math.ceil(plainBytes.length / 16) * 16;
const padded = Buffer.alloc(paddedLen, 0);
plainBytes.copy(padded);

// HACK: Pass the PADDED buffer and its PADDED length.
// The library will think it needs to add another 16 bytes of padding (0x10).
// But it will correctly convert our 80 bytes into integers first!
const encFull = KISA_SEED_CBC.SEED_CBC_Encrypt(key, iv, new Uint8Array(padded), 0, padded.length);
const ourEnc = encFull.slice(0, padded.length);
const actualHex = Buffer.from(ourEnc).toString("hex").toUpperCase();

const expected = "68C5F58468E91228982B0AA253B1459C6BE275C805DEA5B774EC940B6EE3C993661AD553997A933A0F87A628EC90569DD163087A7FC5444BA259DC98926213BF5E47E803C1B2EAA1151C1671D0A32011";

console.log("Actual:", actualHex);
console.log("Expect:", expected);
if (actualHex === expected) console.log("SUCCESS! The Length-Hack works!");
else console.log("FAILURE!");

