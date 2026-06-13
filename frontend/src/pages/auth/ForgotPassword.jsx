import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { Shield, KeyRound, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP & new pass
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccess('An OTP has been sent to your email.');
        setStep(2);
      } else {
        setError(res.data.message || 'Error sending OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      if (res.data.success) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(res.data.message || 'Error resetting password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-55 bg-slate-50 overflow-hidden px-4">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-orange-100/40 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl shadow-slate-100/60 rounded-xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mb-3">
            <KeyRound className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-1 font-sans">Indian Railways Credentials</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-250 border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@thermalportal.in"
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold text-sm rounded-lg py-2.5 transition mt-2 flex items-center justify-center gap-2 shadow-sm"
            >
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Verification OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 tracking-[5px] text-center font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                New Strong Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold text-sm rounded-lg py-2.5 transition mt-2 flex items-center justify-center gap-2 shadow-sm"
            >
              Update Password
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="text-xs text-blue-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
