import nodemailer from "nodemailer";
import config from "../app/config";

const sendEmail = async (to: string, resetLink: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: config.sender_email,
        pass: config.app_password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Password Reset</title>
      </head>
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
          <p style="font-size: 12px; color: #666;">© 2025 DokanExpress. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"DokanExpress" <${config.sender_email}>`,
      to,
      subject: "🔑 Reset Your Password - DokanExpress",
      html: emailTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent: ", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email: ", error);
    throw new Error("Failed to send email");
  }
};

export default sendEmail;

