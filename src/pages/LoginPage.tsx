import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Sparkles, Users, Zap } from 'lucide-react';
import { jwtDecode } from '@/utils/jwt';

export function LoginPage() {
  const { setUser } = useStore();
  const navigate = useNavigate();

  const handleSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      const decoded = jwtDecode(credentialResponse.credential);
      setUser({
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25"
          >
            <LayoutDashboard className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Daily Standup</h1>
          <p className="text-slate-500 text-sm">
            Your team's daily progress, beautifully organized
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-6 text-center">
            Sign in to continue
          </h2>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.log('Login Failed')}
              shape="rectangular"
              size="large"
              width={300}
              text="signin_with"
            />
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-3">
              <Feature icon={<Sparkles className="w-4 h-4" />} label="Beautiful UI" />
              <Feature icon={<Users className="w-4 h-4" />} label="Team Sync" />
              <Feature icon={<Zap className="w-4 h-4" />} label="Real-time" />
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Built for productive teams
        </p>
      </motion.div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2">
      <div className="text-indigo-500">{icon}</div>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
