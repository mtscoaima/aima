import { NextRequest, NextResponse } from "next/server";

// HTML 이스케이프 함수
const escapeHtml = (unsafe: string | number) => {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // URL 파라미터에서 결제 정보 추출
  const txnId = searchParams.get("txnId") || "";
  const mid = searchParams.get("mid") || "";
  const moid = searchParams.get("moid") || "";
  const goodsName = searchParams.get("goodsName") || "";
  const amount = searchParams.get("amount") || "0";
  const buyerName = searchParams.get("buyerName") || "";
  const buyerTel = searchParams.get("buyerTel") || "";
  const buyerEmail = searchParams.get("buyerEmail") || "";
  const ediDate = searchParams.get("ediDate") || "";
  const encryptData = searchParams.get("encryptData") || "";
  const cardCd = searchParams.get("cardCd") || "";
  const origin = searchParams.get("origin") || "";

  // 필수 파라미터 검증
  if (!txnId || !mid || !encryptData) {
    return new NextResponse("필수 파라미터가 누락되었습니다.", { status: 400 });
  }

  // BC카드(01)는 레이어 방식 미지원, 팝업 방식 사용
  const useLayerDlp = cardCd === "01" ? "N" : "Y";

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 진행 중...</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e0e0e0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .message { color: #333; font-size: 16px; margin-bottom: 10px; }
    .sub-message { color: #666; font-size: 14px; }
    .error { color: #dc2626; }
    .btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      margin-top: 20px;
    }
    .btn:hover { background: #2563eb; }
    #payForm { display: none; }
    /* CNSPay 레이어가 뜨면 status 숨김 */
    #lgcns_layer ~ #status, #lgpg-bg ~ #status { display: none !important; }
  </style>
</head>
<body>
  <div id="status" class="container">
    <div class="spinner"></div>
    <p class="message">결제창을 불러오는 중입니다...</p>
    <p class="sub-message">잠시만 기다려주세요.</p>
  </div>

  <form id="payForm" name="payForm" method="post">
    <input type="hidden" name="TxnId" value="${escapeHtml(txnId)}" />
    <input type="hidden" name="MID" value="${escapeHtml(mid)}" />
    <input type="hidden" name="PayMethod" value="CARD" />
    <input type="hidden" name="Moid" value="${escapeHtml(moid)}" />
    <input type="hidden" name="GoodsNm" value="${escapeHtml(goodsName)}" />
    <input type="hidden" name="Currency" value="KRW" />
    <input type="hidden" name="Amt" value="${escapeHtml(amount)}" />
    <input type="hidden" name="BuyerNm" value="${escapeHtml(buyerName)}" />
    <input type="hidden" name="BuyerTel" value="${escapeHtml(buyerTel)}" />
    <input type="hidden" name="BuyerEmail" value="${escapeHtml(buyerEmail)}" />
    <input type="hidden" name="EdiDate" value="${escapeHtml(ediDate)}" />
    <input type="hidden" name="EncryptData" value="${escapeHtml(encryptData)}" />
    <input type="hidden" name="CardCd" value="${escapeHtml(cardCd)}" />
    <input type="hidden" name="UseLayerDlp" value="${useLayerDlp}" />
    <input type="hidden" name="CardQuota" value="00" />
    <input type="hidden" name="CardInterest" value="0" />
  </form>

  <script>
    var parentOrigin = "${escapeHtml(origin)}";
    
    // 에러 표시
    function showError(msg) {
      document.getElementById('status').innerHTML = 
        '<p class="message error">' + msg + '</p>' +
        '<button class="btn" onclick="window.close()">닫기</button>';
    }

    // CNSPay 인증 완료 콜백
    function cnspaySubmit(message) {
      console.log('CNSPay 인증 완료:', message);
      if (typeof p_win !== 'undefined' && p_win != null) {
        p_win.close();
      }
      
      if (window.opener) {
        window.opener.postMessage({
          type: 'CNSPAY_SUCCESS',
          trKey: message.TrKey,
          resultCd: message.ResultCd,
          resultMsg: message.ResultMsg,
          paymentData: {
            txnId: "${escapeHtml(txnId)}",
            mid: "${escapeHtml(mid)}",
            moid: "${escapeHtml(moid)}",
            ediDate: "${escapeHtml(ediDate)}",
            encryptData: "${escapeHtml(encryptData)}"
          }
        }, parentOrigin);
        setTimeout(function() { window.close(); }, 500);
      }
    }

    // CNSPay 인증 취소/실패 콜백
    function cnspayClose(message) {
      console.log('CNSPay 인증 취소:', message);
      if (typeof p_win !== 'undefined' && p_win != null) {
        p_win.close();
      }
      
      var errorMsg = '결제가 취소되었습니다.';
      if (message && message.ResultMsg) {
        errorMsg = '[' + message.ResultCd + '] ' + message.ResultMsg;
      }
      
      if (window.opener) {
        window.opener.postMessage({ type: 'CNSPAY_CLOSE', error: errorMsg }, parentOrigin);
      }
      showError(errorMsg);
    }
  </script>

  <!-- CNSPay SDK - easyXDM 필수 의존성 추가 -->
  <script src="https://pg.cnspay.co.kr/dlpnonv2/scripts/lib/easyXDM.min.js"></script>
  <script src="https://pg.cnspay.co.kr/dlpnonv2/cnspay_tr.js"></script>

  <script>
    // SDK 로드 직후 바로 실행
    if (typeof goPay === 'function') {
      console.log('goPay 호출');
      document.getElementById('status').style.display = 'none';
      goPay(document.payForm);
      
      // 창 크기 자동 조정
      setTimeout(function() {
        try {
          if (typeof cnsPopWidth !== 'undefined' && typeof cnsPopHeight !== 'undefined') {
            var newWidth = Math.max(cnsPopWidth + 50, 550);
            var newHeight = Math.max(cnsPopHeight + 100, 750);
            window.resizeTo(newWidth, newHeight);
            window.moveTo((screen.width - newWidth) / 2, (screen.height - newHeight) / 2);
          }
        } catch(e) { console.log('창 조정 오류:', e); }
      }, 1000);
    } else {
      showError('결제 시스템을 불러올 수 없습니다. (goPay not found)');
    }
  </script>
</body>
</html>
`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

