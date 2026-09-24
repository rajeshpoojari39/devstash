interface VerificationEmailProps {
  name?: string | null;
  verifyUrl: string;
}

export function generateVerificationEmailHtml({
  name,
  verifyUrl,
}: VerificationEmailProps): string {
  const greetingName = name?.trim() ? name.trim() : "Developer";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email - DevStash</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0c0a09;
      color: #f5f5f5;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 560px;
      margin: 40px auto;
      background-color: #171717;
      border: 1px solid #262626;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px;
      text-align: center;
      border-bottom: 1px solid #262626;
      background: linear-gradient(180deg, #1c1917 0%, #171717 100%);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .logo-badge {
      background-color: #ffffff;
      color: #000000;
      font-weight: 800;
      font-size: 16px;
      padding: 6px 12px;
      border-radius: 6px;
      letter-spacing: -0.5px;
    }
    .logo-text {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
      line-height: 1.6;
      color: #d4d4d4;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      margin-bottom: 24px;
      color: #a3a3a3;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #ffffff;
      color: #0a0a0a !important;
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .btn:hover {
      background-color: #e5e5e5;
    }
    .fallback {
      background-color: #0a0a0a;
      border: 1px solid #262626;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      word-break: break-all;
      font-size: 13px;
      color: #737373;
    }
    .fallback a {
      color: #38bdf8;
      text-decoration: underline;
    }
    .footer {
      padding: 24px 32px;
      border-top: 1px solid #262626;
      font-size: 12px;
      color: #737373;
      text-align: center;
      background-color: #121212;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">
        <span class="logo-badge">DS</span>
        <span class="logo-text">DevStash</span>
      </div>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${greetingName}! 👋</div>
      <p class="text">
        Thanks for signing up for <strong>DevStash</strong>, your personal developer knowledge hub.
        Please confirm your email address by clicking the button below to activate your account.
      </p>
      <div class="btn-container">
        <a href="${verifyUrl}" class="btn" target="_blank">Verify Email Address</a>
      </div>
      <p class="text" style="font-size: 13px;">
        This verification link will expire in <strong>24 hours</strong>. If you did not create a DevStash account, you can safely ignore this email.
      </p>
      <div class="fallback">
        If the button above does not work, copy and paste this link into your browser:<br/>
        <a href="${verifyUrl}">${verifyUrl}</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} DevStash. All rights reserved.<br/>
      The developer knowledge hub for snippets, commands, notes, and resources.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateVerificationEmailText({
  name,
  verifyUrl,
}: VerificationEmailProps): string {
  const greetingName = name?.trim() ? name.trim() : "Developer";

  return `
Hello ${greetingName},

Welcome to DevStash! Please verify your email address to activate your account.

Click the link below to verify your email:
${verifyUrl}

This link will expire in 24 hours.

If you did not sign up for DevStash, you can safely ignore this email.

DevStash Team
  `.trim();
}
