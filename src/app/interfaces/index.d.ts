import { IUser } from "../modules/User/user.interface";

declare global {
  namespace Express {
    interface Request {
      // Populated by the auth() middleware on protected routes. Routes that
      // do not use auth() will have req.user undefined at runtime, so any
      // anonymous-allowed endpoint should access this via optional chaining.
      user: IUser;
    }
  }
}
