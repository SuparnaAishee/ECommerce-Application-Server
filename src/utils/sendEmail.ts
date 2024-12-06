import nodemailer from "nodemailer";
import config from "../app/config";

const sendEmail = async (to: string, html: string) => {
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

  await transporter.sendMail({
    from: config.sender_email,
    to,
    subject: "Reset Password",
    text: "Reset your password within 5 minutes",
    html,
  });
};

export default sendEmail;
