import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const Inventory = () => {
  const [barcode, setBarcode] = useState('');
  const [step, setStep] = useState('scan');
  const [product, setProduct] = useState(null);

  const [categories, setCategories] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [newProduct, setNewProduct] = useState({ name: '', unit: 'dona', category_id: '' });

  const [inventoryData, setInventoryData] = useState({ quantity: '', cost_price: '', selling_price: '' });

  // YANGI: Nasiyaga olish uchun state'lar
  const [isCredit, setIsCredit] = useState(false);
  const [supplierName, setSupplierName] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/categories/`);
        setCategories(res.data);
        if (res.data.length > 0) {
          setNewProduct(prev => ({ ...prev, category_id: res.data[0].id }));
        }
      } catch (error) {
        console.error("Kategoriyalarni yuklashda xatolik");
      }
    };
    fetchCategories();
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/categories/`, { name: newCategoryName });
      setCategories([...categories, res.data]);
      setNewProduct({ ...newProduct, category_id: res.data.id });
      setIsAddingCategory(false);
      setNewCategoryName('');
    } catch (error) {
      alert("Kategoriya yaratishda xatolik yuz berdi!");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const res = await axios.get(`${API_URL}/products/scan/${barcode}`);
      setProduct(res.data);
      setStep('add_inventory');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setStep('new_product');
      } else {
        alert("Xatolik yuz berdi. Serverni tekshiring.");
      }
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) {
      alert("Iltimos, shtrix-kodni kiriting!");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/products/`, {
        barcode: barcode,
        name: newProduct.name,
        unit: newProduct.unit,
        category_id: parseInt(newProduct.category_id)
      });
      setProduct(res.data);
      setStep('add_inventory');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert("Bu shtrix-kod allaqachon ro'yxatdan o'tgan!");
      } else {
        alert("Mahsulot yaratishda xatolik!");
      }
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();

    if (isCredit && !supplierName.trim()) {
      alert("Iltimos, qarzga berayotgan ta'minotchi ismini kiriting!");
      return;
    }

    try {
      await axios.post(`${API_URL}/inventory/`, {
        product_id: product.id,
        quantity: parseFloat(inventoryData.quantity),
        cost_price: parseFloat(inventoryData.cost_price),
        selling_price: parseFloat(inventoryData.selling_price),
        is_credit: isCredit,          // Nasiya holati
        supplier_name: supplierName   // Ta'minotchi ismi
      });

      alert(`✅ ${product.name} muvaffaqiyatli omborga qo'shildi!`);

      setBarcode('');
      setProduct(null);
      setInventoryData({ quantity: '', cost_price: '', selling_price: '' });
      setIsCredit(false);
      setSupplierName('');
      setStep('scan');
    } catch (error) {
      alert("Omborga kiritishda xatolik yuz berdi!");
    }
  };

  return (
    <div className="p-6 w-full max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
        📦 Tovar qabul qilish va Ro'yxatdan o'tkazish
      </h2>

      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">

        {step === 'scan' && (
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="text-gray-700 font-bold text-lg">Shtrix-kod orqali qidirish:</label>
              <button
                onClick={() => { setBarcode(''); setStep('new_product'); }}
                className="bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2 px-4 rounded-lg transition"
              >
                + Yangi mahsulot qo'shish
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-4">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Skanerlang yoki kiriting..."
                className="flex-1 p-4 border-2 border-gray-300 rounded-lg text-xl focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition shadow-md">
                Qidirish
              </button>
            </form>
          </div>
        )}

        {step === 'new_product' && (
          <form onSubmit={handleCreateProduct} className="flex flex-col gap-5 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-2">Yangi mahsulotni ro'yxatdan o'tkazish</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Shtrix-kod (Yoki ixtiyoriy raqam)</label>
                <input required type="text" value={barcode} onChange={e => setBarcode(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 font-mono" placeholder="123456789..." />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Mahsulot nomi</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masalan: Qora non" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">O'lchov birligi</label>
                <select value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="dona">Dona</option>
                  <option value="kg">Kilogramm (kg)</option>
                  <option value="litr">Litr (l)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">Kategoriyasi</label>
                {isAddingCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Nomini yozing..."
                      autoFocus
                    />
                    <button type="button" onClick={handleCreateCategory} className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-lg font-bold transition">✓</button>
                    <button type="button" onClick={() => setIsAddingCategory(false)} className="bg-red-400 hover:bg-red-500 text-white px-4 rounded-lg font-bold transition">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select required value={newProduct.category_id} onChange={e => setNewProduct({...newProduct, category_id: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                      {categories.length === 0 && <option value="">Kategoriya yo'q</option>}
                    </select>
                    <button type="button" onClick={() => setIsAddingCategory(true)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 rounded-lg font-bold text-xl transition" title="Yangi kategoriya yaratish">+</button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button type="button" onClick={() => { setStep('scan'); setBarcode(''); setIsAddingCategory(false); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition">Bekor qilish</button>
              <button type="submit" className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition shadow-md">Saqlash va Davom etish ➡️</button>
            </div>
          </form>
        )}

        {step === 'add_inventory' && product && (
          <form onSubmit={handleAddInventory} className="flex flex-col gap-5">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-2">Mahsulotni omborga qabul qilish</h3>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-600 font-bold uppercase">Tanlangan mahsulot:</p>
                <p className="text-2xl font-bold text-gray-800">{product.name}</p>
              </div>
              <span className="bg-white px-3 py-1 rounded shadow-sm text-sm border font-mono">{product.barcode}</span>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Kelgan soni / hajmi ({product.unit})</label>
              <input required type="number" step="0.01" value={inventoryData.quantity} onChange={e => setInventoryData({...inventoryData, quantity: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xl" placeholder="0" autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Kelish narxi (Tan narx)</label>
                <input required type="number" value={inventoryData.cost_price} onChange={e => setInventoryData({...inventoryData, cost_price: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="so'm" />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Sotish narxi (Kassa uchun)</label>
                <input required type="number" value={inventoryData.selling_price} onChange={e => setInventoryData({...inventoryData, selling_price: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="so'm" />
              </div>
            </div>

            {/* NASIYAGA OLISH BO'LIMI */}
            <div className="mt-2 border-t pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCredit}
                  onChange={(e) => setIsCredit(e.target.checked)}
                  className="w-6 h-6 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-lg font-bold text-gray-700">Ta'minotchidan Nasiyaga (Qarzga) olish</span>
              </label>

              {isCredit && (
                <div className="mt-3 animate-fade-in">
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Ta'minotchi (Firma yoki Shaxs) ismini yozing..."
                    className="w-full p-3 border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-500 bg-red-50"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-4">
              <button type="button" onClick={() => {setStep('scan'); setBarcode('');}} className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-lg transition">Ortga</button>
              <button type="submit" className={`w-2/3 text-white font-bold py-4 rounded-lg text-xl transition shadow-lg ${isCredit ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}>
                {isCredit ? '📝 Nasiyaga Qabul Qilish' : '📥 Omborga Qabul Qilish'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Inventory;