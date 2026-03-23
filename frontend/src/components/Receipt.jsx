import React from 'react';

// Chek ma'lumotlarini props orqali qabul qilamiz
const Receipt = ({ receiptData }) => {
  // Agar hozircha savdo qilinmagan bo'lsa, hech narsa chizmaymiz
  if (!receiptData) return null;

  const { id, items, total_amount, created_at, payment_type } = receiptData;

  // Sanani chiroyli formatlash
  const dateObj = new Date(created_at);
  const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;

  return (
    // "print:..." klasslari faqat printerdan chiqayotganda ishlaydi
    <div
      id="printable-receipt"
      className="bg-white p-4 text-black w-80 font-mono text-sm mx-auto border border-gray-300 shadow-lg print:border-none print:shadow-none print:w-full print:p-0"
    >
      {/* Do'kon nomi va Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">"KAMALOVIC" MARKET</h2>
        <p className="text-xs">Toshkent, O'zbekiston</p>
        <p className="text-xs border-b border-dashed border-black pb-2 mt-1">
          Tel: +998 90 123 45 67
        </p>
      </div>

      {/* Chek info */}
      <div className="mb-4 text-xs">
        <p>Chek raqami: #{id}</p>
        <p>Sana: {formattedDate}</p>
        <p>To'lov turi: {payment_type === 'cash' ? 'Naqd pul' : 'Plastik karta'}</p>
      </div>

      {/* Mahsulotlar ro'yxati */}
      <table className="w-full text-xs mb-4">
        <thead className="border-b border-dashed border-black">
          <tr>
            <th className="text-left py-1">Nomi</th>
            <th className="text-center py-1">Soni</th>
            <th className="text-right py-1">Summa</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              {/* item.product.name orqali bazadagi to'g'ri nomni chiqaramiz */}
              <td className="py-1 break-words w-1/2 font-bold">{item.product.name}</td>
              <td className="text-center py-1">{item.quantity}</td>
              <td className="text-right py-1">{(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Jami hisob */}
      <div className="border-t border-dashed border-black pt-2 mb-4">
        <div className="flex justify-between font-bold text-base">
          <span>JAMI TO'LOV:</span>
          <span>{total_amount.toLocaleString()} so'm</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs mt-4">
        <p>Xaridingiz uchun rahmat!</p>
        <p>Yana keling!</p>
        <p className="mt-2 text-[10px] text-gray-500">Tizim: POS System v1.0</p>
      </div>
    </div>
  );
};

export default Receipt;