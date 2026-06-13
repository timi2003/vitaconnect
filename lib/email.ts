// lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_SERVER_HOST   ?? "smtp.resend.com",
  port:   parseInt(process.env.EMAIL_SERVER_PORT ?? "465", 10),
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVER_USER     ?? "resend",
    pass: process.env.EMAIL_SERVER_PASSWORD ?? "",
  },
});

const FROM = process.env.EMAIL_FROM ?? "VitaConnect <noreply@vitaconnect.health>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://vitaconnect.health";

// ── Templates ────────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <style>
    body { font-family: 'DM Sans', system-ui, sans-serif; background:#0a0f1e; color:#e6f4ff; margin:0; padding:0; }
    .container { max-width:600px; margin:0 auto; padding:40px 20px; }
    .card { background:#0d1f3d; border:1px solid rgba(10,140,232,0.2); border-radius:16px; padding:32px; }
    .logo { display:flex; align-items:center; gap:10px; margin-bottom:24px; }
    .logo-icon { width:36px; height:36px; background:#0a8ce8; border-radius:10px; display:flex; align-items:center; justify-content:center; }
    .logo-text { font-size:18px; font-weight:700; color:#e6f4ff; }
    .btn { display:inline-block; padding:12px 28px; background:#0a8ce8; color:#fff; text-decoration:none; border-radius:12px; font-weight:600; font-size:14px; margin:16px 0; }
    .divider { border:none; border-top:1px solid rgba(10,140,232,0.15); margin:24px 0; }
    .footer { font-size:12px; color:#4d6fa8; margin-top:24px; text-align:center; }
    p { color:#8fa7d9; line-height:1.6; }
    h2 { color:#e6f4ff; font-size:20px; margin-top:0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <div class="logo-icon">❤️</div>
        <div class="logo-text">VitaConnect</div>
      </div>
      ${content}
      <hr class="divider" />
      <div class="footer">
        <p>© ${new Date().getFullYear()} VitaConnect Health Technologies · HIPAA Compliant</p>
        <p>You're receiving this because you have an account at <a href="${APP_URL}" style="color:#0a8ce8;">vitaconnect.health</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Email senders ─────────────────────────────────────────────────────────────

export async function sendAppointmentConfirmation(opts: {
  to: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  appointmentId: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Appointment Confirmed – ${opts.date} at ${opts.time}`,
    html: baseTemplate(`
      <h2>Your appointment is confirmed ✅</h2>
      <p>Hello ${opts.patientName},</p>
      <p>Your <strong style="color:#e6f4ff">${opts.type.toLowerCase()}</strong> consultation with
         <strong style="color:#e6f4ff">${opts.doctorName}</strong> has been confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#4d6fa8;width:40%">Date</td><td style="color:#e6f4ff">${opts.date}</td></tr>
        <tr><td style="padding:8px 0;color:#4d6fa8">Time</td><td style="color:#e6f4ff">${opts.time}</td></tr>
        <tr><td style="padding:8px 0;color:#4d6fa8">Type</td><td style="color:#e6f4ff">${opts.type}</td></tr>
      </table>
      <a href="${APP_URL}/appointments/${opts.appointmentId}" class="btn">View Appointment</a>
      <p style="font-size:13px">You can join the video call directly from the appointment page 5 minutes before the scheduled time.</p>
    `),
  });
}

export async function sendAppointmentReminder(opts: {
  to: string;
  patientName: string;
  doctorName: string;
  minutesBefore: number;
  appointmentId: string;
  roomId: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Reminder: Appointment in ${opts.minutesBefore} minutes`,
    html: baseTemplate(`
      <h2>Your appointment starts soon ⏰</h2>
      <p>Hello ${opts.patientName},</p>
      <p>Your consultation with <strong style="color:#e6f4ff">${opts.doctorName}</strong> begins in
         <strong style="color:#0a8ce8">${opts.minutesBefore} minutes</strong>.</p>
      <a href="${APP_URL}/video?room=${opts.roomId}" class="btn">Join Video Call Now</a>
      <p style="font-size:13px">Please make sure your camera and microphone are working before joining.</p>
    `),
  });
}

export async function sendPasswordReset(opts: {
  to: string;
  name: string;
  resetToken: string;
}) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${opts.resetToken}`;
  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: "Reset your VitaConnect password",
    html: baseTemplate(`
      <h2>Reset your password</h2>
      <p>Hello ${opts.name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one.
         This link expires in <strong style="color:#e6f4ff">1 hour</strong>.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p style="font-size:13px">If you didn't request a password reset, you can safely ignore this email.</p>
    `),
  });
}

export async function sendWelcomeEmail(opts: { to: string; name: string }) {
  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: "Welcome to VitaConnect 🏥",
    html: baseTemplate(`
      <h2>Welcome to VitaConnect, ${opts.name}! 👋</h2>
      <p>We're glad you're here. VitaConnect connects you with verified doctors and keeps your health data in one secure place.</p>
      <p><strong style="color:#e6f4ff">Get started in 3 steps:</strong></p>
      <ol style="color:#8fa7d9;line-height:2">
        <li>Complete your health profile</li>
        <li>Connect your Android Health Connect data</li>
        <li>Book your first consultation</li>
      </ol>
      <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard</a>
    `),
  });
}

export async function sendLabResultsReady(opts: {
  to: string;
  patientName: string;
  testNames: string[];
  labOrderId: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: "Your lab results are ready",
    html: baseTemplate(`
      <h2>Lab results available 🧪</h2>
      <p>Hello ${opts.patientName},</p>
      <p>The results for the following tests are now available:</p>
      <ul style="color:#e6f4ff">
        ${opts.testNames.map((t) => `<li>${t}</li>`).join("")}
      </ul>
      <a href="${APP_URL}/lab-results" class="btn">View Results</a>
      <p style="font-size:13px">Please review your results with your doctor. If you have urgent concerns, contact them directly.</p>
    `),
  });
}
