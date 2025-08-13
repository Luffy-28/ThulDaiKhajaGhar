export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  ingredients: string[];
  nutrition: { calories: number; fat: number; protein: number };
  category: string;
  image: string;
}
export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  datetime: string;
  message: string;
  createdAt?: any;
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