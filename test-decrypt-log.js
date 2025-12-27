const { kmcDecrypt } = require("./src/lib/kmcCrypto");

const certNumEnc = "34B42EE08FF63129A8F8558B66B4535842C60A8E8444D6F7B283DD61862E11A9";
const expectedCertNum = "20251224133734467960"; // From previous log, might be different for this specific enc

try {
    const decrypted = kmcDecrypt(certNumEnc);
    console.log("Decrypted:", decrypted);
    console.log("Length:", decrypted.length);
} catch (e) {
    console.error("Error:", e);
}

