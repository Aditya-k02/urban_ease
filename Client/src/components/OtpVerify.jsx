import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { verifyOtp } from '../Slices/authSlice';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OtpVerify = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pending2fa, loading } = useSelector((s) => s.auth);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!pending2fa) {
      // If no pending 2FA, go back to login
      navigate('/SignIn');
    }
  }, [pending2fa, navigate]);

  if (!pending2fa) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    try {
      await dispatch(verifyOtp({ otp, tempToken: pending2fa.tempToken })).unwrap();
      toast.success('OTP verified');
      // Redirect based on selected userType during login
      const role = pending2fa.userType;
      if (role === 'communityManager') navigate('/manager/dashboard');
      else if (role === 'Resident') navigate('/resident/dashboard');
      else if (role === 'Worker') navigate('/worker/dashboard');
      else if (role === 'Security') navigate('/security/dashboard');
      else navigate('/');
    } catch (err) {
      toast.error(err || 'Verification failed');
    }
  };

  return (
    <div className="SignInCon" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <ToastContainer />
      <form onSubmit={onSubmit} style={{ background:'#fff', padding:24, borderRadius:12, boxShadow:'0 6px 24px rgba(0,0,0,0.08)', minWidth:320 }}>
        <h3 style={{ marginBottom:8 }}>Two-Factor Verification</h3>
        <p style={{ marginTop:0, color:'#666' }}>We sent a 6-digit code to <strong>{pending2fa.email}</strong></p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter OTP"
          style={{ width:'100%', padding:'12px 14px', fontSize:16, border:'1px solid #ddd', borderRadius:8, marginTop:12 }}
        />
        <button type="submit" disabled={loading} style={{ width:'100%', marginTop:16, padding:'12px 14px', borderRadius:8, background:'#0d6efd', color:'#fff', border:'none', fontWeight:600 }}>
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>
    </div>
  );
};

export default OtpVerify;
