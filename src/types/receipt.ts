export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export type Category =
  | '식료품'
  | '외식'
  | '교통'
  | '쇼핑'
  | '의료'
  | '생활'
  | '문화'
  | '교육'
  | '기타';

export const CATEGORIES: Category[] = [
  '식료품',
  '외식',
  '교통',
  '쇼핑',
  '의료',
  '생활',
  '문화',
  '교육',
  '기타',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  식료품: '#22c55e',
  외식: '#f97316',
  교통: '#3b82f6',
  쇼핑: '#a855f7',
  의료: '#ef4444',
  생활: '#14b8a6',
  문화: '#ec4899',
  교육: '#eab308',
  기타: '#6b7280',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  식료품: '🛒',
  외식: '🍽️',
  교통: '🚗',
  쇼핑: '🛍️',
  의료: '🏥',
  생활: '🏠',
  문화: '🎬',
  교육: '📚',
  기타: '📄',
};

export interface Receipt {
  id: string;
  imageUrl: string;
  storeName: string;
  date: string; // ISO date string YYYY-MM-DD
  items: ReceiptItem[];
  totalAmount: number;
  category: Category;
  memo: string;
  createdAt: string;
  ocrText: string;
}
