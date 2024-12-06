import jwt, { Secret } from "jsonwebtoken";

const generateToken = (
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: string
) => {
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn,
  });
};

const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as any;
};

export const jwtHelper = {
  generateToken,
  verifyToken,
};
