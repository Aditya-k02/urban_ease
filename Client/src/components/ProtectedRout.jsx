import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export const ProtectedRoute = ({ allowedUserType }) => {
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    if (!token || !user) {
      toast.error("Please login to access this page");
    } else if (user.userType !== allowedUserType) {
      toast.warning("Unauthorized access — redirecting to your dashboard");
    }
  }, [token, user, allowedUserType, location]);

  if (!token) {
    return <Navigate to="/SignIn" replace />;
  }

  // If Community Manager without active subscription, force to subscription page
  if (
    user &&
    user.userType === "CommunityManager" &&
    user.subscriptionStatus &&
    user.subscriptionStatus !== "active"
  ) {
    const onSubscriptionPage = location.pathname.startsWith(
      "/manager/subscription"
    );
    if (!onSubscriptionPage) {
      return <Navigate to="/manager/subscription" replace />;
    }
  }

  // Structure setup is now optional - removed forced redirect

  // If Resident / Worker / Security without active subscription, show expiry page
  if (
    user &&
    ["Resident", "Worker", "Security"].includes(user.userType) &&
    user.subscriptionStatus &&
    user.subscriptionStatus !== "active"
  ) {
    const onExpiredPage = location.pathname === "/subscription-expired";
    if (!onExpiredPage) {
      return <Navigate to="/subscription-expired" replace />;
    }
  }

  if (user.userType !== allowedUserType) {
    if (user.userType === "CommunityManager")
      return <Navigate to="/manager/dashboard" replace />;
    if (user.userType === "Resident")
      return <Navigate to="/resident/dashboard" replace />;
    if (user.userType === "Worker")
      return <Navigate to="/worker/dashboard" replace />;
    if (user.userType === "Security")
      return <Navigate to="/security/dashboard" replace />;
  }

  return <Outlet />;
};