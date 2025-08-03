export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image?: string;
}

export interface orders {
  id: string;
  userId?: string;
  name: string;
  phoneNumber: string;
  items: MenuItem[];
  total: number;
  status: string;
  createdAt: Date;
}

export interface User {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  points: number;
}