import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Receipt from './components/Receipt';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory'; // <-- Ombor komponenti qo'shildi

// Backend manzilimiz
const API_URL = 'http://127.0.0.1:8000';

function App() {
  // Oynalarni o'zgartirish uchun state (pos, inventory yoki dashboard)
  const [activeTab, setActiveTab] = useState('pos');

  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [total, setTotal] = useState(0);
  const [receiptData, setReceiptData] = useState(null);

  // Skaner uchun inputga avtomat fokus qaratish
  const barcodeInputRef = useRef(null);

  // Dastur ochilganda, xarid qo'shilganda yoki Kassa oynasiga o'tilganda fokusni qaratish
  useEffect(() => {
    if (activeTab === 'pos') {
      barcodeInputRef.current?.focus();
    }
  }, [cart, activeTab]);

  // Jami summani hisoblash
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  // Avtomatik Chop etish (Print) mantiqi
  useEffect(() => {
    if (receiptData) {
      // DOM'da chek chizilishiga ulgurishi uchun kichik (0.3 sek) kechikish beramiz
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [receiptData]);

  // Skaner ishlaganda (yoki Enter bosilganda) ishga tushadigan funksiya
  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      // Backenddan mahsulotni qidirish
      const response = await axios.get(`${API_URL}/products/scan/${barcode}`);
      const product = response.data;

      // Mahsulot topilsa, uni savatga qo'shish yoki sonini oshirish
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.product_id === product.id);

        if (existingItem) {
          return prevCart.map(item =>
            item.product_id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          // Eslatma: Haqiqiy loyihada narxni Inventory jadvalidan olish to'g'riroq.
          // Hozirgi test versiya uchun standart 12000 narx qo'yilgan.
          return [...prevCart, {
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
          }];
        }
      });

      setBarcode(''); // Skanerdan keyin maydonni tozalash
    } catch (error) {
      alert("Mahsulot topilmadi!");
      setBarcode('');
    }
  };

  // To'lovni amalga oshirish funksiyasi
  const handleCheckout = async (paymentType) => {
    if (cart.length === 0) {
      alert("Savat bo'sh! Iltimos, oldin mahsulot skanerlang.");
      return;
    }

    // Backend kutayotgan JSON formatini tayyorlaymiz
    const saleData = {
      payment_type: paymentType,
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    try {
      // Backend'dagi /sales/ yo'nalishiga POST so'rov yuboramiz
      const response = await axios.post(`${API_URL}/sales/`, saleData);

      // Chek ma'lumotlarini state'ga saqlaymiz. (Bu avtomat window.print() ni chaqiradi)
      setReceiptData(response.data);

      // Kassa oynasini keyingi xaridor uchun tozalaymiz
      setCart([]);
      setBarcode('');
      if (activeTab === 'pos') barcodeInputRef.current?.focus();

    } catch (error) {
      console.error("Savdoda xatolik:", error);
      alert("To'lovni amalga oshirishda xatolik yuz berdi. Server ishlab turganini tekshiring.");
    }
  };

  return (
    // pb-20 klassi pastki menyu kontentni yopib qo'ymasligi uchun pastdan joy tashlaydi
    <div className="min-h-screen bg-gray-100 pb-20 relative">

      {/* --- ASOSIY KONTENT QISMI --- */}

      {/* 1. KASSA OYNASI */}
      {activeTab === 'pos' && (
        <div className="p-4 flex gap-4 print:hidden">

          {/* CHAP TOMON: Savatcha (Cart) */}
          <div className="w-2/3 bg-white rounded-lg shadow-md p-6 flex flex-col" style={{ minHeight: 'calc(100vh - 7rem)' }}>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Savdo oynasi</h2>

            {/* Skaner inputi (doim faol turadi) */}
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

            {/* Mahsulotlar ro'yxati */}
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

          {/* O'NG TOMON: Hisob-kitob va To'lov */}
          <div className="w-1/3 bg-white rounded-lg shadow-md p-6 flex flex-col justify-between" style={{ minHeight: 'calc(100vh - 7rem)' }}>
            <div>
              <h3 className="text-xl font-bold text-gray-700 mb-6">Jami Hisob</h3>
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <p className="text-gray-500 text-sm mb-2">To'lanishi kerak:</p>
                <p className="text-5xl font-extrabold text-green-600">
                  {total.toLocaleString()} <span className="text-2xl">so'm</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <button
                onClick={() => handleCheckout('cash')}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg text-xl transition shadow-lg">
                💵 Naqd To'lov
              </button>
              <button
                onClick={() => handleCheckout('card')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-lg text-xl transition shadow-lg">
                💳 Plastik To'lov
              </button>
              <button
                onClick={() => {
                  setCart([]);
                  setBarcode('');
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

      {/* --- CHEK KOMPONENTI (Faqat printerda chiqadi) --- */}
      <div className="hidden print:block">
        <Receipt receiptData={receiptData} />
      </div>

      {/* --- PASTKI NAVIGATSIYA MENYUSI (Bottom Navigation) --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex border-t border-gray-200 print:hidden z-50">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex-1 py-5 text-xl font-bold transition-all duration-200 ${
            activeTab === 'pos' 
              ? 'bg-blue-600 text-white shadow-inner' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          🛒 Kassa Oynasi
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-5 text-xl font-bold transition-all duration-200 ${
            activeTab === 'inventory' 
              ? 'bg-blue-600 text-white shadow-inner' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          📦 Ombor (Prixod)
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-5 text-xl font-bold transition-all duration-200 ${
            activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-inner' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          📊 Admin Hisobotlar
        </button>
      </div>

    </div>
  );
}

export default App;