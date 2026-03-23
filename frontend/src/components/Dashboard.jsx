import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_sales_count: 0,
    low_stock_items: []
  });

  useEffect(() => {
    // Sahifa ochilganda backenddan statistikalarni tortib olamiz
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

  return (
    <div className="p-6 w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Do'kon Statistikasi</h2>

      {/* Asosiy ko'rsatkichlar (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-semibold uppercase">Jami Tushum</p>
          <p className="text-4xl font-bold text-gray-800 mt-2">
            {stats.total_revenue.toLocaleString()} so'm
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm font-semibold uppercase">Xaridlar Soni (Cheklar)</p>
          <p className="text-4xl font-bold text-gray-800 mt-2">
            {stats.total_sales_count} ta
          </p>
        </div>
      </div>

      {/* Omborda tugayotgan mahsulotlar jadvali */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
          ⚠️ Omborda tugayotgan mahsulotlar (10 tadan kam)
        </h3>

        {stats.low_stock_items.length === 0 ? (
          <p className="text-gray-500">Xavotirga o'rin yo'q, hamma mahsulotlar yetarli darajada.</p>
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