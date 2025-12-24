package com.kmc.crypto;

import com.icert.comm.secu.IcertSecuManager;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
public class CryptoController {

    private final IcertSecuManager seed = new IcertSecuManager();

    @PostMapping("/encrypt-step1")
    public Map<String, String> encryptStep1(@RequestBody Map<String, String> params) {
        String cpId = params.get("cpId");
        String urlCode = params.get("urlCode");
        String certNum = params.get("certNum");
        String date = params.get("date");
        String certMet = params.get("certMet");
        String plusInfo = params.getOrDefault("plusInfo", "");
        String extendVar = params.getOrDefault("extendVar", "0000000000000000");

        String tr_cert = cpId + "/" + urlCode + "/" + certNum + "/" + date + "/" + certMet + "///////" + plusInfo + "/" + extendVar;
        String enc_tr_cert = seed.getEnc(tr_cert, "");
        String hmacMsg = seed.getMsg(enc_tr_cert);
        String final_tr_cert = seed.getEnc(enc_tr_cert + "/" + hmacMsg + "/" + extendVar, "");

        Map<String, String> result = new HashMap<>();
        result.put("tr_cert", final_tr_cert);
        return result;
    }

    @PostMapping("/decrypt")
    public Map<String, Object> decrypt(@RequestBody Map<String, String> params) {
        String rec_cert = params.get("rec_cert");
        Map<String, Object> response = new HashMap<>();

        try {
            // 1단계 복호화
            String dec1 = seed.getDec(rec_cert, "");
            
            int inf1 = dec1.indexOf("/", 0);
            int inf2 = dec1.indexOf("/", inf1 + 1);

            String encPara = dec1.substring(0, inf1);
            String encMsg1 = dec1.substring(inf1 + 1, inf2);

            // 무결성 검증
            String encMsg2 = seed.getMsg(encPara);
            if (!encMsg2.equals(encMsg1)) {
                response.put("success", false);
                response.put("message", "Integrity check failed");
                return response;
            }

            // 2단계 복호화
            String dec2 = seed.getDec(encPara, "");
            String[] parts = dec2.split("/", -1);

            Map<String, String> data = new HashMap<>();
            data.put("certNum", parts[0]);
            data.put("date", parts[1]);
            data.put("CI", seed.getDec(parts[2], ""));
            data.put("phoneNo", parts[3]);
            data.put("phoneCorp", parts[4]);
            data.put("birth", parts[5]);
            data.put("gender", parts[6]);
            data.put("nation", parts[7]);
            data.put("name", parts[8]);
            data.put("result", parts[9]);
            data.put("certMet", parts[10]);
            data.put("ip", parts[11]);
            data.put("reserve1", parts[12]);
            data.put("reserve2", parts[13]);
            data.put("reserve3", parts[14]);
            data.put("reserve4", parts[15]);
            data.put("plusInfo", parts[16]);
            data.put("DI", seed.getDec(parts[17], ""));

            response.put("success", true);
            response.put("data", data);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return response;
    }

    @PostMapping("/decrypt-simple")
    public Map<String, String> decryptSimple(@RequestBody Map<String, String> params) {
        String data = params.get("data");
        String decrypted = seed.getDec(data, "");
        Map<String, String> result = new HashMap<>();
        result.put("decrypted", decrypted);
        return result;
    }
}

