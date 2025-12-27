import com.icert.comm.secu.IcertSecuManager;
import java.lang.reflect.Field;

public class KmcDeepInspect {
    public static void main(String[] args) {
        try {
            IcertSecuManager manager = new IcertSecuManager();
            Field keyField = IcertSecuManager.class.getDeclaredField("secuKey");
            keyField.setAccessible(true);
            System.out.println("Manager SecuKey: " + keyField.get(manager));

            String data = "MMST1001/015001/TEST1234567890/20251224120000/M////////0000000000000000";
            String enc1 = manager.getEnc(data, "");
            System.out.println("Full Result: " + enc1);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

