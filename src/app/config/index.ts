import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT,
  bcrypt_salt_round: process.env.BCRYPT_SALT_ROUND,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  reset_password_secret: process.env.RESET_PASSWORD_SECRET,
  reset_password_expires_in: process.env.RESET_PASSWORD_EXPIRES_IN,
  client_base_url: process.env.CLIENT_BASE_URL,
  server_base_url: process.env.SERVER_BASE_URL,
  // sender_email: process.env.SENDER_EMAIL,
  // app_password: process.env.APP_PASSWORD,
  payment_url: process.env.PAYMENT_URL,
  payment_verify_url: process.env.PAYMENT_VERIFY_URL,
  store_id: process.env.STORE_ID,
  signature_key: process.env.SIGNATURE_KEY,
};
