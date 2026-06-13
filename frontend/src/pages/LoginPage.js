import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { HelmetIcon } from '../components/CivilIcons';
import HeroBackground from '../components/HeroBackground';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineOfficeBuilding,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '6' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password, parseInt(form.role_id));
        setSuccessMsg('Account created! Awaiting admin approval.');
        setIsRegister(false);
        setForm({ name: '', email: '', password: '', role_id: '4' });
      } else {
        await login(form.email, form.password);
        navigate('/');
      }
    } catch (err) {
      const status = err.response?.status;
      const data   = err.response?.data;
      const msg    = data?.message || err.message || 'Authentication failed';
      const code   = data?.code || data?.error;

      if (code === 'ACCOUNT_BLOCKED') {
        setErrorMsg('🚫 Account suspended. Contact your administrator.');
      } else if (code === 'PENDING_APPROVAL') {
        setErrorMsg('⏳ Account pending admin approval. Please wait.');
      } else if (status === 401) {
        setErrorMsg('Invalid email or password. Please try again.');
      } else if (status === 429) {
        setErrorMsg('Too many attempts. Please wait 15 minutes.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left side — form panel */}
      <div className="login-container blueprint-bg" style={{ backgroundColor: 'var(--bg-page)' }}>
        <motion.div 
          className="login-card"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Brand */}
          <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--accent)', marginBottom: '12px' }}>
              <HelmetIcon size={40} />
            </div>
            <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '28px', color: 'var(--accent)', letterSpacing: '3px', margin: 0 }}>
              BUILDMANAGER
            </h1>
            <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', margin: '4px 0 0 0' }}>
              Construction Project Intelligence
            </p>
          </div>

          {/* Headline Animation */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
              {!isRegister ? (
                <TypeAnimation
                  sequence={[
                    'SITE COMMAND CENTER',
                    2000,
                    'FINANCIAL INTELLIGENCE',
                    2000,
                  ]}
                  wrapper="h2"
                  speed={50}
                  repeat={Infinity}
                  className="text-gradient"
                  style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '32px', margin: 0, letterSpacing: '1px' }}
                />
              ) : (
                <h2 className="text-gradient" style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '32px', margin: 0, letterSpacing: '1px' }}>
                  NEW RECRUIT REGISTRATION
                </h2>
              )}
            </div>
            <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 0 0' }}>
              {isRegister ? 'Register your personnel profile' : 'Enter your credentials to access the platform'}
            </p>
          </div>

          {/* Error / Success States */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -12, height: 0 }}
                style={{
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflow: 'hidden'
                }}
              >
                <HiOutlineExclamationCircle style={{ color: '#EF4444', flexShrink: 0, fontSize: '18px' }} />
                <span style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '13px', color: '#EF4444' }}>{errorMsg}</span>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -12, height: 0 }}
                style={{
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflow: 'hidden'
                }}
              >
                <span style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '13px', color: '#10B981' }}>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {isRegister && (
              <motion.div whileFocus={{ scale: 1.01 }} className="login-field">
                <div className="login-field-icon"><HiOutlineUser /></div>
                <input
                  type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="Full Name" required className="login-input"
                  style={{ padding: '12px 14px 12px 40px', borderRadius: 'var(--radius-md)' }}
                />
              </motion.div>
            )}

            <motion.div whileFocus={{ scale: 1.01 }} className="login-field">
              <div className="login-field-icon"><HiOutlineMail /></div>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="admin@company.com" required className="login-input"
                style={{ padding: '12px 14px 12px 40px', borderRadius: 'var(--radius-md)' }}
              />
            </motion.div>

            <motion.div whileFocus={{ scale: 1.01 }} className="login-field">
              <div className="login-field-icon"><HiOutlineLockClosed /></div>
              <input
                type={showPassword ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange}
                placeholder="Password" required className="login-input"
                style={{ padding: '12px 14px 12px 40px', borderRadius: 'var(--radius-md)' }}
              />
              <button type="button" className="login-eye" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </motion.div>

            {isRegister && (
              <motion.div whileFocus={{ scale: 1.01 }} className="login-field">
                <div className="login-field-icon"><HiOutlineOfficeBuilding /></div>
                <select name="role_id" value={form.role_id} onChange={handleChange} className="login-input login-select" style={{ padding: '12px 14px 12px 40px', borderRadius: 'var(--radius-md)' }}>
                  <option value="2">Manager</option>
                  <option value="3">Engineer</option>
                  <option value="4">Accountant</option>
                  <option value="5">Supervisor</option>
                  <option value="6">Viewer</option>
                </select>
              </motion.div>
            )}

            <motion.button 
              type="submit" 
              disabled={loading}
              whileHover={{ scale: 1.02, backgroundColor: "#D97706" }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{
                width: '100%',
                backgroundColor: 'var(--accent)',
                color: '#0A0A0F',
                fontFamily: 'Rajdhani',
                fontWeight: 700,
                fontSize: '15px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '8px'
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderTopColor: '#0A0A0F' }} />
              ) : (
                isRegister ? 'SUBMIT REGISTRATION' : 'SIGN IN'
              )}
            </motion.button>
          </form>

          {/* Toggle */}
          <div className="login-toggle" style={{ marginTop: '32px' }}>
            <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
            <button onClick={() => { setIsRegister(!isRegister); setForm({ name: '', email: '', password: '', role_id: '6' }); setErrorMsg(''); setSuccessMsg(''); }}>
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Right side — illustration panel */}
      <div style={{
        width: '50%',
        backgroundColor: '#080810',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          {/* We use HeroBackground and scale it up slightly for the login view */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.8, transform: 'scale(1.5) translateY(20%)' }}>
            <HeroBackground />
          </div>
        </div>
        
        {/* Amber gradient overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to top, #080810 0%, transparent 100%)',
          zIndex: 1
        }}></div>

        {/* Brand Text over overlay */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '0',
          width: '100%',
          textAlign: 'center',
          zIndex: 2
        }}>
          <h2 className="text-gradient" style={{ fontFamily: 'Rajdhani', fontWeight: 900, fontSize: '36px', margin: '0 0 8px 0', letterSpacing: '4px' }}>
            BUILDMANAGER
          </h2>
          <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '11px', color: 'var(--text-muted)', margin: 0, letterSpacing: '3px', textTransform: 'uppercase' }}>
            CONSTRUCTION PROJECT INTELLIGENCE
          </p>
        </div>
      </div>
    </div>
  );
}
