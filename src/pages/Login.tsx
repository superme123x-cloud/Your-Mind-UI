import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Sparkles } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'حدث خطأ، جرب تاني';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-glow/5 rounded-full blur-3xl" />

      <div className="glass-card p-10 w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center mb-4 shadow-glow">
            <Sparkles size={32} className="text-bg-dark" />
          </div>
          <h1 className="text-3xl font-bold text-white">Life OS</h1>
          <p className="text-gray-400 mt-2 text-sm">نظامك الشخصي للإنتاجية</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full px-4 py-3 bg-bg-dark border border-border-teal rounded-xl text-white placeholder-gray-600 focus:border-accent transition-colors"
              placeholder="ahmed"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">كلمة السر</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isRegister ? 8 : 1}
              className="w-full px-4 py-3 bg-bg-dark border border-border-teal rounded-xl text-white placeholder-gray-600 focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent-glow text-bg-dark font-bold rounded-xl flex items-center justify-center gap-2 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              'جاري...'
            ) : isRegister ? (
              <>
                <UserPlus size={20} />
                إنشاء حساب
              </>
            ) : (
              <>
                <LogIn size={20} />
                تسجيل دخول
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-sm text-gray-400 hover:text-accent transition-colors"
          >
            {isRegister ? 'عندك حساب؟ سجل دخول' : 'معندكش حساب؟ اعمل واحد جديد'}
          </button>
        </div>
      </div>
    </div>
  );
}