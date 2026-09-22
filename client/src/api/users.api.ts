import { apiClient } from './client';
import { User, RoleName } from '../types/auth.types';

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  roles?: RoleName[];
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
  roles?: RoleName[];
}

export type UserOption = Pick<User, 'id' | 'username'>;

export const usersApi = {
  findOptions: (): Promise<UserOption[]> =>
    apiClient.get<UserOption[]>('/users/options'),

  findAll: (): Promise<User[]> =>
    apiClient.get<User[]>('/users'),

  findOne: (id: number): Promise<User> =>
    apiClient.get<User>(`/users/${id}`),

  create: (payload: CreateUserPayload): Promise<User> =>
    apiClient.post<User>('/users', payload),

  update: (id: number, payload: UpdateUserPayload): Promise<User> =>
    apiClient.patch<User>(`/users/${id}`, payload),

  remove: (id: number): Promise<void> =>
    apiClient.delete<void>(`/users/${id}`),
};
