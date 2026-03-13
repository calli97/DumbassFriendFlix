export type RoleName = 'USER' | 'ADMIN';

export interface Role {
  id: number;
  name: RoleName;
}

export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
