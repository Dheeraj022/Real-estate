import Cookies from 'js-cookie';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent';
  referralCode: string;
  level: number;
}

export const setToken = (token: string) => {
  Cookies.set('token', token, { expires: 7 }); // 7 days
};

export const getToken = (): string | undefined => {
  return Cookies.get('token');
};

export const removeToken = () => {
  Cookies.remove('token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const isAgent = (user: User | null): boolean => {
  return user?.role === 'agent';
};

