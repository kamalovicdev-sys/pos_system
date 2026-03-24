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
      alert("Product not found or unavailable.");
      setBarcode('');
    }
  };

  const handleCheckout = async (paymentType) => {
    if (cart.length === 0) {
      alert("Cart is empty. Please scan items.");
      return;
    }

    if (isCredit && !customerName.trim()) {
      alert("Customer name is required for credit transactions.");
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

      setCart([]);
      setBarcode('');
      setIsCredit(false);
      setCustomerName('');

      if (activeTab === 'pos') barcodeInputRef.current?.focus();

    } catch (error) {
      console.error("Checkout error:", error);
      alert("Transaction failed. Please check server connection.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* CORPORATE TOP NAVIGATION */}
      <nav className="bg-slate-900 text-slate-200 border-b border-slate-700 print:hidden">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex justify-between h-14">

            <div className="flex items-center gap-8">
              <span className="font-bold text-sm tracking-widest text-white uppercase">
                Enterprise POS
              </span>

              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('pos')}
                  className={`px-4 py-4 text-xs font-semibold tracking-wide uppercase transition-colors duration-150 ${
                    activeTab === 'pos' 
                      ? 'bg-slate-800 text-white border-b-2 border-blue-500' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Terminal
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-4 py-4 text-xs font-semibold tracking-wide uppercase transition-colors duration-150 ${
                    activeTab === 'inventory' 
                      ? 'bg-slate-800 text-white border-b-2 border-blue-500' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Inventory Management
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-4 text-xs font-semibold tracking-wide uppercase transition-colors duration-150 ${
                    activeTab === 'dashboard' 
                      ? 'bg-slate-800 text-white border-b-2 border-blue-500' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Business Analytics
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-xs font-medium text-slate-400">User: System Admin</span>
            </div>

          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-screen-2xl mx-auto p-4 print:hidden">

        {/* 1. KASSA OYNASI (POS TERMINAL) */}
        {activeTab === 'pos' && (
          <div className="flex gap-4">

            {/* CHAP TOMON: Savatcha */}
            <div className="w-8/12 bg-white border border-slate-200 shadow-sm rounded-sm flex flex-col" style={{ minHeight: 'calc(100vh - 6rem)' }}>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Sales Processing</h2>
              </div>

              <div className="p-6 flex-grow flex flex-col">
                <form onSubmit={handleScan} className="mb-6">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Barcode Entry</label>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Enter or scan barcode..."
                    className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition-shadow"
                  />
                </form>

                <div className="flex-grow overflow-y-auto border border-slate-200 rounded-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Material Description</th>
                        <th className="px-4 py-3 font-semibold w-24">Qty</th>
                        <th className="px-4 py-3 font-semibold w-32">Unit Price</th>
                        <th className="px-4 py-3 font-semibold w-32 text-right">Net Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-800 font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-slate-800">{item.quantity}</td>
                          <td className="px-4 py-3 text-slate-600">{item.price.toLocaleString()} UZS</td>
                          <td className="px-4 py-3 text-slate-900 font-semibold text-right">
                            {(item.price * item.quantity).toLocaleString()} UZS
                          </td>
                        </tr>
                      ))}
                      {cart.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-12 text-center text-sm text-slate-400">
                            No materials scanned.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* O'NG TOMON: Hisob-kitob */}
            <div className="w-4/12 bg-white border border-slate-200 shadow-sm rounded-sm flex flex-col justify-between" style={{ minHeight: 'calc(100vh - 6rem)' }}>

              <div>
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Transaction Details</h3>
                </div>

                <div className="p-6">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm text-right mb-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Amount Due</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {total.toLocaleString()} <span className="text-lg font-medium text-slate-500">UZS</span>
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={isCredit}
                        onChange={(e) => setIsCredit(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded-sm focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-semibold text-slate-700">Process as Credit Document</span>
                    </label>

                    {isCredit && (
                      <div className="mt-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Customer Account / Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter Customer Details"
                          className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
                <button
                  onClick={() => handleCheckout('cash')}
                  className={`w-full font-semibold text-sm px-5 py-3 rounded-sm transition-colors ${
                    isCredit 
                      ? 'bg-slate-800 hover:bg-slate-900 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  }`}>
                  {isCredit ? 'Post Credit Document' : 'Post Cash Payment'}
                </button>

                {!isCredit && (
                  <button
                    onClick={() => handleCheckout('card')}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm px-5 py-3 rounded-sm transition-colors shadow-sm">
                    Post Card Payment
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
                  className="w-full mt-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm px-5 py-3 rounded-sm transition-colors">
                  Cancel Transaction
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 2. OMBOR (INVENTORY) */}
        {activeTab === 'inventory' && (
          <Inventory />
        )}

        {/* 3. BIZNES ANALITIKA (DASHBOARD) */}
        {activeTab === 'dashboard' && (
          <Dashboard />
        )}

      </main>

      {/* CHEK KOMPONENTI */}
      <div className="hidden print:block">
        <Receipt receiptData={receiptData} />
      </div>

    </div>
  );
}

export default App;