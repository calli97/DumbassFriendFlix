import { apiClient } from './client';
import { LoginPayload, LoginResponse, RegisterPayload, User } from '../types/auth.types';

export const authApi = {
  register: (payload: RegisterPayload): Promise<User> =>
    apiClient.post<User>('/auth/register', payload),

  login: (payload: LoginPayload): Promise<LoginResponse> =>
    apiClient.post<LoginResponse>('/auth/login', payload),

  me: (): Promise<User> =>
    apiClient.get<User>('/auth/me'),
};
