export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified?: boolean;
  status?: "active" | "suspended" | "pending";
  createdAt: number | string;
  lastLoginAt?: number | string;
}
