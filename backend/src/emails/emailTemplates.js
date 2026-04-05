export function createWelcomeEmailTemplate(name, clientURL) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Chatify</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:0 auto; padding:20px; background-color:#f0f4f8;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f1621 0%, #1a2a3a 100%); padding:36px 30px; text-align:center; border-radius:16px 16px 0 0; position:relative; overflow:hidden;">
      <div style="position:absolute; top:-40px; left:-40px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle, rgba(79,209,197,0.15) 0%, transparent 70%);"></div>
      <div style="position:absolute; bottom:-40px; right:-40px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%);"></div>

      <!-- Logo circle -->
      <div style="display:inline-block; width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg, #4fd1c5 0%, #38b2ac 50%, #667eea 100%); padding:14px; margin-bottom:16px; box-shadow:0 8px 32px rgba(79,209,197,0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style="width:44px;height:44px;">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9l-1 2H8l1-2-1-2h4l1 2zm4 0l-1 2h-2l1-2-1-2h2l1 2z"/>
        </svg>
      </div>

      <h1 style="color:white; margin:0; font-size:28px; font-weight:700; letter-spacing:-0.5px;">Welcome to Chatify!</h1>
      <p style="color:rgba(255,255,255,0.6); margin:8px 0 0; font-size:15px;">Real-time messaging, reimagined</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff; padding:36px 32px; border-radius:0 0 16px 16px; box-shadow:0 8px 30px rgba(0,0,0,0.08);">

      <p style="font-size:18px; color:#1a2a3a; margin:0 0 12px;"><strong>Hey ${name} 👋</strong></p>
      <p style="color:#4a5c70; font-size:15px; margin:0 0 24px;">
        Your Chatify account is ready. You can now connect with friends and colleagues in real-time, no matter where they are.
      </p>

      <!-- Feature highlights -->
      <div style="background:#f8fafc; border-radius:12px; padding:24px; margin-bottom:28px; border-left:4px solid #4fd1c5;">
        <p style="font-size:14px; font-weight:700; color:#0f1621; margin:0 0 14px; text-transform:uppercase; letter-spacing:0.05em;">What you can do on Chatify</p>
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0; color:#4a5c70; font-size:14px;">💬</td>
            <td style="padding:6px 0; color:#4a5c70; font-size:14px;">Real-time 1-on-1 and group messaging</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#4a5c70; font-size:14px;">🎤</td>
            <td style="padding:6px 0; color:#4a5c70; font-size:14px;">Voice messages and photo sharing</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#4a5c70; font-size:14px;">🤖</td>
            <td style="padding:6px 0; color:#4a5c70; font-size:14px;">Built-in AI assistant (Chatify AI)</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#4a5c70; font-size:14px;">📅</td>
            <td style="padding:6px 0; color:#4a5c70; font-size:14px;">Schedule messages for later</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#4a5c70; font-size:14px;">⏱</td>
            <td style="padding:6px 0; color:#4a5c70; font-size:14px;">Disappearing messages & link previews</td>
          </tr>
        </table>
      </div>

      <!-- CTA button -->
      <div style="text-align:center; margin:0 0 28px;">
        <a href="${clientURL}" style="display:inline-block; background:linear-gradient(135deg, #4fd1c5, #38b2ac); color:white; text-decoration:none; padding:14px 36px; border-radius:50px; font-weight:700; font-size:15px; letter-spacing:0.02em; box-shadow:0 6px 20px rgba(79,209,197,0.35);">
          Open Chatify →
        </a>
      </div>

      <p style="color:#8fa3b8; font-size:13px; margin:0 0 4px;">If you didn't create this account, you can safely ignore this email.</p>
      <p style="color:#8fa3b8; font-size:13px; margin:0;">Happy chatting! 🚀</p>

      <div style="margin-top:28px; padding-top:20px; border-top:1px solid #e8edf2;">
        <p style="color:#4a5c70; font-size:14px; margin:0;">Best regards,<br><strong style="color:#0f1621;">The Chatify Team</strong></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:20px; color:#a0aec0; font-size:12px;">
      <p style="margin:0;">© 2025 Chatify. All rights reserved.</p>
      <p style="margin:6px 0 0;">
        <a href="${clientURL}" style="color:#4fd1c5; text-decoration:none;">Visit Chatify</a>
      </p>
    </div>

  </body>
  </html>
  `;
}

export function createOtpEmailTemplate(otp) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatify Verification Code</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:0 auto; padding:20px; background-color:#f0f4f8;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f1621 0%, #1a2a3a 100%); padding:36px 30px; text-align:center; border-radius:16px 16px 0 0; position:relative; overflow:hidden;">
      <h1 style="color:white; margin:0; font-size:24px; font-weight:700; letter-spacing:-0.5px;">Chatify Verification</h1>
    </div>

    <!-- Body -->
    <div style="background:#ffffff; padding:36px 32px; border-radius:0 0 16px 16px; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
      <p style="font-size:16px; color:#1a2a3a; margin:0 0 12px;">Here is your verification code. It expires in 5 minutes.</p>
      
      <div style="text-align:center; margin:32px 0;">
        <span style="display:inline-block; font-size:32px; font-weight:bold; letter-spacing:8px; padding:12px 24px; background:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; color:#0f1621;">
          ${otp}
        </span>
      </div>

      <p style="color:#8fa3b8; font-size:13px; margin:0 0 4px;">If you didn't request this code, you can safely ignore this email.</p>
    </div>
  </body>
  </html>
  `;
}
