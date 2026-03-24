import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReceipts } from '../context/ReceiptContext';
import { CATEGORIES, type Category } from '../types/receipt';
import { formatCurrency } from '../utils/format';
import CategoryBadge from '../components/CategoryBadge';

export default function ReceiptsPage() {
  const { receipts, deleteReceipt } = useReceipts();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const filtered = receipts
    .filter(r => {
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.storeName.toLowerCase().includes(q) ||
          r.memo.toLowerCase().includes(q) ||
          r.items.some(i => i.name.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return b.totalAmount - a.totalAmount;
    });

  const totalFiltered = filtered.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">영수증 목록</h2>
        <Link
          to="/upload"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 새 영수증
        </Link>
      </div>

      {/* 필터 / 검색 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 가게명, 품목 검색..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 카테고리</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">날짜순</option>
            <option value="amount">금액순</option>
          </select>
        </div>
      </div>

      {/* 요약 */}
      <div className="mb-4 text-sm text-gray-500">
        {filtered.length}건 · 합계 <span className="font-bold text-gray-900">{formatCurrency(totalFiltered)}</span>
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🧾</div>
          <p className="text-lg">등록된 영수증이 없습니다</p>
          <Link to="/upload" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            첫 영수증을 등록해보세요
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onDelete={() => {
                if (confirm('정말 삭제하시겠습니까?')) deleteReceipt(receipt.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReceiptCard({
  receipt,
  onDelete,
}: {
  receipt: import('../types/receipt').Receipt;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {receipt.imageUrl ? (
          <img
            src={receipt.imageUrl}
            alt=""
            className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl shrink-0">
            🧾
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{receipt.storeName}</h3>
            <CategoryBadge category={receipt.category} size="sm" />
          </div>
          <p className="text-sm text-gray-500">{receipt.date}</p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-bold text-gray-900">{formatCurrency(receipt.totalAmount)}</p>
          <span className="text-xs text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          {receipt.items.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-500 mb-1.5">구매 항목</h4>
              <div className="space-y-1">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name}
                      {item.quantity > 1 && (
                        <span className="text-gray-400 ml-1">×{item.quantity}</span>
                      )}
                    </span>
                    <span className="text-gray-600">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {receipt.memo && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-500 mb-1">메모</h4>
              <p className="text-sm text-gray-700">{receipt.memo}</p>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
