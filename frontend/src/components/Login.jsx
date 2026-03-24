import { useState } from 'react';
import axios from 'axios';
import { t } from '../translations';

const API_URL = 'http://127.0.0.1:8000';

const Login = ({ setToken, lang, setLang }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
      const response = await axios.post(`${API_URL}/login`, params);
      setToken(response.data.access_token);
    } catch (err) {
      setError(t[lang].invalidCreds);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">

      {/* CHAP TOMON: Brending va Korporativ Xabar (Mobil qurilmalarda yashiriladi) */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        {/* Orqa fon uchun zamonaviy gradient effekti */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black opacity-90"></div>

        {/* Dekorativ geometrik shakl */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-1/4 -right-24 w-72 h-72 bg-slate-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-sm flex items-center justify-center text-2xl font-black mb-8 shadow-lg tracking-tighter">
            EP
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Enterprise-Grade <br/>
            <span className="text-blue-500">Retail Operations.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Streamline your point of sale, master data management, and business analytics in one unified, high-performance platform.
          </p>

          <div className="mt-12 flex gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>Secure</span>
            <span className="text-slate-700">•</span>
            <span>Scalable</span>
            <span className="text-slate-700">•</span>
            <span>Reliable</span>
          </div>
        </div>
      </div>

      {/* O'NG TOMON: Login Formasi */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 relative bg-white">

        {/* Tillar paneli (Yuqori o'ng burchakda, qat'iy uslubda) */}
        <div className="absolute top-8 right-8 flex border border-slate-200 rounded-sm overflow-hidden shadow-sm">
          <button onClick={() => setLang('uz')} className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${lang === 'uz' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>UZ</button>
          <button onClick={() => setLang('en')} className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors border-l border-slate-200 ${lang === 'en' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>EN</button>
          <button onClick={() => setLang('ru')} className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors border-l border-slate-200 ${lang === 'ru' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>RU</button>
        </div>

        {/* Form Konteyneri */}
        <div className="w-full max-w-sm">
          <div className="mb-10 text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{t[lang].authTitle}</h2>
            <p className="text-sm text-slate-500 font-medium">{t[lang].sysAccess}</p>
          </div>

          <form onSubmit={handleLogin}>
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm font-semibold flex items-center justify-between animate-fade-in">
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-wider">
                  {t[lang].username}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-wider">
                  {t[lang].password}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-8 w-full font-bold text-sm tracking-wide px-6 py-3.5 rounded-sm transition-all duration-200 ${
                loading 
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300' 
                  : 'bg-slate-900 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? 'Authenticating...' : t[lang].signIn}
            </button>
          </form>

          {/* Korporativ Footer qismi */}
          <div className="mt-12 pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Enterprise POS v1.0.0</span>
            <span>Authorized Personnel Only</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;