import { ApiResponse } from "@/types/api";
import { AuthResponseData, LoginPayload } from "@/types/auth";
import { User } from "@/types/user";

export async function loginApi(payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getMeApi(): Promise<ApiResponse<User>> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
  });
  return res.json();
}

export async function logoutApi(): Promise<ApiResponse<null>> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
  });
  return res.json();
}

export async function refreshApi(): Promise<ApiResponse<AuthResponseData>> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
  });
  return res.json();
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  return res.json();
}

export async function forgotPasswordApi(email: string): Promise<ApiResponse<null>> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<ApiResponse<null>> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  return res.json();
}

export async function acceptMailPolicyApi(): Promise<ApiResponse<null>> {
  const res = await fetch("/api/auth/accept-mail-policy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accepted: true }),
  });
  return res.json();
}
