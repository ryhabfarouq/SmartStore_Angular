export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type UserRole = 'customer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'pending' | 'restricted' | 'deleted';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  address: Address;
  createdAt: string;
  emailVerified: boolean;
  wallet: number;
  sellerId?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}
