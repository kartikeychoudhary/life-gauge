export interface User {
  id: number;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  force_password_change?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
