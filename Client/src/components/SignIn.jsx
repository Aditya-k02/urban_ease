import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import '../assets/css/SignIn.css';
import logo from '../imgs/Logo.png';
import google from '../imgs/google.ico';
import facebook from '../imgs/facebook.png';
import showPass from '../imgs/showPass.svg';
import hidePass from '../imgs/hidePass.svg';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import { loginUser, verifyOtp } from '../Slices/authSlice.js';
import axios from 'axios';
import { Loader } from './Loader.jsx';

export const SignIn = () => {
  const dispatch = useDispatch();
  const { user, token, pending2fa, loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const otpRefs = useRef([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const initialTimer = 300; // 5 minutes
  const [secondsLeft, setSecondsLeft] = useState(initialTimer);
  const timerActive = useMemo(() => !!pending2fa && secondsLeft > 0, [pending2fa, secondsLeft]);

  useEffect(() => {
    if (!pending2fa) {
      setSecondsLeft(initialTimer);
      setOtp('');
      return;
    }
    setSecondsLeft((s) => (s === initialTimer ? initialTimer : s));
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [pending2fa]);

  useEffect(() => {
    setOtp(otpDigits.join(''));
  }, [otpDigits]);

  useEffect(() => {
    if (pending2fa) {
      setOtpDigits(Array(6).fill(''));
      setTimeout(() => otpRefs.current?.[0]?.focus(), 0);
    }
  }, [pending2fa]);

  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [secondsLeft]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      if (!value.trim()) error = 'Email is required';
      else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value))
        error = 'Enter a valid email';
      setErrors(prev => ({ ...prev, email: error }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim())
      newErrors.email = 'Email is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email))
      newErrors.email = 'Enter a valid email';
    if (!formData.password.trim())
      newErrors.password = 'Password is required';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (!formData.userType)
      newErrors.userType = 'Please select your role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') validateField(name, value);

  };

  const handleSubmit = async (e) => {
    e.preventDefault();



    if (!validateForm()) {
      setAlertMessage({ type: 'error', text: 'Please fix the errors above' });
      return;
    }
    setIsSendingEmail(true);
    dispatch(loginUser(formData))
      .unwrap()
      .then((response) => {
        if (response?.requiresOtp) {
          toast.info("OTP sent to your email");
          setSecondsLeft(initialTimer);
          return;
        }
        toast.success("Logged in successfully");
        if (formData.userType === 'communityManager') {
          const subStatus = response?.user?.subscriptionStatus;
          if (subStatus && subStatus !== 'active') {
            navigate('/manager/subscription');
          } else {
            navigate('/manager/dashboard');
          }
        } else if (formData.userType === 'Resident') {
          navigate('/resident/dashboard')
        } else if (formData.userType === 'Worker') {
          navigate('/worker/dashboard')
        } else if (formData.userType === 'Security') {
          navigate('/security/dashboard')
        }
      })
      .catch((err) => {
        toast.error(err || "Something went wrong");
      })
      .finally(() => setIsSendingEmail(false));

  };

  const submitOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    try {
      const result = await dispatch(
        verifyOtp({ otp, tempToken: pending2fa?.tempToken })
      ).unwrap();
      toast.success('OTP verified');

      const loggedInUser = result?.user;
      const role = loggedInUser?.userType || pending2fa?.userType;

      if (role === 'communityManager' || role === 'CommunityManager') {
        const subStatus = loggedInUser?.subscriptionStatus;
        if (subStatus && subStatus !== 'active') {
          navigate('/manager/subscription');
        } else {
          navigate('/manager/dashboard');
        }
      } else if (role === 'Resident') {
        navigate('/resident/dashboard');
      } else if (role === 'Worker') {
        navigate('/worker/dashboard');
      } else if (role === 'Security') {
        navigate('/security/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err || 'Verification failed');
    }
  };

  const resend = async () => {
    if (!pending2fa?.tempToken) return;
    try {
      setIsResending(true);
      await axios.post('http://localhost:3000/resend-otp', { tempToken: pending2fa.tempToken }, { withCredentials: true });
      toast.success('OTP resent');
      setSecondsLeft(initialTimer);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleOtpChange = (index) => (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = val ? val[0] : '';
      return next;
    });
    if (val && index < 5) {
      otpRefs.current?.[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index) => (e) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        otpRefs.current?.[index - 1]?.focus();
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current?.[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current?.[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text');
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    if (!digits.length) return;
    e.preventDefault();
    const next = Array(6).fill('');
    for (let i = 0; i < digits.length; i++) next[i] = digits[i];
    setOtpDigits(next);
    const focusIndex = Math.min(digits.length, 5);
    setTimeout(() => otpRefs.current?.[focusIndex]?.focus(), 0);
  };

  return (
    <div className='SignInCon'>
      {(isSendingEmail || isResending) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, flexDirection: 'column' }}>
          <Loader />
          <div style={{ marginTop: 12, color: '#333', fontWeight: 500 }}>{isResending ? 'Resending OTP…' : 'Sending OTP…'}</div>
        </div>
      )}
      <ToastContainer />
      {alertMessage && (
        <div className={`alert ${alertMessage.type}`}>
          {alertMessage.text}
        </div>
      )}
      <div className="signin-container">
        <div className="left-panel">
          <div className="logo">
            <img src={logo} alt="URBAN EASE" height="30px" width="130px" />
          </div>
          <p className="tagline">
            Community is built on care and trust. We're here to keep your community safe, clean, and thriving.
          </p>
        </div>
        <div className="div1"></div>
        <div className="right-panel">
          {!pending2fa ? (
            <>
              <h2>Login Now!</h2>
              <p className="subtitle">Enter your information to login</p>
              <div className="social-buttons">
                <button className="social-btn google">
                  <img src={google} alt="Google Icon" />
                  Google
                </button>
                <button className="social-btn facebook">
                  <img src={facebook} alt="Facebook Icon" />
                  Facebook
                </button>
              </div>
              <div className="divider">or</div>
              <form id="LoginForm" onSubmit={handleSubmit}>
                {errors.email && <p className="error-text">{errors.email}</p>}
                <input
                  type="email"
                  name="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                />
                <div className="password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <img
                    src={showPassword ? showPass : hidePass}
                    alt="Toggle Password Visibility"
                    height="20px"
                    width="40px"
                    onClick={togglePasswordVisibility}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                {errors.password && <p className="error-text">{errors.password}</p>}
                <select
                  name="userType"
                  className={`input ${errors.userType ? 'input-error' : ''}`}
                  value={formData.userType}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select your role</option>
                  <option value="Resident">Resident</option>
                  <option value="Security">Security</option>
                  <option value="Worker">Worker</option>
                  <option value="communityManager">Community Manager</option>
                </select>
                {errors.userType && <p className="error-text">{errors.userType}</p>}
                <button type="submit" className="continue-btn">Login</button>
              </form>
              <div style={{ textAlign: 'right', marginTop: '5px' }}>
                <NavLink to="/interestForm" className="login-link">
                  New? Register here
                </NavLink>
              </div>
            </>
          ) : (
            <>
              <h2>Enter OTP</h2>
              <p className="subtitle">We sent a code to <strong>{pending2fa.email}</strong></p>
              <div className="divider">OTP Verification</div>
              <form onSubmit={submitOtp}>
                <div
                  className="otp-inputs"
                  onPaste={handleOtpPaste}
                  style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}
                >
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={d}
                      onChange={handleOtpChange(i)}
                      onKeyDown={handleOtpKeyDown(i)}
                      ref={(el) => (otpRefs.current[i] = el)}
                      onFocus={(e) => e.target.select()}
                      style={{ width: 40, height: 48, textAlign: 'center', fontSize: '1.25rem', borderRadius: 6, border: '1px solid #ccc' }}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ color: '#666' }}>Time left: <strong>{mmss}</strong></span>
                  <button type="button" className="login-link" onClick={resend} disabled={timerActive} style={{ background: 'transparent', border: 'none', color: timerActive ? '#aaa' : '#0d6efd', cursor: timerActive ? 'not-allowed' : 'pointer' }}>
                    Resend OTP
                  </button>
                </div>
                <button type="submit" className="continue-btn" disabled={!otp || otp.length !== 6 || secondsLeft === 0 || loading} style={{ marginTop: 12 }}>
                  {loading ? 'Verifying…' : secondsLeft === 0 ? 'OTP expired' : 'Verify'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     userType: '',
//   });
//   const [alertMessage, setAlertMessage] = useState(null);
//   const [showPassword, setShowPassword] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prevData => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setAlertMessage({ type: 'success', text: 'Logging in...' });
//     console.log('Login attempt with:', formData);
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(prev => !prev);
//   };

//   return (
//     <div className='SignInCon'>
//       {alertMessage && (
//         <div className={`alert ${alertMessage.type}`}>
//           {alertMessage.text}
//         </div>
//       )}

//       <div className="signin-container">
//         <div className="left-panel">
//           <div className="logo">
//             <img src={logo} alt="URBAN EASE" height="30px" width="130px" />
//           </div>
//           <p className="tagline">
//             Community is built on care and trust. We're here to keep your community safe, clean, and thriving.
//           </p>
//         </div>

//         <div className="div1"></div>

//         <div className="right-panel">
//           <h2>Login Now!</h2>
//           <p className="subtitle">Enter your information to login</p>

//           <div className="social-buttons">
//             <button className="social-btn google">
//               <img src={google} alt="Google Icon" />
//               Google
//             </button>
//             <button className="social-btn facebook">
//               <img src={facebook} alt="Facebook Icon" />
//               Facebook
//             </button>
//           </div>

//           <div className="divider">or</div>

//           <form id="LoginForm" onSubmit={handleSubmit}>
//             <input
//               type="email"
//               name="email"
//               id="email"
//               className="input"
//               placeholder="Email Address"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />

//             <div className="password-wrap">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 className='input'
//                 name="password"
//                 id="password"
//                 placeholder="Password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 required
//               />
//               <img
//                 src={showPassword ? showPass : hidePass}
//                 id="img"
//                 alt="Toggle Password Visibility"
//                 height="20px"
//                 width="40px"
//                 onClick={togglePasswordVisibility}
//                 style={{ cursor: 'pointer' }}
//               />
//             </div>

//             <select
//               name="userType"
//               id="userType"
//               className="input"
//               value={formData.userType}
//               onChange={handleChange}
//               required
//             >
//               <option value="" disabled>Select your role</option>
//               <option value="Resident">Resident</option>
//               <option value="Security">Security</option>
//               <option value="Worker">Worker</option>
//               <option value="communityManager">Community Manager</option>
//             </select>

//             <button type="submit" className="continue-btn">Login</button>
//           </form>

//           <div style={{ textAlign: 'right', marginTop: '5px' }}>
//             <NavLink to="/interestForm" className="login-link">
//               New? Register here
//             </NavLink>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
