import nodemailer from "nodemailer";

// Gmail SMTP 설정
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// 이메일 전송 함수
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    const mailOptions = {
      from: `"MTS플러스" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("이메일 전송 실패:", error);
    return { success: false, error };
  }
}

// 아이디 찾기 이메일 템플릿
export function createUsernameEmailTemplate(
  usernames: string[],
  userName: string
) {
  const usernameList = usernames
    .map(
      (username) => `
        <div style="
          background: #f8fafc;
          border: 2px solid #0070f3;
          border-radius: 8px;
          padding: 16px;
          margin: 8px 0;
          text-align: center;
        ">
          <span style="
            font-size: 18px;
            font-weight: bold;
            color: #0070f3;
          ">${username}</span>
        </div>
      `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MTS플러스 아이디 찾기</title>
    </head>
    <body style="
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    ">
      <div style="
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eee;
        margin-bottom: 30px;
      ">
        <h1 style="
          color: #0070f3;
          font-size: 28px;
          margin: 0;
        ">MTS플러스</h1>
        <p style="
          color: #64748b;
          font-size: 14px;
          margin: 5px 0 0 0;
        ">AI 기반 타깃 마케팅 플랫폼</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="
          color: #1f2937;
          font-size: 20px;
          margin-bottom: 15px;
        ">안녕하세요, ${userName}님!</h2>
        
        <p style="
          color: #4b5563;
          font-size: 16px;
          margin-bottom: 20px;
        ">요청하신 아이디 찾기 결과를 안내드립니다.</p>

        <div style="margin: 20px 0;">
          <h3 style="
            color: #374151;
            font-size: 16px;
            margin-bottom: 15px;
          ">등록된 아이디:</h3>
          ${usernameList}
        </div>
      </div>

      <div style="
        background: #f8fafc;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        border-left: 4px solid #0070f3;
      ">
        <p style="
          color: #4b5563;
          font-size: 14px;
          margin: 0;
        ">
          <strong>보안 안내:</strong><br>
          • 이 이메일은 본인의 요청에 의해 발송되었습니다.<br>
          • 만약 본인이 요청하지 않았다면, 즉시 비밀번호를 변경해주세요.<br>
          • 아이디 정보를 타인과 공유하지 마세요.
        </p>
      </div>

      <div style="
        text-align: center;
        margin: 30px 0;
      ">
        <a href="${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/login" style="
          background: #0070f3;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          display: inline-block;
        ">로그인하기</a>
      </div>

      <div style="
        text-align: center;
        padding: 20px 0;
        border-top: 1px solid #eee;
        margin-top: 30px;
        color: #9ca3af;
        font-size: 12px;
      ">
        <p>이 이메일은 발신전용입니다. 문의사항은 고객센터를 이용해주세요.</p>
        <p>&copy; 2024 MTS플러스. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
MTS플러스 아이디 찾기

안녕하세요, ${userName}님!

요청하신 아이디 찾기 결과를 안내드립니다.

등록된 아이디:
${usernames.map((username) => `- ${username}`).join("\n")}

보안 안내:
- 이 이메일은 본인의 요청에 의해 발송되었습니다.
- 만약 본인이 요청하지 않았다면, 즉시 비밀번호를 변경해주세요.
- 아이디 정보를 타인과 공유하지 마세요.

로그인: ${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login

© 2024 MTS플러스. All rights reserved.
  `;

  return { html, text };
}

