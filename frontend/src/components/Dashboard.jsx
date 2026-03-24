import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
      console.error("Analytics loading error:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchStats(null, null);
  };

  // Nasiya to'lovlari (emojilarsiz va rasmiy matnlar bilan)
  const handlePayCustomer = async (name, currentBalance) => {
    const amountStr = window.prompt(`Customer: ${name}\nCurrent Balance: ${currentBalance.toLocaleString()} UZS\n\nEnter payment amount received:`);
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount entered.");
      return;
    }

    try {
      await axios.post(`${API_URL}/debts/customer/pay`, { name: name, amount: amount });
      alert(`Payment of ${amount.toLocaleString()} UZS posted to ${name}'s account.`);
      fetchStats();
    } catch (error) {
      alert("Payment posting failed.");
    }
  };

  const handlePaySupplier = async (name, currentBalance) => {
    const amountStr = window.prompt(`Vendor: ${name}\nCurrent Payable: ${currentBalance.toLocaleString()} UZS\n\nEnter payment amount sent:`);
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount entered.");
      return;
    }

    try {
      await axios.post(`${API_URL}/debts/supplier/pay`, { name: name, amount: amount });
      alert(`Payment of ${amount.toLocaleString()} UZS posted to vendor ${name}.`);
      fetchStats();
    } catch (error) {
      alert("Payment posting failed.");
    }
  };

  if (!stats) return (
    <div className="p-12 text-center text-sm font-semibold text-slate-500 uppercase tracking-wide">
      Initializing Analytics Engine...
    </div>
  );

  return (
    <div className="w-full pb-12">

      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Financial Overview</h2>
          <p className="text-sm text-slate-500">P&L and Accounts Management</p>
        </div>

        <div className="flex flex-wrap items-center bg-white border border-slate-200 rounded-sm shadow-sm px-2 py-1.5">
          <div className="flex items-center px-3 gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Valid From</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="outline-none text-xs text-slate-800 font-semibold bg-transparent"
            />
          </div>
          <div className="h-4 w-px bg-slate-300 mx-1"></div>
          <div className="flex items-center px-3 gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Valid To</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="outline-none text-xs text-slate-800 font-semibold bg-transparent"
            />
          </div>

          <button
            onClick={() => fetchStats()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-sm font-semibold text-xs ml-2 transition-colors"
          >
            Apply Filter
          </button>

          {(startDate || endDate) && (
            <button
              onClick={clearFilter}
              className="text-slate-400 hover:text-slate-700 px-3 text-sm font-bold transition-colors"
              title="Clear Filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* P&L (PROFIT & LOSS) METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-sm shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Gross Revenue</p>
          <p className="text-2xl font-bold text-slate-900">{stats.pl_analysis.revenue.toLocaleString()} <span className="text-sm text-slate-500 font-medium">UZS</span></p>
        </div>

        <div className="bg-white p-5 rounded-sm shadow-sm border border-slate-200 border-l-4 border-l-slate-400">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Cost of Goods Sold (COGS)</p>
          <p className="text-2xl font-bold text-slate-700">{stats.pl_analysis.cogs.toLocaleString()} <span className="text-sm text-slate-500 font-medium">UZS</span></p>
        </div>

        <div className="bg-slate-800 p-5 rounded-sm shadow-sm border border-slate-900">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Net Operating Profit</p>
          <p className="text-2xl font-bold text-white">{stats.pl_analysis.net_profit.toLocaleString()} <span className="text-sm text-slate-400 font-medium">UZS</span></p>
        </div>
      </div>

      {/* ACCOUNTS RECEIVABLE & PAYABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Accounts Receivable (Mijozlar Qarzi) */}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Accounts Receivable (AR)</h3>
            <span className="bg-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
              Total: {stats.debts_receive.total.toLocaleString()} UZS
            </span>
          </div>

          <div className="p-0 flex-grow max-h-80 overflow-y-auto">
            {stats.debts_receive.list.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 text-center py-8">No open items found.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                  {stats.debts_receive.list.map((debt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-800">{debt.name}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-700">
                        {debt.balance.toLocaleString()} UZS
                      </td>
                      <td className="px-5 py-3 w-32 text-right">
                        <button
                          onClick={() => handlePayCustomer(debt.name, debt.balance)}
                          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-[10px] uppercase tracking-wide px-3 py-1.5 font-bold rounded-sm transition-colors">
                          Clear Line
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Accounts Payable (Ta'minotchilar Qarzi) */}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Accounts Payable (AP)</h3>
            <span className="bg-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
              Total: {stats.debts_pay.total.toLocaleString()} UZS
            </span>
          </div>

          <div className="p-0 flex-grow max-h-80 overflow-y-auto">
            {stats.debts_pay.list.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 text-center py-8">No open items found.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                  {stats.debts_pay.list.map((debt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-800">{debt.name}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-700">
                        {debt.balance.toLocaleString()} UZS
                      </td>
                      <td className="px-5 py-3 w-32 text-right">
                        <button
                          onClick={() => handlePaySupplier(debt.name, debt.balance)}
                          className="bg-slate-800 text-white hover:bg-slate-900 text-[10px] uppercase tracking-wide px-3 py-1.5 font-bold rounded-sm transition-colors">
                          Post Payment
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

      {/* LOW STOCK ALERT (EXCEPTION MONITORING) */}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Exception Monitoring: Low Stock</h3>
        </div>

        {stats.low_stock_items.length === 0 ? (
          <p className="text-xs font-medium text-slate-400 text-center py-6">All stock levels within nominal parameters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 font-semibold">Material Description</th>
                  <th className="px-5 py-3 font-semibold w-32 text-right">Current Stock</th>
                  <th className="px-5 py-3 font-semibold w-40 text-right">Target Sales Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.low_stock_items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{item.product_name}</td>
                    <td className="px-5 py-3 font-bold text-slate-900 text-right">{item.quantity}</td>
                    <td className="px-5 py-3 text-slate-600 text-right">{item.selling_price.toLocaleString()} UZS</td>
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