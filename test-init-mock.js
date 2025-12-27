const { KISA_SEED_CBC } = require("@kr-yeon/kisa-seed");

const pKey = new Uint8Array(16);
const pIv = new Uint8Array(16);

// Mock KISA_SEED_INFO
const pInfo = {
    encrypt: 0,
    ivec: new Uint8Array(16),
    seed_key: {
        key_data: new Array(32).fill(0)
    },
    cbc_buffer: new Uint8Array(16),
    buffer_length: 0,
    cbc_last_block: new Uint8Array(16),
    last_block_flag: 0
};

// Mock KISA_ENC_DEC
const encDec = { value: 0 }; // 0 for Encrypt

try {
    const success = KISA_SEED_CBC.SEED_CBC_init(pInfo, encDec, pKey, pIv);
    console.log("Success:", success);
    console.log("Round Keys:", pInfo.seed_key.key_data.slice(0, 4));
} catch (e) {
    console.error("Error:", e.message);
}

