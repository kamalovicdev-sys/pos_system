import { useState, useEffect } from 'react';
import axios from 'axios';
import { t } from '../translations';

const API_URL = 'http://127.0.0.1:8000';

const Inventory = ({ lang }) => {
  // Asosiy Tab uchun state
  const [activeInvTab, setActiveInvTab] = useState('overview'); // 'overview' yoki 'receipt'

  // Tovar Qabul Qilish statelari
  const [barcode, setBarcode] = useState('');
  const [step, setStep] = useState('scan');
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'dona', category_id: '' });
  const [inventoryData, setInventoryData] = useState({ quantity: '', cost_price: '', selling_price: '' });
  const [isCredit, setIsCredit] = useState(false);
  const [supplierName, setSupplierName] = useState('');

  // Ombor Qoldig'i (Overview) statelari
  const [stockList, setStockList] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // Kategoriyalarni yuklash
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/categories/`);
        setCategories(res.data);
        if (res.data.length > 0) {
          setNewProduct(prev => ({ ...prev, category_id: res.data[0].id }));
        }
      } catch (error) {
        console.error("Error loading categories");
      }
    };
    fetchCategories();
  }, []);

  // Ombor qoldig'ini yuklash (Faqat 'overview' tab ochilganda)
  useEffect(() => {
    const fetchStock = async () => {
      setLoadingStock(true);
      try {
        const res = await axios.get(`${API_URL}/inventory/`);
        setStockList(res.data);
      } catch (error) {
        console.error("Error loading stock list", error);
      } finally {
        setLoadingStock(false);
      }
    };

    if (activeInvTab === 'overview') {
      fetchStock();
    }
  }, [activeInvTab]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/categories/`, { name: newCategoryName });
      setCategories([...categories, res.data]);
      setNewProduct({ ...newProduct, category_id: res.data.id });
      setIsAddingCategory(false);
      setNewCategoryName('');
    } catch (error) {
      alert("Category creation failed!");
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
        alert(t[lang].transFailed);
      }
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) {
      alert(t[lang].barcodeReq);
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
      alert(t[lang].transFailed);
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();

    if (isCredit && !supplierName.trim()) {
      alert(t[lang].vendorReq);
      return;
    }

    try {
      await axios.post(`${API_URL}/inventory/`, {
        product_id: product.id,
        quantity: parseFloat(inventoryData.quantity),
        cost_price: parseFloat(inventoryData.cost_price),
        selling_price: parseFloat(inventoryData.selling_price),
        is_credit: isCredit,
        supplier_name: supplierName
      });

      alert(`${t[lang].invSuccess} ${product.name}`);

      setBarcode('');
      setProduct(null);
      setInventoryData({ quantity: '', cost_price: '', selling_price: '' });
      setIsCredit(false);
      setSupplierName('');
      setStep('scan');

      // Muvaffaqiyatli qo'shilgach, yozuvlarni yangilash uchun Overviewga o'tkazamiz
      setActiveInvTab('overview');
    } catch (error) {
      alert(t[lang].transFailed);
    }
  };

  // Ombor qoldig'i hisob-kitoblari
  const cashStock = stockList.filter(item => !item.is_credit);
  const creditStock = stockList.filter(item => item.is_credit);

  const calcTotalCost = (list) => list.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
  const calcTotalRetail = (list) => list.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0);

  const totalCostOverall = calcTotalCost(stockList);
  const totalRetailOverall = calcTotalRetail(stockList);

  return (
    <div className="w-full pb-12">

      {/* TABS & Sarlavha */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">{t[lang].invTitle}</h2>
          <p className="text-sm text-slate-500">{t[lang].invSubtitle}</p>
        </div>

        {/* Tab Menyu */}
        <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200">
          <button
            onClick={() => setActiveInvTab('overview')}
            className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-sm ${activeInvTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t[lang].tabOverview}
          </button>
          <button
            onClick={() => setActiveInvTab('receipt')}
            className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-sm ${activeInvTab === 'receipt' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t[lang].tabReceipt}
          </button>
        </div>
      </div>

      {/* ================= OMBOR QOLDIG'I (OVERVIEW TAB) ================= */}
      {activeInvTab === 'overview' && (
        <div className="flex flex-col gap-6 animate-fade-in">

          {loadingStock ? (
            <div className="text-center py-10 text-slate-500 font-bold uppercase tracking-widest text-sm">
              {t[lang].loading}
            </div>
          ) : (
            <>
              {/* Jami Ombor Qoldig'i Qiymati */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-sm shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t[lang].totalCost}</p>
                  <p className="text-2xl font-bold text-slate-900">{totalCostOverall.toLocaleString()} <span className="text-sm text-slate-500 font-medium">UZS</span></p>
                </div>

                <div className="bg-white p-5 rounded-sm shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t[lang].totalRetail}</p>
                  <p className="text-2xl font-bold text-slate-900">{totalRetailOverall.toLocaleString()} <span className="text-sm text-slate-500 font-medium">UZS</span></p>
                </div>
              </div>

              {/* 1. Naqdga olingan tovarlar jadvali */}
              <div className="bg-white rounded-sm shadow-sm border border-slate-200 flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t[lang].cashStock}</h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
                    {t[lang].total}: {calcTotalCost(cashStock).toLocaleString()} UZS
                  </span>
                </div>

                <div className="p-0 overflow-x-auto">
                  {cashStock.length === 0 ? (
                    <p className="text-xs font-medium text-slate-400 text-center py-6">{t[lang].emptyStock}</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3 font-semibold">{t[lang].matDesc}</th>
                          <th className="px-5 py-3 font-semibold text-right">{t[lang].qty}</th>
                          <th className="px-5 py-3 font-semibold text-right">{t[lang].unitCost}</th>
                          <th className="px-5 py-3 font-semibold text-right">{t[lang].stdPrice}</th>
                          <th className="px-5 py-3 font-semibold text-right bg-slate-50">{t[lang].itemTotal}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cashStock.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 font-semibold text-slate-800">{item.product.name}</td>
                            <td className="px-5 py-3 text-right font-bold text-slate-700">{item.quantity} {item.product.unit}</td>
                            <td className="px-5 py-3 text-right text-slate-600">{item.cost_price.toLocaleString()}</td>
                            <td className="px-5 py-3 text-right text-emerald-600 font-medium">{item.selling_price.toLocaleString()}</td>
                            <td className="px-5 py-3 text-right font-bold text-slate-900 bg-slate-50">{(item.quantity * item.cost_price).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* 2. Nasiyaga olingan tovarlar jadvali */}
              <div className="bg-white rounded-sm shadow-sm border border-slate-200 flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t[lang].creditStock}</h3>
                  <span className="bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
                    {t[lang].total}: {calcTotalCost(creditStock).toLocaleString()} UZS
                  </span>
                </div>

                <div className="p-0 overflow-x-auto">
                  {creditStock.length === 0 ? (
                    <p className="text-xs font-medium text-slate-400 text-center py-6">{t[lang].emptyStock}</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3 font-semibold">{t[lang].matDesc}</th>
                          <th className="px-5 py-3 font-semibold">{t[lang].supplier}</th>
                          <th className="px-5 py-3 font-semibold text-right">{t[lang].qty}</th>
                          <th className="px-5 py-3 font-semibold text-right">{t[lang].unitCost}</th>
                          <th className="px-5 py-3 font-semibold text-right bg-orange-50/50">{t[lang].itemTotal}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {creditStock.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 font-semibold text-slate-800">{item.product.name}</td>
                            <td className="px-5 py-3 text-slate-600 font-medium">{item.supplier_name}</td>
                            <td className="px-5 py-3 text-right font-bold text-slate-700">{item.quantity} {item.product.unit}</td>
                            <td className="px-5 py-3 text-right text-slate-600">{item.cost_price.toLocaleString()}</td>
                            <td className="px-5 py-3 text-right font-bold text-orange-700 bg-orange-50/50">{(item.quantity * item.cost_price).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </>
          )}
        </div>
      )}


      {/* ================= TOVAR QABUL QILISH (RECEIPT TAB) ================= */}
      {activeInvTab === 'receipt' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm animate-fade-in max-w-4xl mx-auto">

          {step === 'scan' && (
            <div className="p-8">
              <div className="flex justify-between items-end mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t[lang].lookup}
                </label>
                <button
                  onClick={() => { setBarcode(''); setStep('new_product'); }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 uppercase tracking-wide transition-colors"
                >
                  {t[lang].regNew}
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex gap-4">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder={t[lang].barcodePlaceholder}
                  className="flex-1 p-3 bg-white border border-slate-300 text-slate-900 text-sm rounded-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  autoFocus
                />
                <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm px-8 py-3 rounded-sm transition-colors">
                  {t[lang].execute}
                </button>
              </form>
            </div>
          )}

          {step === 'new_product' && (
            <form onSubmit={handleCreateProduct} className="p-8">
              <div className="border-b border-slate-200 pb-4 mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t[lang].createMaster}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{t[lang].matNum}</label>
                  <input required type="text" value={barcode} onChange={e => setBarcode(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm font-mono rounded-sm focus:ring-1 focus:ring-blue-600 outline-none" placeholder={t[lang].matNumPlaceholder} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{t[lang].matDesc}</label>
                  <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-sm focus:ring-1 focus:ring-blue-600 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{t[lang].baseUnit}</label>
                  <select value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-sm focus:ring-1 focus:ring-blue-600 outline-none">
                    <option value="dona">{t[lang].pc}</option>
                    <option value="kg">{t[lang].kg}</option>
                    <option value="litr">{t[lang].litr}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{t[lang].matGroup}</label>
                  {isAddingCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="flex-1 p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-sm focus:ring-1 focus:ring-blue-600 outline-none"
                        placeholder={t[lang].catPlaceholder}
                        autoFocus
                      />
                      <button type="button" onClick={handleCreateCategory} className="bg-slate-800 hover:bg-slate-900 text-white px-4 text-xs font-semibold rounded-sm">{t[lang].save}</button>
                      <button type="button" onClick={() => setIsAddingCategory(false)} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 text-xs font-semibold rounded-sm">{t[lang].cancel}</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select required value={newProduct.category_id} onChange={e => setNewProduct({...newProduct, category_id: e.target.value})} className="flex-1 p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-sm focus:ring-1 focus:ring-blue-600 outline-none">
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                        {categories.length === 0 && <option value="">{t[lang].noGroups}</option>}
                      </select>
                      <button type="button" onClick={() => setIsAddingCategory(true)} className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 rounded-sm font-bold text-sm">+</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setStep('scan'); setBarcode(''); setIsAddingCategory(false); }} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm px-6 py-2.5 rounded-sm transition-colors">{t[lang].cancel}</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-sm transition-colors">{t[lang].saveProceed}</button>
              </div>
            </form>
          )}

          {step === 'add_inventory' && product && (
            <form onSubmit={handleAddInventory} className="p-8">
              <div className="border-b border-slate-200 pb-4 mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t[lang].postGr}</h3>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-sm flex justify-between items-center mb-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{t[lang].targetMat}</p>
                  <p className="text-lg font-bold text-slate-800">{product.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{t[lang].matNo}</p>
                  <span className="font-mono text-sm font-semibold text-slate-700">{product.barcode}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{t[lang].recQty} ({product.unit})</label>
                <input required type="number" step="0.01" value={inventoryData.quantity} onChange={e => setInventoryData({...inventoryData, quantity: e.target.value})} className="w-full p-3 bg-white border border-slate-300 text-slate-900 text-lg font-semibold rounded-sm focus:ring-1 focus:ring-blue-600 outline-none" placeholder="0.00" autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{t[lang].unitCost}</label>
                  <input required type="number" value={inventoryData.cost_price} onChange={e => setInventoryData({...inventoryData, cost_price: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-sm focus:ring-1 focus:ring-blue-600 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{t[lang].stdPrice}</label>
                  <input required type="number" value={inventoryData.selling_price} onChange={e => setInventoryData({...inventoryData, selling_price: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-sm focus:ring-1 focus:ring-blue-600 outline-none" placeholder="0" />
                </div>
              </div>

              <div className="mb-8 p-4 border border-slate-200 bg-white rounded-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCredit}
                    onChange={(e) => setIsCredit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded-sm focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">{t[lang].vendorCredit}</span>
                </label>

                {isCredit && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{t[lang].vendorName}</label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder={t[lang].vendorPlaceholder}
                      className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-sm focus:ring-1 focus:ring-blue-600 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => {setStep('scan'); setBarcode('');}} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm px-6 py-2.5 rounded-sm transition-colors">{t[lang].cancelPost}</button>
                <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm px-6 py-2.5 rounded-sm transition-colors">{t[lang].postDoc}</button>
              </div>
            </form>
          )}

        </div>
      )}

    </div>
  );
};

export default Inventory;