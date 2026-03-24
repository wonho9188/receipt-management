import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useReceipts } from '../context/ReceiptContext';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, type Category } from '../types/receipt';
import { formatCurrency } from '../utils/format';
import CategoryBadge from '../components/CategoryBadge';

export default function DashboardPage() {
  const { receipts } = useReceipts();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [selYear, selMonth] = selectedMonth.split('-').map(Number);

  const monthReceipts = useMemo(
    () =>
      receipts.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === selYear && d.getMonth() + 1 === selMonth;
      }),
    [receipts, selYear, selMonth]
  );

  const totalAmount = monthReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

  // 카테고리별 합계
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    monthReceipts.forEach(r => {
      map[r.category] = (map[r.category] || 0) + r.totalAmount;
    });
    return CATEGORIES.map(cat => ({
      category: cat,
      amount: map[cat] || 0,
      percentage: totalAmount > 0 ? ((map[cat] || 0) / totalAmount) * 100 : 0,
    }))
      .filter(s => s.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [monthReceipts, totalAmount]);

  // 최근 6개월 추이
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(selYear, selMonth - 1, 1), i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const total = receipts
        .filter(r => {
          const rd = new Date(r.date);
          return rd.getFullYear() === y && rd.getMonth() === m;
        })
        .reduce((sum, r) => sum + r.totalAmount, 0);
      months.push({
        label: format(d, 'M월', { locale: ko }),
        amount: total,
        year: y,
        month: m,
      });
    }
    return months;
  }, [receipts, selYear, selMonth]);

  const maxTrend = Math.max(...monthlyTrend.map(m => m.amount), 1);

  // 최근 영수증 5개
  const recentReceipts = useMemo(
    () =>
      [...receipts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [receipts]
  );

  // 월 선택 옵션
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = subMonths(now, i);
      options.push({
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: format(d, 'yyyy년 M월', { locale: ko }),
      });
    }
    return options;
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          {monthOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          title="이번 달 총 지출"
          value={formatCurrency(totalAmount)}
          icon="💰"
          color="blue"
        />
        <SummaryCard
          title="영수증 수"
          value={`${monthReceipts.length}건`}
          icon="🧾"
          color="green"
        />
        <SummaryCard
          title="일 평균 지출"
          value={formatCurrency(
            monthReceipts.length > 0
              ? Math.round(totalAmount / new Date(selYear, selMonth, 0).getDate())
              : 0
          )}
          icon="📊"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 지출 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-4">카테고리별 지출</h3>
          {categoryStats.length === 0 ? (
            <p className="text-center text-gray-400 py-8">데이터가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map(stat => (
                <div key={stat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[stat.category as Category]}</span>
                      <span className="font-medium text-gray-700">{stat.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{stat.percentage.toFixed(1)}%</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(stat.amount)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${stat.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[stat.category as Category],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 월별 추이 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-4">월별 지출 추이</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {monthlyTrend.map((m, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500 font-medium">
                  {m.amount > 0 ? formatCurrency(m.amount) : ''}
                </span>
                <div className="w-full flex justify-center">
                  <div
                    className="w-8 sm:w-12 rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.max((m.amount / maxTrend) * 140, m.amount > 0 ? 8 : 2)}px`,
                      backgroundColor: idx === monthlyTrend.length - 1 ? '#3b82f6' : '#93c5fd',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 font-medium">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 영수증 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">최근 등록된 영수증</h3>
            <Link to="/receipts" className="text-sm text-blue-600 hover:underline">
              전체 보기 →
            </Link>
          </div>
          {recentReceipts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">아직 등록된 영수증이 없습니다</p>
              <Link
                to="/upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                첫 영수증 등록하기
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentReceipts.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{r.storeName}</span>
                      <CategoryBadge category={r.category} size="sm" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{r.date}</p>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0">{formatCurrency(r.totalAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
  };

  return (
    <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-600">{title}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
