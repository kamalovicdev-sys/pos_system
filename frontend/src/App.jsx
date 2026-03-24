import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Receipt from './components/Receipt';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';

const API_URL = 'http://127.0.0.1:8000';

function App() {
  const [activeTab, setActiveTab] = useState('pos');

  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [total, setTotal] = useState(0);
  const [receiptData, setReceiptData] = useState(null);

  // Nasiya savdo uchun state'lar
  const [isCredit, setIsCredit] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'pos') {
      barcodeInputRef.current?.focus();
    }
  }, [cart, activeTab]);

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  useEffect(() => {
    if (receiptData) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [receiptData]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const response = await axios.get(`${API_URL}/products/scan/${barcode}`);
      const product = response.data;

      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.product_id === product.id);

        if (existingItem) {
          return prevCart.map(item =>
            item.product_id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          // Haqiqiy narx bazadan keladi
          return [...prevCart, {
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
          }];
        }
      });

      setBarcode('');
    } catch (error) {
      alert("Mahsulot topilmadi!");
      setBarcode('');
    }
  };

  const handleCheckout = async (paymentType) => {
    if (cart.length === 0) {
      alert("Savat bo'sh! Iltimos, oldin mahsulot skanerlang.");
      return;
    }

    // Nasiya tanlangan bo'lsa, ism kiritilishi shart
    if (isCredit && !customerName.trim()) {
      alert("Iltimos, qarzga olayotgan mijoz ismini kiriting!");
      return;
    }

    const saleData = {
      payment_type: paymentType,
      is_credit: isCredit,
      customer_name: customerName,
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await axios.post(`${API_URL}/sales/`, saleData);
      setReceiptData(response.data);

      // Kassani tozalash va Nasiya sozlamalarini o'chirish
      setCart([]);
      setBarcode('');
      setIsCredit(false);
      setCustomerName('');

      if (activeTab === 'pos') barcodeInputRef.current?.focus();

    } catch (error) {
      console.error("Savdoda xatolik:", error);
      alert("To'lovni amalga oshirishda xatolik yuz berdi. Server ishlab turganini tekshiring.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20 relative">

      {/* 1. KASSA OYNASI */}
      {activeTab === 'pos' && (
        <div className="p-4 flex gap-4 print:hidden">

          <div className="w-2/3 bg-white rounded-lg shadow-md p-6 flex flex-col" style={{ minHeight: 'calc(100vh - 7rem)' }}>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Savdo oynasi</h2>

            <form onSubmit={handleScan} className="mb-6">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Shtrix kodni skanerlang..."
                className="w-full p-4 border-2 border-blue-500 rounded-lg text-lg focus:outline-none focus:ring-4 focus:ring-blue-200"
              />
            </form>

            <div className="flex-grow overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3">Mahsulot</th>
                    <th className="p-3">Soni</th>
                    <th className="p-3">Narxi</th>
                    <th className="p-3">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-lg font-bold text-gray-800">{item.name}</td>
                      <td className="p-3 text-lg font-bold">{item.quantity}</td>
                      <td className="p-3 text-lg">{item.price.toLocaleString()} so'm</td>
                      <td className="p-3 text-lg font-bold text-blue-600">
                        {(item.price * item.quantity).toLocaleString()} so'm
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-10 text-center text-gray-400">
                        Savat bo'sh. Mahsulot skanerlang.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-1/3 bg-white rounded-lg shadow-md p-6 flex flex-col justify-between" style={{ minHeight: 'calc(100vh - 7rem)' }}>
            <div>
              <h3 className="text-xl font-bold text-gray-700 mb-6">Jami Hisob</h3>
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <p className="text-gray-500 text-sm mb-2">To'lanishi kerak:</p>
                <p className="text-5xl font-extrabold text-green-600">
                  {total.toLocaleString()} <span className="text-2xl">so'm</span>
                </p>
              </div>

              {/* NASIYA (QARZ) BO'LIMI */}
              <div className="mt-6 border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCredit}
                    onChange={(e) => setIsCredit(e.target.checked)}
                    className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-lg font-bold text-gray-700">Mijozga Nasiyaga (Qarzga) berish</span>
                </label>

                {isCredit && (
                  <div className="mt-3 animate-fade-in">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Mijozning ismini yozing..."
                      className="w-full p-3 border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 bg-orange-50"
                    />
                  </div>
                )}
              </div>

            </div>

            <div className="flex flex-col gap-4 mt-8">
              {/* Mana shu yerda xato to'g'irlandi: Ikkitalik qo'shtirnoq ishlatildi */}
              <button
                onClick={() => handleCheckout('cash')}
                className={`w-full font-bold py-4 rounded-lg text-xl transition shadow-lg text-white ${isCredit ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}>
                {isCredit ? "📝 Nasiya qilib yozish" : "💵 Naqd To'lov"}
              </button>

              {!isCredit && (
                <button
                  onClick={() => handleCheckout('card')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-lg text-xl transition shadow-lg">
                  💳 Plastik To'lov
                </button>
              )}

              <button
                onClick={() => {
                  setCart([]);
                  setBarcode('');
                  setIsCredit(false);
                  setCustomerName('');
                  setReceiptData(null);
                  barcodeInputRef.current?.focus();
                }}
                className="w-full bg-red-100 hover:bg-red-200 text-red-600 font-bold py-3 rounded-lg mt-4 transition">
                🗑 Savatni tozalash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. OMBOR (PRIXOD) OYNASI */}
      {activeTab === 'inventory' && (
        <div className="print:hidden">
          <Inventory />
        </div>
      )}

      {/* 3. ADMIN DASHBOARD OYNASI */}
      {activeTab === 'dashboard' && (
        <div className="print:hidden">
          <Dashboard />
        </div>
      )}

      {/* CHEK KOMPONENTI */}
      <div className="hidden print:block">
        <Receipt receiptData={receiptData} />
      </div>

      {/* PASTKI NAVIGATSIYA MENYUSI */}
      <div className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex border-t border-gray-200 print:hidden z-50">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex-1 py-5 text-xl font-bold transition-all duration-200 ${
            activeTab === 'pos' ? 'bg-blue-600 text-white shadow-inner' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          🛒 Kassa Oynasi
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-5 text-xl font-bold transition-all duration-200 ${
            activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-inner' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          📦 Ombor (Prixod)
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-5 text-xl font-bold transition-all duration-200 ${
            activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-inner' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          📊 Admin Hisobotlar
        </button>
      </div>

    </div>
  );
}

export default App;