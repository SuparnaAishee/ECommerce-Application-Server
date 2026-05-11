import nodemailer from "nodemailer";
import { Resend } from "resend";
import config from "../app/config";

const buildTemplate = (resetLink: string) => `
  <!DOCTYPE html>
  <html>
  <head><title>Password Reset</title></head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
    <div style="max-width: 600px; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1); margin: auto;">
      <img src="https://res.cloudinary.com/dwelabpll/image/upload/v1734166029/Screenshot_2024-12-14_144559-removebg-preview_hylzbb.png" alt="DokanExpress Logo" style="width: 150px; margin-bottom: 20px;" />
      <h2 style="color: #333;">Password Reset Request</h2>
      <p style="color: #555; font-size: 16px;">We received a request to reset your password. Click the button below to set a new password.</p>
      <a href="${resetLink}"
         style="display: inline-block; background-color: #ff6b00; color: #ffffff; text-decoration: none;
                padding: 12px 20px; border-radius: 5px; margin-top: 15px; font-weight: bold;">
        Reset Your Password
      </a>
      <p style="color: #888; font-size: 14px;">If you did not request this, please ignore this email.</p>
      <hr style="border: 0.5px solid #ddd; margin-top: 20px;" />
      <p style="font-size: 12px; color: #666;">© ${new Date().getFullYear()} DokanExpress. All rights reserved.</p>
    </div>
  </body>
  </html>
`;

// Resend (preferred) — production-grade, no SMTP gymnastics.
async function sendViaResend(to: string, resetLink: string) {
  if (!config.resend_api_key) throw new Error("Resend not configured");
  const resend = new Resend(config.resend_api_key);
  const { data, error } = await resend.emails.send({
    from: `DokanExpress <${config.resend_from_email}>`,
    to,
    subject: "🔑 Reset Your Password - DokanExpress",
    html: buildTemplate(resetLink),
  });
  if (error) throw new Error(error.message);
  return data;
}

// Gmail SMTP fallback for local dev / when Resend isn't set up.
async function sendViaGmail(to: string, resetLink: string) {
  if (!config.sender_email || !config.app_password) {
    throw new Error("Gmail SMTP not configured");
  }
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: config.sender_email, pass: config.app_password },
    tls: { rejectUnauthorized: false },
  });
  return transporter.sendMail({
    from: `"DokanExpress" <${config.sender_email}>`,
    to,
    subject: "🔑 Reset Your Password - DokanExpress",
    html: buildTemplate(resetLink),
  });
}

const sendEmail = async (to: string, body: string | { resetLink: string }) => {
  // Backward-compat: callers pass either a raw HTML body or { resetLink }.
  const resetLink =
    typeof body === "string"
      ? (body.match(/href=([^>\s]+)/)?.[1] ?? "").replace(/^['"]|['"]$/g, "")
      : body.resetLink;

  // Prefer Resend if configured; otherwise fall back to Gmail SMTP.
  try {
    if (config.resend_api_key) {
      const result = await sendViaResend(to, resetLink);
      console.log("✅ Email sent via Resend:", result?.id);
      return result;
    }
    const info = await sendViaGmail(to, resetLink);
    console.log("✅ Email sent via Gmail SMTP:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

export default sendEmail;
