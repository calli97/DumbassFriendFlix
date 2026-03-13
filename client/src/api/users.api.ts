import { apiClient } from './client';
import { User } from '../types/auth.types';

export const usersApi = {
  findAll: (): Promise<User[]> =>
    apiClient.get<User[]>('/users'),

  findOne: (id: string): Promise<User> =>
    apiClient.get<User>(`/users/${id}`),

  remove: (id: string): Promise<void> =>
    apiClient.delete<void>(`/users/${id}`),
};
