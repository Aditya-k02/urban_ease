import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import '../../assets/css/InterestForm.css';

export const ResidentRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    residentFirstname: "",
    residentLastname: "",
    uCode: "",
    contact: "",
    email: "",
    communityCode: "",
    otp: "",
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0); // seconds remaining for resend
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    const timeout = type === 'success' ? 8000 : 6000;
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), timeout);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const requestOtp = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/resident-register/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('OTP sent to email', 'success');
        setStep(2);
        setOtpCountdown(60); // start 60s timer for resend
      } else {
        showAlert(data.message || 'Failed to send OTP', 'error');
      }
    } catch (e) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/resident-register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('OTP verified', 'success');
        setStep(3);
      } else {
        showAlert(data.message || 'Invalid OTP', 'error');
      }
    } catch (e) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/resident-register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          residentFirstname: form.residentFirstname,
          residentLastname: form.residentLastname,
          uCode: form.uCode,
          contact: form.contact,
          email: form.email,
          communityCode: form.communityCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Registration completed', 'success');
        // Redirect to login after brief delay to show toast
        setTimeout(() => {
          navigate('/SignIn');
        }, 1200);
      } else {
        showAlert(data.message || 'Failed to register', 'error');
      }
    } catch (e) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  // Countdown effect for OTP resend or button state
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setInterval(() => {
      setOtpCountdown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [otpCountdown]);

  return (
    <div className="interestFormCon">
      <div className="container">
        {alert.show && (
          <div 
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              maxWidth: '500px',
              width: '90%',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: alert.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              border: alert.type === 'success' ? '1px solid #059669' : '1px solid #dc2626',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: 1 }}>{alert.message}</div>
            <button 
              onClick={() => setAlert({ show: false, message: '', type: '' })}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                marginLeft: '10px',
                padding: '4px 8px',
                borderRadius: '4px',
                lineHeight: '1',
                minWidth: '28px',
                height: '28px'
              }}
            >
              ×
            </button>
          </div>
        )}
        <div className="header">
          <h2>Resident Registration</h2>
          <p className="subtitle">Join your community with secure verification</p>
        </div>

        <div className="form-content">
          {/* Left panel: Email + OTP steps */}
          <div className="form-panel">
            <h3 className="form-section-title">Verification</h3>
            {step === 1 && (
              <div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input id="email" name="email" type="email" value={form.email} onChange={onChange} />
                </div>
                <button className="btn btn-primary" disabled={loading || !form.email || otpCountdown > 0} onClick={requestOtp}>
                  {loading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <span className="spinner" style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', marginRight: 8, animation: 'spin 0.8s linear infinite' }} />
                      Sending...
                    </span>
                  ) : otpCountdown > 0 ? (
                    `Resend in ${otpCountdown}s`
                  ) : (
                    'Request OTP'
                  )}
                </button>
                {/* simple spinner keyframes */}
                <style>
                  {`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}
                </style>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="form-group">
                  <label htmlFor="otp">Enter OTP *</label>
                  <input id="otp" name="otp" value={form.otp} onChange={onChange} />
                </div>
                <button className="btn btn-primary" disabled={loading || !form.otp} onClick={verifyOtp}>Verify OTP</button>
              </div>
            )}
          </div>

          {/* Right panel: Details */}
          <div className="form-panel">
            <h3 className="form-section-title">Personal & Community Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="residentFirstname">First Name *</label>
                <input id="residentFirstname" name="residentFirstname" value={form.residentFirstname} onChange={onChange} />
              </div>
              <div className="form-group">
                <label htmlFor="residentLastname">Last Name *</label>
                <input id="residentLastname" name="residentLastname" value={form.residentLastname} onChange={onChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="uCode">Unit Code (e.g., BLK-101) *</label>
                <input id="uCode" name="uCode" value={form.uCode} onChange={onChange} />
              </div>
              <div className="form-group">
                <label htmlFor="contact">Contact</label>
                <input id="contact" name="contact" value={form.contact} onChange={onChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="communityCode">Community Code *</label>
                <input id="communityCode" name="communityCode" value={form.communityCode} onChange={onChange} />
              </div>
            </div>
            <button className="btn btn-success mt-2" disabled={loading || step < 2} onClick={completeRegistration}>Complete Registration</button>
          </div>
        </div>
      </div>
    </div>
  );
};
