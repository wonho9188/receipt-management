import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { useReceipts } from '../context/ReceiptContext';
import { formatCurrency } from '../utils/format';
import CategoryBadge from '../components/CategoryBadge';
import { type Receipt, CATEGORY_COLORS } from '../types/receipt';

export default function CalendarPage() {
  const { receipts } = useReceipts();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const receiptsByDate = useMemo(() => {
    const map: Record<string, Receipt[]> = {};
    receipts.forEach(r => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return map;
  }, [receipts]);

  const monthTotal = useMemo(() => {
    return receipts
      .filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, r) => sum + r.totalAmount, 0);
  }, [receipts, year, month]);

  const selectedReceipts = selectedDate ? (receiptsByDate[selectedDate] || []) : [];

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">달력</h2>
        <p className="text-sm text-gray-500">
          이번 달 지출: <span className="font-bold text-gray-900">{formatCurrency(monthTotal)}</span>
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ◀
          </button>
          <h3 className="text-lg font-bold text-gray-900">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </h3>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ▶
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={`py-2 text-center text-xs font-medium ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayReceipts = receiptsByDate[dateStr] || [];
            const dayTotal = dayReceipts.reduce((s, r) => s + r.totalAmount, 0);
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const isSelected = dateStr === selectedDate;
            const dayOfWeek = day.getDay();

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-gray-100 text-left transition-colors ${
                  !inMonth ? 'bg-gray-50/50' : ''
                } ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full ${
                      today ? 'bg-blue-600 text-white' : ''
                    } ${!inMonth ? 'text-gray-300' : dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-700'}`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                {dayReceipts.length > 0 && inMonth && (
                  <div className="mt-1 space-y-0.5">
                    {dayReceipts.slice(0, 2).map(r => (
                      <div
                        key={r.id}
                        className="text-[10px] leading-tight truncate px-1 py-0.5 rounded"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[r.category]}15`,
                          color: CATEGORY_COLORS[r.category],
                        }}
                      >
                        {r.storeName}
                      </div>
                    ))}
                    {dayReceipts.length > 2 && (
                      <div className="text-[10px] text-gray-400 px-1">
                        +{dayReceipts.length - 2}건
                      </div>
                    )}
                    <div className="text-[11px] font-semibold text-gray-700 px-1">
                      {formatCurrency(dayTotal)}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜 영수증 상세 */}
      {selectedDate && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {format(new Date(selectedDate + 'T00:00:00'), 'M월 d일 (EEEE)', { locale: ko })}
          </h3>
          {selectedReceipts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">이 날짜에 영수증이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {selectedReceipts.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{r.storeName}</span>
                      <CategoryBadge category={r.category} size="sm" />
                    </div>
                    {r.items.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {r.items.map(i => i.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-gray-900">{formatCurrency(r.totalAmount)}</span>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">
                  합계: {formatCurrency(selectedReceipts.reduce((s, r) => s + r.totalAmount, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
