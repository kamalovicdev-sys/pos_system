import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Receipt from './components/Receipt'; // <-- Chek komponentini chaqirib oldik

// Backend manzilimiz
const API_URL = 'http://127.0.0.1:8000';

function App() {
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [total, setTotal] = useState(0);
  const [receiptData, setReceiptData] = useState(null); // <-- Tayyor chekni saqlash uchun state

  // Skaner uchun inputga avtomat fokus qaratish
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    // Dastur ochilganda va har xarid qo'shilganda inputga fokusni qaytarish
    barcodeInputRef.current?.focus();
  }, [cart]);

  // Jami summani hisoblash
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  // Avtomatik Chop etish (Print) mantiqi
  useEffect(() => {
    if (receiptData) {
      // DOM'da chek chizilishiga ulgurishi uchun juda kichik (0.3 sek) kechikish beramiz
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
          return [...prevCart, {
            product_id: product.id,
            name: product.name,
            price: 12000, // Hozircha test narx
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

  // To'lovni amalga oshirish funksiyasi
  const handleCheckout = async (paymentType) => {
    if (cart.length === 0) {
      alert("Savat bo'sh! Iltimos, oldin mahsulot skanerlang.");
      return;
    }

    const saleData = {
      payment_type: paymentType,
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await axios.post(`${API_URL}/sales/`, saleData);

      // Chek ma'lumotlarini state'ga saqlaymiz. (Bu avtomat window.print() ni chaqiradi)
      setReceiptData(response.data);

      // Kassa oynasini keyingi xaridor uchun tozalaymiz
      setCart([]);
      setBarcode('');
      barcodeInputRef.current?.focus();

    } catch (error) {
      console.error("Savdoda xatolik:", error);
      alert("To'lovni amalga oshirishda xatolik yuz berdi. Server ishlab turganini tekshiring.");
    }
  };

  return (
    <>
      {/* ASOSIY KASSA OYNASI
        "print:hidden" orqali bu oyna printerga yuborilmasligini ta'minlaymiz
      */}
      <div className="min-h-screen bg-gray-100 p-4 flex gap-4 print:hidden">

        {/* CHAP TOMON: Savatcha (Cart) */}
        <div className="w-2/3 bg-white rounded-lg shadow-md p-6 flex flex-col">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Savdo oynasi</h2>

          <form onSubmit={handleScan} className="mb-6">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Shtrix kodni skanerlang..."
              className="w-full p-4 border-2 border-blue-500 rounded-lg text-lg focus:outline-none focus:ring-4 focus:ring-blue-200"
              autoFocus
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
                    <td className="p-3 text-lg">{item.name}</td>
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
        <div className="w-1/3 bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
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
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg text-xl transition">
              💵 Naqd To'lov
            </button>
            <button
              onClick={() => handleCheckout('card')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-lg text-xl transition">
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

      {/* CHEK KOMPONENTI
        "hidden print:block" orqali u faqat chop etish vaqtida ko'rinadi
      */}
      <div className="hidden print:block">
        <Receipt receiptData={receiptData} />
      </div>
    </>
  );
}

export default App;