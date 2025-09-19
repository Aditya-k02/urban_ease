import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "../../assets/css/Manager/Payments.css"; // reuse basic styling
import { setUser } from "../../Slices/authSlice";

const API_BASE =
  process.env.NODE_ENV === "production"
    ? `${window.location.origin}/manager`
    : "http://localhost:3000/manager";

export const Subscription = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("standard");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, plansRes] = await Promise.all([
          axios.get(`${API_BASE}/subscription-status`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/subscription-plans`, {
            withCredentials: true,
          }),
        ]);

        if (statusRes.data?.community) {
          setStatus(statusRes.data.community);
        }
        if (plansRes.data?.plans) {
          setPlans(plansRes.data.plans);
        }
      } catch (error) {
        console.error("Failed to load subscription data", error);
        toast.error(
          error?.response?.data?.message || "Failed to load subscription info"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // If already active, don't show this page; send to dashboard
  useEffect(() => {
    const effectiveStatus =
      status?.subscriptionStatus || user?.subscriptionStatus;
    if (effectiveStatus === "active") {
      navigate("/manager/dashboard", { replace: true });
    }
  }, [status, user, navigate]);

  const handlePay = async () => {
    if (!plans || !user?.community) return;
    const planKey = selectedPlan || "standard";
    const plan = plans[planKey];
    if (!plan) return;

    try {
      setPaying(true);
      const now = new Date();
      const res = await axios.post(
        `${API_BASE}/subscription-payment`,
        {
          communityId: user.community,
          subscriptionPlan: planKey,
          amount: plan.price,
          paymentMethod: "card",
          planDuration: plan.duration || "monthly",
          paymentDate: now.toISOString(),
        },
        { withCredentials: true }
      );

      toast.success("Subscription activated successfully");

      // Update local user state to active subscription
      dispatch(
        setUser({
          ...user,
          subscriptionStatus: res.data.subscriptionStatus || "active",
        })
      );

      navigate("/manager/dashboard", { replace: true });
    } catch (error) {
      console.error("Subscription payment error", error);
      toast.error(
        error?.response?.data?.message || "Failed to process subscription"
      );
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <span className="spinner-border" role="status" />
      </div>
    );
  }

  const currentStatus = status?.subscriptionStatus || user?.subscriptionStatus;
  const totalResidents = status?.totalMembers;

  return (
    <div className="container py-4">
      <h3 className="mb-3">Community Subscription</h3>
      <p className="text-muted mb-4">
        Complete your subscription to unlock all manager features.
      </p>

      <div className="mb-4">
        <h5>Current Status</h5>
        <p>
          Plan: <strong>{status?.subscriptionPlan || "Not subscribed"}</strong>
        </p>
        <p>
          Status: <strong>{currentStatus || "pending"}</strong>
        </p>
      </div>

      {plans && (
        <>
          <h5 className="mb-3">Choose a Plan</h5>
          <div className="row g-3 mb-4">
            {Object.entries(plans).map(([key, plan]) => (
              <div className="col-md-4" key={key}>
                <div
                  className={`card h-100 p-3 shadow-sm ${
                    selectedPlan === key ? "border-primary" : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    const max = plan.maxResidents;
                    if (
                      max &&
                      typeof max === "number" &&
                      typeof totalResidents === "number" &&
                      totalResidents > max
                    ) {
                      toast.warn(
                        `Cannot select ${plan.name}: community has ${totalResidents} residents, but this plan allows up to ${max}.`
                      );
                      return;
                    }
                    setSelectedPlan(key);
                  }}
                >
                  <h6 className="fw-semibold mb-1">{plan.name}</h6>
                  <p className="mb-1">₹{plan.price} / {plan.duration}</p>
                  {plan.maxResidents && (
                    <p className="mb-1 small text-muted">
                      Up to {plan.maxResidents} residents
                    </p>
                  )}
                  <ul className="small mb-0">
                    {plan.features?.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        className="btn btn-primary"
        disabled={paying}
        onClick={handlePay}
      >
        {paying ? "Processing..." : "Pay & Activate"}
      </button>
    </div>
  );
};

export default Subscription;
