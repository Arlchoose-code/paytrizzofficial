export type UserRole = "admin" | "talent";

export interface User {
  id: number;
  role: UserRole;
  name: string;
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  password_changed_at?: string | null;
  last_login_at?: string | null;
  mail_policy_accepted_at?: string | null;
  created_at: string;
}
