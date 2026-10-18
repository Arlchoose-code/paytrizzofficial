import { User } from "./user";

export interface AuthResponseData {
  user: User;
  access_token: string;
  csrf_token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  turnstile_token?: string;
}
