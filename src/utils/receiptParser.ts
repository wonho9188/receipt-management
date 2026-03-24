import { type Category, type ReceiptItem } from '../types/receipt';

interface ParsedReceipt {
  storeName: string;
  date: string;
  items: ReceiptItem[];
  totalAmount: number;
  category: Category;
}

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  식료품: ['마트', '슈퍼', '이마트', '홈플러스', '코스트코', '농협', '하나로', 'gs25', 'cu', '세븐일레븐', '편의점', '과일', '채소', '정육'],
  외식: ['식당', '레스토랑', '카페', '커피', '스타벅스', '맥도날드', '버거킹', '치킨', '피자', '배달', '요기요', '배민', '쿠팡이츠', '음식점'],
  교통: ['주유소', '주유', 'sk에너지', 'gs칼텍스', '현대오일뱅크', 's-oil', '택시', '버스', '지하철', '교통', '주차', '톨게이트', '하이패스'],
  쇼핑: ['백화점', '롯데', '신세계', '현대', '아울렛', '의류', '옷', '신발', '가방', '쿠팡', '11번가', '지마켓', '옥션'],
  의료: ['병원', '의원', '약국', '클리닉', '치과', '안과', '피부과', '내과', '외과', '한의원', '약'],
  생활: ['다이소', '세탁', '미용실', '헤어', '네일', '인테리어', '가구', '이사', '청소'],
  문화: ['영화', 'cgv', '메가박스', '롯데시네마', '공연', '전시', '도서', '서점', '음반', '게임'],
  교육: ['학원', '교육', '강의', '수업', '학교', '대학', '도서관', '인강', '클래스'],
  기타: [],
};

function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  let bestCategory: Category = '기타';
  let bestCount = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === '기타') continue;
    const count = keywords.filter(kw => lower.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestCategory = category as Category;
    }
  }

  return bestCategory;
}

function extractDate(text: string): string {
  // 다양한 날짜 형식 매칭
  const patterns = [
    /(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})[일]?/,
    /(\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let year = parseInt(match[1]);
      const month = parseInt(match[2]);
      const day = parseInt(match[3]);

      if (year < 100) year += 2000;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  return new Date().toISOString().split('T')[0];
}

function extractStoreName(text: string): string {
  const lines = text.split('\n').filter(l => l.trim());
  // 보통 첫 몇 줄에 가게명이 있음
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    if (trimmed.length >= 2 && trimmed.length <= 30 && !/^\d/.test(trimmed) && !/합계|총|계|금액|카드/.test(trimmed)) {
      return trimmed;
    }
  }
  return '알 수 없음';
}

function extractItems(text: string): ReceiptItem[] {
  const items: ReceiptItem[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // 품목명 + 수량 + 금액 패턴
    const match = line.match(/(.+?)\s+(\d+)\s+([\d,]+)\s*$/);
    if (match) {
      const name = match[1].trim();
      const quantity = parseInt(match[2]);
      const price = parseInt(match[3].replace(/,/g, ''));
      if (name && !isNaN(quantity) && !isNaN(price) && price > 0) {
        items.push({ name, quantity, price });
      }
      continue;
    }

    // 품목명 + 금액 패턴
    const match2 = line.match(/(.+?)\s+([\d,]+)\s*원?\s*$/);
    if (match2) {
      const name = match2[1].trim();
      const price = parseInt(match2[2].replace(/,/g, ''));
      if (name && !isNaN(price) && price > 0 && !/합계|총|계|부가|카드|거래|승인/.test(name)) {
        items.push({ name, quantity: 1, price });
      }
    }
  }

  return items;
}

function extractTotal(text: string, items: ReceiptItem[]): number {
  // 합계/총액 패턴 추출
  const patterns = [
    /(?:합계|총[액계]?|total)\s*:?\s*([\d,]+)/i,
    /(?:결제|승인)\s*금액\s*:?\s*([\d,]+)/i,
    /([\d,]+)\s*원?\s*$/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) return amount;
    }
  }

  // 아이템 합산으로 대체
  if (items.length > 0) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  return 0;
}

export function parseReceiptText(text: string): ParsedReceipt {
  const storeName = extractStoreName(text);
  const date = extractDate(text);
  const items = extractItems(text);
  const totalAmount = extractTotal(text, items);
  const category = detectCategory(text);

  return { storeName, date, items, totalAmount, category };
}
