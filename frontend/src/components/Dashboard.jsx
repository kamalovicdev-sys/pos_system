import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  // Sana filtrlari uchun state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // fetchStats ga sanalarni qabul qilish qobiliyatini qo'shamiz
  const fetchStats = async (start = startDate, end = endDate) => {
    try {
      const response = await axios.get(`${API_URL}/reports/dashboard`, {
        params: {
          start_date: start || null,
          end_date: end || null
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error("Hisobotlarni yuklashda xatolik:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filterni tozalash funksiyasi
  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchStats(null, null); // To'g'ridan-to'g'ri bo'sh qiymat bilan chaqiramiz
  };

  const handlePayCustomer = async (name, currentBalance) => {
    const amountStr = window.prompt(`👤 ${name} qancha qarzini to'layapti?\n\nJami qarzi (shu davrda): ${currentBalance.toLocaleString()} so'm\n\nTo'lov summasini kiriting:`);
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Noto'g'ri summa kiritildi!");
      return;
    }

    try {
      await axios.post(`${API_URL}/debts/customer/pay`, { name: name, amount: amount });
      alert(`✅ ${name} hisobidan ${amount.toLocaleString()} so'm yechildi.`);
      fetchStats();
    } catch (error) {
      alert("Xatolik yuz berdi!");
    }
  };

  const handlePaySupplier = async (name, currentBalance) => {
    const amountStr = window.prompt(`🏢 ${name}ga qancha qarz to'layapsiz?\n\nJami qarzingiz (shu davrda): ${currentBalance.toLocaleString()} so'm\n\nTo'lov summasini kiriting:`);
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Noto'g'ri summa kiritildi!");
      return;
    }

    try {
      await axios.post(`${API_URL}/debts/supplier/pay`, { name: name, amount: amount });
      alert(`✅ ${name} hisobiga ${amount.toLocaleString()} so'm to'landi.`);
      fetchStats();
    } catch (error) {
      alert("Xatolik yuz berdi!");
    }
  };

  if (!stats) return <div className="p-10 text-center text-xl text-gray-500">Analitika yuklanmoqda...</div>;

  return (
    <div className="p-6 w-full max-w-7xl mx-auto pb-24">

      {/* Sarlavha va SANA FILTRI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">📊 Biznes Analitika</h2>

        <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col px-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Dan:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="outline-none text-sm text-gray-800 font-medium bg-transparent"
            />
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="flex flex-col px-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Gacha:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="outline-none text-sm text-gray-800 font-medium bg-transparent"
            />
          </div>

          <button
            onClick={() => fetchStats()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition ml-2"
          >
            Filtrlash
          </button>

          {(startDate || endDate) && (
            <button
              onClick={clearFilter}
              className="text-gray-400 hover:text-red-500 px-3 font-bold transition text-xl"
              title="Filtrni tozalash"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* P&L (PROFIT & LOSS) QISMI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm font-bold uppercase mb-1">Jami Tushum (Aylanma)</p>
          <p className="text-3xl font-black text-blue-700">{stats.pl_analysis.revenue.toLocaleString()} so'm</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
          <p className="text-gray-500 text-sm font-bold uppercase mb-1">Tovarlar Tan Narxi (COGS)</p>
          <p className="text-3xl font-black text-orange-600">- {stats.pl_analysis.cogs.toLocaleString()} so'm</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <p className="text-green-100 text-sm font-bold uppercase mb-1">Sof Foyda (Net Profit)</p>
          <p className="text-4xl font-black">{stats.pl_analysis.net_profit.toLocaleString()} so'm</p>
        </div>
      </div>

      {/* NASIYA DAFTARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Bizga qarzlar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-bold text-gray-800">↗️ Mijozlar Qarzi</h3>
            <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full">
              Jami: {stats.debts_receive.total.toLocaleString()} so'm
            </span>
          </div>
          {stats.debts_receive.list.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Tanlangan davrda qarz olganlar yo'q.</p>
          ) : (
            <ul className="divide-y">
              {stats.debts_receive.list.map((debt, idx) => (
                <li key={idx} className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">👤 {debt.name}</p>
                    <p className={`${debt.balance < 0 ? 'text-green-500' : 'text-red-500'} font-bold`}>
                      {debt.balance.toLocaleString()} so'm
                    </p>
                  </div>
                  <button
                    onClick={() => handlePayCustomer(debt.name, debt.balance)}
                    className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-bold transition">
                    Pul kiritish
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bizning qarzlar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-bold text-gray-800">↙️ Ta'minotchilar Qarzi</h3>
            <span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full">
              Jami: {stats.debts_pay.total.toLocaleString()} so'm
            </span>
          </div>
          {stats.debts_pay.list.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Tanlangan davrda qarz olingan mahsulotlar yo'q.</p>
          ) : (
            <ul className="divide-y">
              {stats.debts_pay.list.map((debt, idx) => (
                <li key={idx} className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">🏢 {debt.name}</p>
                    <p className={`${debt.balance < 0 ? 'text-green-500' : 'text-orange-500'} font-bold`}>
                      {debt.balance.toLocaleString()} so'm
                    </p>
                  </div>
                  <button
                    onClick={() => handlePaySupplier(debt.name, debt.balance)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-bold transition">
                    Pul berish
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* LOW STOCK */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
        <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
          ⚠️ Omborda tugayotgan mahsulotlar
        </h3>
        {stats.low_stock_items.length === 0 ? (
          <p className="text-gray-500">Hamma mahsulotlar yetarli darajada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-red-50 border-b border-red-100">
                <tr>
                  <th className="p-3">Mahsulot nomi</th>
                  <th className="p-3">Qoldiq</th>
                  <th className="p-3">Sotish narxi</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_items.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{item.product_name}</td>
                    <td className="p-3 font-bold text-red-600">{item.quantity} ta</td>
                    <td className="p-3 text-gray-600">{item.selling_price.toLocaleString()} so'm</td>
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