// 임시 비밀번호 이메일 템플릿
export function createTempPasswordEmailTemplate(
  tempPassword: string,
  userName: string,
  username: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MTS플러스 임시 비밀번호 안내</title>
    </head>
    <body style="
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    ">
      <div style="
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eee;
        margin-bottom: 30px;
      ">
        <h1 style="
          color: #0070f3;
          font-size: 28px;
          margin: 0;
        ">MTS플러스</h1>
        <p style="
          color: #64748b;
          font-size: 14px;
          margin: 5px 0 0 0;
        ">AI 기반 타깃 마케팅 플랫폼</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="
          color: #1f2937;
          font-size: 20px;
          margin-bottom: 15px;
        ">안녕하세요, ${userName}님!</h2>
        
        <p style="
          color: #4b5563;
          font-size: 16px;
          margin-bottom: 20px;
        ">요청하신 비밀번호 찾기에 따라 임시 비밀번호를 발급해드립니다.</p>

        <div style="
          background: #f8fafc;
          border: 2px solid #0070f3;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        ">
          <h3 style="
            color: #374151;
            font-size: 16px;
            margin: 0 0 10px 0;
          ">계정 정보:</h3>
          <p style="
            color: #4b5563;
            margin: 5px 0;
            font-size: 14px;
          "><strong>아이디:</strong> ${username}</p>
          
          <h3 style="
            color: #374151;
            font-size: 16px;
            margin: 20px 0 10px 0;
          ">임시 비밀번호:</h3>
          <div style="
            background: white;
            border: 2px solid #059669;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            margin: 10px 0;
          ">
            <span style="
              font-size: 20px;
              font-weight: bold;
              color: #059669;
              font-family: 'Courier New', monospace;
            ">${tempPassword}</span>
          </div>
        </div>
      </div>

      <div style="
        background: #fef3c7;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        border-left: 4px solid #f59e0b;
      ">
        <p style="
          color: #92400e;
          font-size: 14px;
          margin: 0;
        ">
          <strong>보안 안내:</strong><br>
          • 로그인 후 반드시 비밀번호를 변경해주세요.<br>
          • 임시 비밀번호는 타인과 공유하지 마세요.<br>
          • 이 이메일은 본인의 요청에 의해 발송되었습니다.<br>
          • 만약 본인이 요청하지 않았다면, 즉시 고객센터에 문의하세요.
        </p>
      </div>

      <div style="
        text-align: center;
        margin: 30px 0;
      ">
        <a href="${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/login" style="
          background: #0070f3;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          display: inline-block;
        ">로그인하기</a>
      </div>

      <div style="
        text-align: center;
        padding: 20px 0;
        border-top: 1px solid #eee;
        margin-top: 30px;
        color: #9ca3af;
        font-size: 12px;
      ">
        <p>이 이메일은 발신전용입니다. 문의사항은 고객센터를 이용해주세요.</p>
        <p>&copy; 2024 MTS플러스. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
MTS플러스 임시 비밀번호 안내

안녕하세요, ${userName}님!

요청하신 비밀번호 찾기에 따라 임시 비밀번호를 발급해드립니다.

계정 정보:
아이디: ${username}

임시 비밀번호: ${tempPassword}

보안 안내:
- 로그인 후 반드시 비밀번호를 변경해주세요.
- 임시 비밀번호는 타인과 공유하지 마세요.
- 이 이메일은 본인의 요청에 의해 발송되었습니다.
- 만약 본인이 요청하지 않았다면, 즉시 고객센터에 문의하세요.

로그인: ${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login

© 2024 MTS플러스. All rights reserved.
  `;

  return { html, text };
}

// 회원가입 환영 이메일 템플릿
export function createWelcomeEmailTemplate(userName: string): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const subject = "[MTS플러스] 회원가입을 환영합니다!";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MTS플러스 회원가입 환영</title>
    </head>
    <body style="
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      ">
        <div style="
          background: linear-gradient(135deg, #0070f3 0%, #00c4b4 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        ">
          <h1 style="
            font-size: 28px;
            margin: 0 0 10px 0;
          ">MTS플러스</h1>
          <p style="
            font-size: 14px;
            margin: 0;
            opacity: 0.9;
          ">AI 기반 타깃 마케팅 플랫폼</p>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="
            color: #1f2937;
            font-size: 22px;
            margin: 0 0 20px 0;
          ">안녕하세요, ${userName}님!</h2>
          
          <p style="
            color: #4b5563;
            font-size: 16px;
            margin-bottom: 25px;
          ">MTS플러스 서비스에 가입해 주셔서 감사합니다.<br>
          이제 맞춤형 마케팅 서비스를 이용하실 수 있습니다.</p>

          <div style="
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          ">
            <h3 style="
              color: #166534;
              font-size: 16px;
              margin: 0 0 15px 0;
            ">신규 가입 혜택</h3>
            <ul style="
              color: #15803d;
              font-size: 14px;
              margin: 0;
              padding-left: 20px;
            ">
              <li style="margin-bottom: 8px;">10만원 충전 시, 10만 포인트 추가 지급</li>
              <li style="margin-bottom: 8px;">기간 연장 1+1 혜택</li>
              <li>전담 매니저 배정</li>
            </ul>
          </div>

          <div style="
            text-align: center;
            margin: 30px 0;
          ">
            <a href="${baseUrl}/dashboard" style="
              background: linear-gradient(135deg, #0070f3 0%, #00c4b4 100%);
              color: white;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              display: inline-block;
            ">서비스 시작하기</a>
          </div>

          <div style="
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-top: 25px;
          ">
            <h4 style="
              color: #374151;
              font-size: 14px;
              margin: 0 0 10px 0;
            ">다음 단계</h4>
            <ol style="
              color: #6b7280;
              font-size: 13px;
              margin: 0;
              padding-left: 20px;
            ">
              <li style="margin-bottom: 5px;">기업 정보 등록 및 사업자 인증</li>
              <li style="margin-bottom: 5px;">캠페인 생성 및 타깃 설정</li>
              <li>마케팅 메시지 발송 시작</li>
            </ol>
          </div>
        </div>

        <div style="
          text-align: center;
          padding: 20px;
          border-top: 1px solid #eee;
          background: #fafafa;
          color: #9ca3af;
          font-size: 12px;
        ">
          <p style="margin: 0 0 5px 0;">문의: 070-8824-1139 | aima@mtsco.co.kr</p>
          <p style="margin: 0;">&copy; 2025 MTS플러스. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
MTS플러스 회원가입을 환영합니다!

안녕하세요, ${userName}님!

MTS플러스 서비스에 가입해 주셔서 감사합니다.
이제 맞춤형 마케팅 서비스를 이용하실 수 있습니다.

[신규 가입 혜택]
- 10만원 충전 시, 10만 포인트 추가 지급
- 기간 연장 1+1 혜택
- 전담 매니저 배정

서비스 시작하기: ${baseUrl}/dashboard

[다음 단계]
1. 기업 정보 등록 및 사업자 인증
2. 캠페인 생성 및 타깃 설정
3. 마케팅 메시지 발송 시작

문의: 070-8824-1139 | aima@mtsco.co.kr
© 2025 MTS플러스. All rights reserved.
  `;

  return { subject, html, text };
}

// 기업 인증 완료 / 캠페인 등록 가능 이메일 템플릿
export function createCampaignReadyEmailTemplate(
  userName: string,
  companyName: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const subject = "[MTS플러스] 기업 인증이 완료되었습니다 - 캠페인 등록 가능";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MTS플러스 기업 인증 완료</title>
    </head>
    <body style="
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      ">
        <div style="
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        ">
          <div style="
            font-size: 48px;
            margin-bottom: 15px;
          ">&#10003;</div>
          <h1 style="
            font-size: 24px;
            margin: 0;
          ">기업 인증 완료</h1>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="
            color: #1f2937;
            font-size: 20px;
            margin: 0 0 20px 0;
          ">${userName}님, 축하합니다!</h2>
          
          <div style="
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
          ">
            <p style="
              color: #166534;
              font-size: 16px;
              margin: 0;
            "><strong>${companyName}</strong>의 기업 인증이 완료되었습니다.</p>
          </div>

          <p style="
            color: #4b5563;
            font-size: 16px;
            margin-bottom: 25px;
          ">이제 캠페인을 등록하고 타깃 마케팅을 시작할 수 있습니다.</p>

          <div style="
            text-align: center;
            margin: 30px 0;
          ">
            <a href="${baseUrl}/campaigns/create" style="
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              display: inline-block;
            ">캠페인 만들기</a>
          </div>

          <div style="
            background: #eff6ff;
            border-radius: 8px;
            padding: 20px;
            margin-top: 25px;
          ">
            <h4 style="
              color: #1e40af;
              font-size: 14px;
              margin: 0 0 10px 0;
            ">캠페인 생성 시 참고사항</h4>
            <ul style="
              color: #3b82f6;
              font-size: 13px;
              margin: 0;
              padding-left: 20px;
            ">
              <li style="margin-bottom: 5px;">타깃 고객층을 정확하게 설정해주세요</li>
              <li style="margin-bottom: 5px;">캠페인 기간과 예산을 확인해주세요</li>
              <li>승인까지 1-2 영업일이 소요됩니다</li>
            </ul>
          </div>
        </div>

        <div style="
          text-align: center;
          padding: 20px;
          border-top: 1px solid #eee;
          background: #fafafa;
          color: #9ca3af;
          font-size: 12px;
        ">
          <p style="margin: 0 0 5px 0;">문의: 070-8824-1139 | aima@mtsco.co.kr</p>
          <p style="margin: 0;">&copy; 2025 MTS플러스. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
MTS플러스 기업 인증 완료

${userName}님, 축하합니다!

${companyName}의 기업 인증이 완료되었습니다.
이제 캠페인을 등록하고 타깃 마케팅을 시작할 수 있습니다.

캠페인 만들기: ${baseUrl}/campaigns/create

[캠페인 생성 시 참고사항]
- 타깃 고객층을 정확하게 설정해주세요
- 캠페인 기간과 예산을 확인해주세요
- 승인까지 1-2 영업일이 소요됩니다

문의: 070-8824-1139 | aima@mtsco.co.kr
© 2025 MTS플러스. All rights reserved.
  `;

  return { subject, html, text };
}

// 캠페인 승인 완료 이메일 템플릿
export function createCampaignApprovedEmailTemplate(
  userName: string,
  campaignName: string,
  startDate: string,
  endDate: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const subject = `[MTS플러스] "${campaignName}" 캠페인이 승인되었습니다`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MTS플러스 캠페인 승인 완료</title>
    </head>
    <body style="
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      ">
        <div style="
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        ">
          <div style="
            font-size: 48px;
            margin-bottom: 15px;
          ">&#127881;</div>
          <h1 style="
            font-size: 24px;
            margin: 0;
          ">캠페인 승인 완료</h1>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="
            color: #1f2937;
            font-size: 20px;
            margin: 0 0 20px 0;
          ">${userName}님, 캠페인이 승인되었습니다!</h2>

          <div style="
            background: #faf5ff;
            border: 1px solid #c4b5fd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
          ">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="
                  color: #6b7280;
                  font-size: 13px;
                  padding: 8px 0;
                ">캠페인명</td>
                <td style="
                  color: #1f2937;
                  font-size: 15px;
                  font-weight: 600;
                  padding: 8px 0;
                  text-align: right;
                ">${campaignName}</td>
              </tr>
              <tr>
                <td style="
                  color: #6b7280;
                  font-size: 13px;
                  padding: 8px 0;
                  border-top: 1px solid #e5e7eb;
                ">운영 기간</td>
                <td style="
                  color: #1f2937;
                  font-size: 15px;
                  padding: 8px 0;
                  text-align: right;
                  border-top: 1px solid #e5e7eb;
                ">${startDate} ~ ${endDate}</td>
              </tr>
            </table>
          </div>

          <p style="
            color: #4b5563;
            font-size: 16px;
            margin-bottom: 25px;
          ">설정하신 조건에 따라 광고가 노출됩니다.<br>
          캠페인 현황은 대시보드에서 확인하실 수 있습니다.</p>

          <div style="
            text-align: center;
            margin: 30px 0;
          ">
            <a href="${baseUrl}/campaigns" style="
              background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
              color: white;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              display: inline-block;
            ">캠페인 현황 보기</a>
          </div>

          <div style="
            background: #fefce8;
            border-radius: 8px;
            padding: 20px;
            margin-top: 25px;
            border-left: 4px solid #eab308;
          ">
            <p style="
              color: #854d0e;
              font-size: 13px;
              margin: 0;
            "><strong>참고:</strong> 캠페인 진행 중 수정이 필요하시면 고객센터로 문의해주세요.</p>
          </div>
        </div>

        <div style="
          text-align: center;
          padding: 20px;
          border-top: 1px solid #eee;
          background: #fafafa;
          color: #9ca3af;
          font-size: 12px;
        ">
          <p style="margin: 0 0 5px 0;">문의: 070-8824-1139 | aima@mtsco.co.kr</p>
          <p style="margin: 0;">&copy; 2025 MTS플러스. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
MTS플러스 캠페인 승인 완료

${userName}님, 캠페인이 승인되었습니다!

[캠페인 정보]
- 캠페인명: ${campaignName}
- 운영 기간: ${startDate} ~ ${endDate}

설정하신 조건에 따라 광고가 노출됩니다.
캠페인 현황은 대시보드에서 확인하실 수 있습니다.

캠페인 현황 보기: ${baseUrl}/campaigns

참고: 캠페인 진행 중 수정이 필요하시면 고객센터로 문의해주세요.

문의: 070-8824-1139 | aima@mtsco.co.kr
© 2025 MTS플러스. All rights reserved.
  `;

  return { subject, html, text };
}
