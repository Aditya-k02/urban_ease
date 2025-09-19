import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "../../assets/css/SignIn.css"; // Reuse SignIn styles
import logo from '../../imgs/Logo.png'; // Correct path from components/Onboarding

const API_BASE = "http://localhost:3000";

const OnboardingPayment = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);
    const [plans, setPlans] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState("standard");
    const [paying, setPaying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!token) {
            setErrorMsg("No onboarding token provided.");
            setLoading(false);
            return;
        }

        const fetchDetails = async () => {
            try {
                const res = await axios.get(`${API_BASE}/interest/onboarding/${token}`);
                if (res.data.success) {
                    setDetails(res.data.data);
                    setPlans(res.data.data.plans);
                }
            } catch (err) {
                console.error("Fetch onboarding details error:", err);
                setErrorMsg(err.response?.data?.message || "Invalid or expired link.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [token]);

    const handlePay = async () => {
        if (!plans) return;
        const planKey = selectedPlan;
        const plan = plans[planKey];
        if (!plan) return;

        setPaying(true);
        try {
            const res = await axios.post(`${API_BASE}/interest/onboarding/complete`, {
                token,
                paymentDetails: {
                    plan: planKey,
                    amount: plan.price,
                    duration: plan.duration,
                    method: "card",
                    date: new Date().toISOString()
                }
            });

            if (res.data.success) {
                setSuccess(true);
                toast.success("Account activated successfully!");
            }
        } catch (err) {
            console.error("Payment error:", err);
            toast.error(err.response?.data?.message || "Payment failed. Please try again.");
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="SignInCon">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="SignInCon">
                <div className="signin-container" style={{ height: 'auto', padding: '40px', justifyContent: 'center' }}>
                    <div className="text-center">
                        <h4 className="text-danger mb-3">Link Error</h4>
                        <p className="text-muted mb-4">{errorMsg}</p>
                        <button className="continue-btn" onClick={() => navigate('/')}>Go Home</button>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="SignInCon">
                <div className="signin-container" style={{ height: 'auto', padding: '40px', justifyContent: 'center' }}>
                    <div className="text-center">
                        <div className="mb-3 text-success" style={{ fontSize: "50px" }}>✅</div>
                        <h2 className="mb-3">Onboarding Complete!</h2>
                        <p className="subtitle mb-4">
                            Your account is active. We've sent credentials to <strong>{details?.email}</strong>.
                        </p>
                        <button className="continue-btn" onClick={() => navigate('/SignIn')}>Login Now</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="SignInCon">
            <div
                className="signin-container"
                style={{
                    maxWidth: '1100px',
                    height: 'auto',
                    minHeight: '600px',
                    overflow: 'visible'
                }}
            >
                {/* Left Panel - Branding */}
                <div className="left-panel">
                    <div className="logo">
                        <img src={logo} alt="URBAN EASE" height="30px" width="130px" />
                    </div>
                    <p className="tagline">
                        Welcome to UrbanEase. <br /> Let's set up your community workspace.
                    </p>
                </div>

                <div className="div1"></div>

                {/* Right Panel - Content */}
                <div className="right-panel" style={{ overflow: 'visible' }}>
                    <h2>Activate Account</h2>
                    <p className="subtitle">Welcome, {details?.firstName}. Choose a plan to start.</p>

                    {/* Plans Selection - Vertical Stack for better fit */}
                    <div className="d-flex flex-column gap-3 mb-4">
                        {plans && Object.entries(plans).map(([key, plan]) => (
                            <div
                                key={key}
                                className={`p-3 border rounded-3 cursor-pointer d-flex justify-content-between align-items-center ${selectedPlan === key ? 'border-primary bg-light' : ''}`}
                                style={{ cursor: 'pointer', transition: 'all 0.2s', border: selectedPlan === key ? '2px solid #3b44f0' : '1px solid #ddd' }}
                                onClick={() => setSelectedPlan(key)}
                            >
                                <div>
                                    <h6 className="fw-bold mb-1" style={{ color: selectedPlan === key ? '#3b44f0' : '#333' }}>{plan.name}</h6>
                                    <div className="small text-muted">
                                        {plan.features?.slice(0, 2).join(", ")}
                                        {plan.features?.length > 2 && "..."}
                                    </div>
                                </div>
                                <div className="text-end">
                                    <h5 className="mb-0 fw-bold">₹{plan.price.toLocaleString()}</h5>
                                    <small className="text-muted">/{plan.duration}</small>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="divider">Payment</div>

                    <div className="d-flex justify-content-between mb-3 align-items-center bg-light p-3 rounded">
                        <span className="text-muted">Total Payable</span>
                        <span className="fw-bold fs-5 text-success">₹{plans[selectedPlan]?.price.toLocaleString()}</span>
                    </div>

                    <button
                        className="continue-btn"
                        disabled={paying}
                        onClick={handlePay}
                    >
                        {paying ? "Processing..." : "Pay & Activate"}
                    </button>
                    <p className="text-center mt-3 text-muted small">
                        Secure connection via UrbanEase Payments
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPayment;
