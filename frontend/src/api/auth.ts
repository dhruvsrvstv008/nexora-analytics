import api from './client';
import type { AuthTokens, User } from '@/types';

export async function login(email: string, password: string): Promise<AuthTokens> {
  const res = await api.post<AuthTokens>('/auth/login', { email, password });
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await api.get<User>('/auth/me');
  return res.data;
}
