import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const SubscriptionExpired = () => {
  return (
    <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow-sm p-4 text-center" style={{ maxWidth: "480px", width: "100%" }}>
        <h3 className="mb-3">Subscription Inactive</h3>
        <p className="text-muted mb-3">
          Your community's subscription is inactive or has expired.
        </p>
        <p className="mb-4">
          Please contact your Community Manager for further clarification or to
          renew the subscription. Until then, access to the application is
          restricted for residents, workers, and security staff.
        </p>
        <a href="/SignIn" className="btn btn-primary w-100">
          Back to Login
        </a>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
