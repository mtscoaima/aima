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
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
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

로그인: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login

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
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
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

로그인: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login

© 2024 MTS플러스. All rights reserved.
  `;

  return { html, text };
}
