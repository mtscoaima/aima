import com.icert.comm.secu.IcertSecuManager;

/**
 * KMC Encryption Bridge for Node.js
 * Usage: java -cp ".:ICERTSecu.jar" KmcBridge [enc|dec|dec-simple] [data]
 */
public class KmcBridge {
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Usage: java KmcBridge [enc|dec|dec-simple] [data]");
            System.exit(1);
        }

        String action = args[0];
        String data = args[1];

        try {
            IcertSecuManager seed = new IcertSecuManager();

            if ("enc".equals(action)) {
                String enc1 = seed.getEnc(data, "");
                String hmac = seed.getMsg(enc1);
                String extendVar = "0000000000000000";
                String secondData = enc1 + "/" + hmac + "/" + extendVar;
                String enc2 = seed.getEnc(secondData, "");
                System.out.print(enc2);

            } else if ("dec".equals(action)) {
                String dec1 = seed.getDec(data, "");
                String[] parts1 = dec1.split("/");
                if (parts1.length < 1) {
                    System.err.println("Invalid decryption step 1");
                    System.exit(1);
                }
                String encPara = parts1[0];
                String dec2 = seed.getDec(encPara, "");
                
                // 정규 가이드는 18개 필드이지만, 실제 데이터에 맞춰 분리
                // 가변적인 필드 내 슬래시 문제를 방지하기 위해 Java 레벨에서 CI/DI 복호화 후 
                // 커스텀 구분자로 합쳐서 반환
                String[] parts2 = dec2.split("/");
                
                if (parts2.length > 2 && parts2[2] != null && !parts2[2].isEmpty()) {
                    try { parts2[2] = seed.getDec(parts2[2], ""); } catch(Exception e) {}
                }
                if (parts2.length > 17 && parts2[17] != null && !parts2[17].isEmpty()) {
                    try { parts2[17] = seed.getDec(parts2[17], ""); } catch(Exception e) {}
                }
                
                // 파이프(|) 구분자를 사용하여 반환 (슬래시와 혼동 방지)
                System.out.print(String.join("|", parts2));

            } else if ("dec-simple".equals(action)) {
                String decrypted = seed.getDec(data, "");
                System.out.print(decrypted);

            } else {
                System.err.println("Unknown action: " + action);
                System.exit(1);
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
