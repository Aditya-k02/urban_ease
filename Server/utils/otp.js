import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const store = new Map(); // key: email, value: { code, expiresAt, attempts }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function setOtp(email, code, ttlMs = 5 * 60 * 1000) {
  const expiresAt = Date.now() + ttlMs;
  store.set(email, { code, expiresAt, attempts: 0 });
}

export function verifyOtp(email, code) {
  const record = store.get(email);
  if (!record) return { ok: false, reason: "not_found" };
  if (Date.now() > record.expiresAt) {
    store.delete(email);
    return { ok: false, reason: "expired" };
  }
  record.attempts += 1;
  if (record.attempts > 5) {
    store.delete(email);
    return { ok: false, reason: "too_many_attempts" };
  }
  const ok = record.code === code;
  if (ok) store.delete(email);
  return { ok, reason: ok ? undefined : "mismatch" };
}

export async function sendLoginOtp(email) {
  const code = generateOTP();
  setOtp(email, code);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mes = {
    from: '"Urban ease" <no-reply@urbaneaseapp.com>',
    to: email,
    subject: "Your Login OTP",
    text: `Your OTP is ${code}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        <p>We received a login request for your account.</p>
        <p><strong style="font-size: 18px;">OTP: ${code}</strong></p>
        <p>This code expires in 5 minutes and can be used once.</p>
      </div>
    `,
  };

  await transporter.sendMail(mes);
  return true;
}

export function resendOtp(email) {
  // For potential future use
  return sendLoginOtp(email);
}

export async function sendTemporaryPassword(email, password) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const clientBase = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
  const subject = 'Welcome to Urban Ease — Temporary Password';
  const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
<style>
  body { margin:0; padding:0; background:#f4f6f8; font-family:'Segoe UI', Tahoma, sans-serif; color:#333 }
  .container { max-width:600px; margin:30px auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08) }
  .header { padding:36px 20px; text-align:center; color:#fff; background:linear-gradient(135deg,#1976d2,#0d47a1) }
  .icon { font-size:40px; margin-bottom:10px }
  .content { padding:28px 24px; line-height:1.6; font-size:16px; color:#444 }
  .credentials { background:#e3f2fd; border:1px solid #90caf9; padding:18px; border-radius:6px; margin:18px 0 }
  .credentials code { background:#f1f3f4; padding:4px 8px; border-radius:4px; font-family:monospace; font-size:14px }
  .btn { display:inline-block; padding:12px 22px; margin-top:18px; background:#1976d2; color:#fff !important; text-decoration:none; border-radius:6px; font-weight:600; text-transform:uppercase; font-size:14px; box-shadow:0 3px 6px rgba(25,118,210,0.3) }
  .footer { text-align:center; font-size:12px; color:#888; padding:16px; background:#f1f3f4 }
  @media (max-width:600px){ .container{ margin:0; border-radius:0 } .content{ padding:20px } }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🔐</div>
      <h1>Temporary Password Issued</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Welcome to <strong>Urban Ease</strong>. Use the temporary password below to sign in. For security, please change it after your first login.</p>
      <div class="credentials">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code>${password}</code></p>
      </div>
      <a class="btn" href="${clientBase}/SignIn">Login to Your Account</a>
    </div>
    <div class="footer">
      This is an automated message from Urban Ease.<br />
      Need help? Contact support.
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Urban Ease <no-reply@urbaneaseapp.com>',
    to: email,
    subject,
    html: htmlTemplate,
  });
  return true;
}
