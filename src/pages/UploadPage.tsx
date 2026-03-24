import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import { v4 as uuidv4 } from 'uuid';
import { useReceipts } from '../context/ReceiptContext';
import { parseReceiptText } from '../utils/receiptParser';
import { CATEGORIES, type Category, type ReceiptItem } from '../types/receipt';
import { formatCurrency } from '../utils/format';
import CategoryBadge from '../components/CategoryBadge';

export default function UploadPage() {
  const navigate = useNavigate();
  const { addReceipt } = useReceipts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');

  // 편집 가능한 필드
  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<Category>('기타');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [memo, setMemo] = useState('');
  const [step, setStep] = useState<'upload' | 'edit'>('upload');

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setIsProcessing(true);
      setProgress(0);

      try {
        const worker = await createWorker('kor+eng', undefined, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });

        const { data: { text } } = await worker.recognize(dataUrl);
        await worker.terminate();

        setOcrText(text);
        const parsed = parseReceiptText(text);
        setStoreName(parsed.storeName);
        setDate(parsed.date);
        setCategory(parsed.category);
        setItems(parsed.items.length > 0 ? parsed.items : [{ name: '', quantity: 1, price: 0 }]);
        setTotalAmount(parsed.totalAmount);
        setStep('edit');
      } catch {
        alert('OCR 처리 중 오류가 발생했습니다. 직접 입력해주세요.');
        setDate(new Date().toISOString().split('T')[0]);
        setItems([{ name: '', quantity: 1, price: 0 }]);
        setStep('edit');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleManualEntry = () => {
    setImagePreview(null);
    setDate(new Date().toISOString().split('T')[0]);
    setItems([{ name: '', quantity: 1, price: 0 }]);
    setStep('edit');
  };

  const addItem = () => {
    setItems(prev => [...prev, { name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const recalcTotal = () => {
    setTotalAmount(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  };

  const handleSave = () => {
    if (!date) {
      alert('날짜를 입력해주세요.');
      return;
    }

    const receipt = {
      id: uuidv4(),
      imageUrl: imagePreview || '',
      storeName: storeName || '알 수 없음',
      date,
      items: items.filter(i => i.name.trim()),
      totalAmount,
      category,
      memo,
      createdAt: new Date().toISOString(),
      ocrText,
    };

    addReceipt(receipt);
    navigate('/receipts');
  };

  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">영수증 등록</h2>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
        >
          {isProcessing ? (
            <div className="space-y-4">
              <div className="text-4xl animate-pulse">🔍</div>
              <p className="text-lg font-medium text-gray-700">영수증 분석 중...</p>
              <div className="w-64 mx-auto bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{progress}%</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-5xl">📷</div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  영수증 사진을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  JPG, PNG 파일을 지원합니다
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleManualEntry}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            ✏️ 사진 없이 직접 입력하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">영수증 내용 확인</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 이미지 & OCR 텍스트 */}
        <div className="space-y-4">
          {imagePreview && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">영수증 이미지</h3>
              <img
                src={imagePreview}
                alt="영수증"
                className="w-full rounded-lg max-h-96 object-contain bg-gray-100"
              />
            </div>
          )}
          {ocrText && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">OCR 인식 텍스트</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                {ocrText}
              </pre>
            </div>
          )}
        </div>

        {/* 오른쪽: 편집 폼 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* 가게명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가게명</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="가게 이름"
            />
          </div>

          {/* 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`transition-transform ${category === cat ? 'scale-110 ring-2 ring-offset-1 ring-blue-500 rounded-full' : 'opacity-60 hover:opacity-100'}`}
                >
                  <CategoryBadge category={cat} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* 항목 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">항목</label>
              <button
                onClick={addItem}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                + 항목 추가
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    placeholder="품목명"
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-center"
                    min="1"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(idx, 'price', parseInt(e.target.value) || 0)}
                    placeholder="금액"
                    className="w-28 px-2 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-right"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-red-400 hover:text-red-600 text-lg"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 총액 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">총 금액</label>
              <button
                onClick={recalcTotal}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                항목에서 자동 계산
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right text-lg font-bold pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
            </div>
            <p className="text-sm text-gray-500 mt-1 text-right">
              {formatCurrency(totalAmount)}
            </p>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              placeholder="메모 (선택사항)"
            />
          </div>

          {/* 저장 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setStep('upload');
                setImagePreview(null);
                setOcrText('');
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              다시 업로드
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
