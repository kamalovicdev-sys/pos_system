import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/reports/dashboard`);
        setStats(response.data);
      } catch (error) {
        console.error("Hisobotlarni yuklashda xatolik:", error);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div className="p-10 text-center text-xl text-gray-500">Analitika yuklanmoqda...</div>;

  return (
    <div className="p-6 w-full max-w-7xl mx-auto pb-24">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">📊 Biznes Analitika (P&L va Nasiya)</h2>

      {/* 1. P&L (PROFIT & LOSS) QISMI */}
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

      {/* 2. NASIYA DAFTARI (Qarzlar) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Bizga qarzlar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-bold text-gray-800">↗️ Nasiyaga Berilgan (Bizga qarzlar)</h3>
            <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full">
              Jami: {stats.debts_receive.total.toLocaleString()} so'm
            </span>
          </div>
          {stats.debts_receive.list.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Nasiyaga berilgan mahsulotlar yo'q.</p>
          ) : (
            <ul className="divide-y">
              {stats.debts_receive.list.map((debt, idx) => (
                <li key={idx} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">👤 {debt.customer || "Noma'lum mijoz"}</p>
                    <p className="text-xs text-gray-400">{new Date(debt.date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-red-500">{debt.amount.toLocaleString()} so'm</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bizning qarzlar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-bold text-gray-800">↙️ Nasiyaga Olingan (Ta'minotchidan)</h3>
            <span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full">
              Jami: {stats.debts_pay.total.toLocaleString()} so'm
            </span>
          </div>
          {stats.debts_pay.list.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Qarzga olingan mahsulotlar yo'q.</p>
          ) : (
            <ul className="divide-y">
              {stats.debts_pay.list.map((debt, idx) => (
                <li key={idx} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">🏢 {debt.supplier || "Noma'lum ta'minotchi"}</p>
                    <p className="text-xs text-gray-500">📦 {debt.product}</p>
                  </div>
                  <span className="font-bold text-orange-500">{debt.amount.toLocaleString()} so'm</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 3. LOW STOCK ALERTS */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
        <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
          ⚠️ Omborda tugayotgan mahsulotlar (Alert)
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