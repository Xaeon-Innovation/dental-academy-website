export type AdminRole = "admin" | "editor" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  role?: AdminRole;
}

export interface AdminSession {
  user: AdminUser | null;
  isAuthenticated: boolean;
}
