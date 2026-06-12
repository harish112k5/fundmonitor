import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HelmetIcon, ConstructionSVG } from '../components/CivilIcons';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineOfficeBuilding
} from 'react-icons/hi';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '6' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password, parseInt(form.role_id));
        toast.success('Account created! Awaiting admin approval before you can login.');
        setIsRegister(false);
        setForm({ name: '', email: '', password: '', role_id: '4' });
      } else {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      }
    } catch (err) {
      const status = err.response?.status;
      const data   = err.response?.data;
      // Backend always sends { success: false, message: '...' }
      const msg    = data?.message || err.message || 'Authentication failed';
      const code   = data?.code || data?.error;

      if (code === 'ACCOUNT_BLOCKED') {
        toast.error('🚫 Account suspended. Contact your administrator.');
      } else if (code === 'PENDING_APPROVAL') {
        toast.error('⏳ Account pending admin approval. Please wait.');
      } else if (status === 401) {
        toast.error('Invalid email or password. Please try again.');
      } else if (status === 400) {
        // Validation error from Joi — show the clean message from backend
        toast.error(msg);
      } else if (status === 429) {
        toast.error('Too many attempts. Please wait 15 minutes and try again.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left side — form */}
      <div className="login-container">
        <div className="login-card">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <HelmetIcon size={48} />
            </div>
            <h1>FINFRA</h1>
            <p>Financial Infrastructure System</p>
          </div>

          {/* Title */}
          <div className="login-title">
            <h2>{isRegister ? 'CREATE ACCOUNT' : 'SIGN IN TO SITE'}</h2>
            <p>{isRegister ? 'Register to get started' : 'Enter your credentials to access the command center'}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {isRegister && (
              <div className="login-field">
                <div className="login-field-icon"><HiOutlineUser /></div>
                <input
                  type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="Full Name" required className="login-input"
                />
              </div>
            )}

            <div className="login-field">
              <div className="login-field-icon"><HiOutlineMail /></div>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="Email Address" required className="login-input"
              />
            </div>

            <div className="login-field">
              <div className="login-field-icon"><HiOutlineLockClosed /></div>
              <input
                type={showPassword ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange}
                placeholder="Password" required className="login-input"
              />
              <button type="button" className="login-eye" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>

            {isRegister && (
              <div className="login-field">
                <div className="login-field-icon"><HiOutlineOfficeBuilding /></div>
                <select name="role_id" value={form.role_id} onChange={handleChange} className="login-input login-select">
                  <option value="2">Manager</option>
                  <option value="3">Engineer</option>
                  <option value="4">Accountant</option>
                  <option value="5">Supervisor</option>
                  <option value="6">Viewer</option>
                </select>
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                isRegister ? 'CREATE ACCOUNT' : 'ACCESS COMMAND CENTER'
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="login-toggle">
            <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
            <button onClick={() => { setIsRegister(!isRegister); setForm({ name: '', email: '', password: '', role_id: '6' }); }}>
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p>Construction Project Monitoring System © {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>

      {/* Right side — Construction illustration */}
      <div className="login-illustration">
        <ConstructionSVG />
      </div>
    </div>
  );
}
