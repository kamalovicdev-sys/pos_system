import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { t } from '../translations';

const API_URL = 'http://127.0.0.1:8000';

const Dashboard = ({ lang }) => {
  const [stats, setStats] = useState(null);

  // Kalendar oynasi uchun statelar
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  // Tanlangan sanalar (Date obyektlari)
  const [selStart, setSelStart] = useState(null);
  const [selEnd, setSelEnd] = useState(null);

  // Kalendar ko'rsatayotgan oy/yil (Navigation uchun)
  const [viewDate, setViewDate] = useState(new Date());

  // Sana formati yordamchisi (YYYY-MM-DD backend uchun)
  const formatDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const fetchStats = async (start = selStart, end = selEnd) => {
    try {
      const response = await axios.get(`${API_URL}/reports/dashboard`, {
        params: {
          start_date: start ? formatDate(start) : null,
          end_date: end ? formatDate(end) : null
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error("Analytics loading error:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tashqariga bosganda kalendarni yopish
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearFilter = () => {
    setSelStart(null);
    setSelEnd(null);
    fetchStats(null, null);
  };

  const applyFilter = () => {
    fetchStats();
    setIsCalendarOpen(false);
  };

  // ===================== KALENDAR LOGIKASI =====================
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Oyda necha kun borligi va birinchi kun qaysi haftaga to'g'ri kelishi
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Dushanba=0 qilish uchun

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const onDayClick = (day) => {
    const clickedDate = new Date(year, month, day);

    // Agar hech narsa tanlanmagan bo'lsa yoki allaqachon ikkalasi tanlangan bo'lsa -> Yangidan boshlash
    if (!selStart || (selStart && selEnd)) {
      setSelStart(clickedDate);
      setSelEnd(null);
    }
    // Agar Start tanlangan va End tanlanmagan bo'lsa
    else {
      if (clickedDate < selStart) {
        setSelEnd(selStart);
        setSelStart(clickedDate);
      } else {
        setSelEnd(clickedDate);
      }
    }
  };

  const isSelected = (day) => {
    const date = new Date(year, month, day).getTime();
    const startObj = selStart ? new Date(selStart.getFullYear(), selStart.getMonth(), selStart.getDate()).getTime() : null;
    const endObj = selEnd ? new Date(selEnd.getFullYear(), selEnd.getMonth(), selEnd.getDate()).getTime() : null;

    return date === startObj || date === endObj;
  };

  const isBetween = (day) => {
    if (!selStart || !selEnd) return false;
    const date = new Date(year, month, day).getTime();
    const startObj = new Date(selStart.getFullYear(), selStart.getMonth(), selStart.getDate()).getTime();
    const endObj = new Date(selEnd.getFullYear(), selEnd.getMonth(), selEnd.getDate()).getTime();
    return date > startObj && date < endObj;
  };
  // =============================================================

  const handlePayCustomer = async (name, currentBalance) => {
    const amountStr = window.prompt(`${name}\n${t[lang].promptCust}`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) { alert(t[lang].invalidAmount); return; }
    try {
      await axios.post(`${API_URL}/debts/customer/pay`, { name: name, amount: amount });
      alert(t[lang].paymentSuccess); fetchStats();
    } catch (error) { alert(t[lang].transFailed); }
  };

  const handlePaySupplier = async (name, currentBalance) => {
    const amountStr = window.prompt(`${name}\n${t[lang].promptSupp}`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) { alert(t[lang].invalidAmount); return; }
    try {
      await axios.post(`${API_URL}/debts/supplier/pay`, { name: name, amount: amount });
      alert(t[lang].paymentSuccess); fetchStats();
    } catch (error) { alert(t[lang].transFailed); }
  };

  if (!stats) return <div className="p-12 text-center text-sm font-semibold text-slate-500 uppercase tracking-wide">{t[lang].loading}</div>;

  return (
    <div className="w-full pb-12 relative">

      {/* HEADER & CALENDAR FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">{t[lang].finOverview}</h2>
          <p className="text-sm text-slate-500">{t[lang].plManage}</p>
        </div>

        {/* ZAMONAVIY KALENDAR POP-UP TIZIMI */}
        <div className="relative" ref={calendarRef}>
          <div className="flex items-center gap-3">

            {/* Tanlangan Sana Yozuvi (Badge) */}
            {selStart && (
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-sm flex items-center gap-3 shadow-sm animate-fade-in">
                <span className="text-[10px] font-bold text-blue-800 tracking-widest uppercase">
                  {formatDate(selStart)}
                  {selEnd && selEnd.getTime() !== selStart.getTime() && <><span className="text-blue-400 mx-1">—</span> {formatDate(selEnd)}</>}
                </span>
                <button
                  onClick={clearFilter}
                  className="text-blue-400 hover:text-blue-800 transition-colors text-xs font-black"
                >✕</button>
              </div>
            )}

            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-sm font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              {t[lang].calendar}
            </button>
          </div>

          {/* KALENDAR OYNASI */}
          {isCalendarOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 shadow-2xl rounded-sm z-50 p-5 animate-fade-in">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4 border-b border-slate-100 pb-2">
                {t[lang].selectDateRange}
              </h4>

              <div className="flex flex-col gap-2">
                {/* Kalendar Headeri (Oy va Yilni o'zgartirish) */}
                <div className="flex justify-between items-center mb-4 px-2">
                  <button onClick={prevMonth} className="text-slate-400 hover:text-slate-800 text-lg font-bold">‹</button>
                  <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {t[lang].months[month]} {year}
                  </span>
                  <button onClick={nextMonth} className="text-slate-400 hover:text-slate-800 text-lg font-bold">›</button>
                </div>

                {/* Hafta kunlari */}
                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                  {t[lang].weekDays.map(day => (
                    <div key={day} className="text-[10px] font-bold text-slate-400 uppercase">{day}</div>
                  ))}
                </div>

                {/* Kunlar to'ri (Grid) */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Oy boshidagi bo'sh kataklar */}
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2"></div>
                  ))}

                  {/* Haqiqiy kunlar */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const selected = isSelected(day);
                    const between = isBetween(day);

                    return (
                      <button
                        key={day}
                        onClick={() => onDayClick(day)}
                        className={`
                          p-2 text-xs font-semibold rounded-sm transition-all
                          ${selected ? 'bg-blue-600 text-white shadow-md' : ''}
                          ${between ? 'bg-blue-50 text-blue-800' : ''}
                          ${!selected && !between ? 'bg-white text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200' : ''}
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={applyFilter}
                  disabled={!selStart}
                  className={`w-full mt-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors shadow-sm ${selStart ? 'bg-slate-800 hover:bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  {t[lang].applyFilter}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* P&L METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-sm shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t[lang].grossRev}</p>
          <p className="text-2xl font-bold text-slate-900">{stats.pl_analysis.revenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-5 rounded-sm shadow-sm border border-slate-200 border-l-4 border-l-slate-400">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t[lang].cogs}</p>
          <p className="text-2xl font-bold text-slate-700">{stats.pl_analysis.cogs.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-sm shadow-sm border border-slate-900">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{t[lang].netProfit}</p>
          <p className="text-2xl font-bold text-white">{stats.pl_analysis.net_profit.toLocaleString()}</p>
        </div>
      </div>

      {/* ACCOUNTS RECEIVABLE & PAYABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* AR */}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t[lang].ar}</h3>
            <span className="bg-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
              {t[lang].total}: {stats.debts_receive.total.toLocaleString()}
            </span>
          </div>

          <div className="p-0 flex-grow max-h-80 overflow-y-auto">
            {stats.debts_receive.list.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 text-center py-8">{t[lang].noOpenItems}</p>
            ) : (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                  {stats.debts_receive.list.map((debt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-800">{debt.name}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-700">
                        {debt.balance.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 w-32 text-right">
                        <button
                          onClick={() => handlePayCustomer(debt.name, debt.balance)}
                          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-[10px] uppercase tracking-wide px-3 py-1.5 font-bold rounded-sm transition-colors">
                          {t[lang].clearLine}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* AP */}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t[lang].ap}</h3>
            <span className="bg-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
              {t[lang].total}: {stats.debts_pay.total.toLocaleString()}
            </span>
          </div>

          <div className="p-0 flex-grow max-h-80 overflow-y-auto">
            {stats.debts_pay.list.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 text-center py-8">{t[lang].noOpenItems}</p>
            ) : (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                  {stats.debts_pay.list.map((debt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-800">{debt.name}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-700">
                        {debt.balance.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 w-32 text-right">
                        <button
                          onClick={() => handlePaySupplier(debt.name, debt.balance)}
                          className="bg-slate-800 text-white hover:bg-slate-900 text-[10px] uppercase tracking-wide px-3 py-1.5 font-bold rounded-sm transition-colors">
                          {t[lang].postPay}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* LOW STOCK ALERT */}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t[lang].excMon}</h3>
        </div>

        {stats.low_stock_items.length === 0 ? (
          <p className="text-xs font-medium text-slate-400 text-center py-6">{t[lang].allStockNom}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t[lang].matDesc}</th>
                  <th className="px-5 py-3 font-semibold w-32 text-right">{t[lang].curStock}</th>
                  <th className="px-5 py-3 font-semibold w-40 text-right">{t[lang].targetPrice}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.low_stock_items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{item.product_name}</td>
                    <td className="px-5 py-3 font-bold text-slate-900 text-right">{item.quantity}</td>
                    <td className="px-5 py-3 text-slate-600 text-right">{item.selling_price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;