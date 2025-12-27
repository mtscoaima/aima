const { kmcHash, kmcEncrypt, kmcDecrypt } = require("./src/lib/kmcCrypto");

// 1. Hash Test
const enc1 = "KMC000002-7F36131B68C5F58468E91228982B0AA253B1459C6BE275C805DEA5B774EC940B6EE3C993661AD553997A933A0F87A628EC90569DD163087A7FC5444BA259DC98926213BF5E47E803C1B2EAA1151C1671D0A32011";
const expectedHmac = "e7b547caaaa1a2e69bffc762dbcc10ac22c93c84dc9bd3e3486b2e34487da11c";
const actualHmac = kmcHash(enc1);
console.log("Hash Test:", actualHmac === expectedHmac ? "PASSED" : "FAILED (" + actualHmac + ")");

// 2. Encrypt Test
const input1 = "MMST1001/015001/TEST1234567890/20251224120000/M////////0000000000000000";
const expectedEnc = "KMC000002-7F36131B68C5F58468E91228982B0AA253B1459C6BE275C805DEA5B774EC940B6EE3C993661AD553997A933A0F87A628EC90569DD163087A7FC5444BA259DC98926213BF5E47E803C1B2EAA1151C1671D0A32011";
const actualEnc = kmcEncrypt(input1);
console.log("Encrypt Test:", actualEnc === expectedEnc ? "PASSED" : "FAILED\n  Actual: " + actualEnc + "\n  Expect: " + expectedEnc);

// 3. Decrypt Test
const actualDec = kmcDecrypt(expectedEnc);
console.log("Decrypt Test:", actualDec === input1 ? "PASSED" : "FAILED (" + actualDec + ")");

