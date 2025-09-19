import React, { useState } from "react";
import { adminLogin } from "../services/adminService";
import { useAdminAuth } from "../context/AdminAuthContext"; // ✅ fixed path (Context ➜ context)

const AdminLogin = () => {
  const { login } = useAdminAuth() || {}; // ✅ prevents destructure crash if undefined
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email) newErrors.email = "Please enter a valid email";
    if (!formData.password) newErrors.password = "Please enter your password";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const data = await adminLogin(formData.email, formData.password);

    if (data.success) {
      if (login) {
        login({ email: formData.email });
      } else {
        // fallback in case context not wrapped yet
        localStorage.setItem("adminSession", JSON.stringify({ email: formData.email }));
      }
      window.location.href = data.redirect || "/admin/dashboard";
    } else {
      setErrors({ password: data.message || "Invalid credentials" });
    }

    setLoading(false);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white rounded-4 shadow"
        style={{ width: "320px" }}
      >
        <h4 className="text-center mb-4 fw-bold text-dark">Admin Login</h4>

        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            placeholder="admin@example.com"
          />
          {errors.email && <div className="text-danger">{errors.email}</div>}
        </div>

        <div className="mb-3 position-relative">
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
          <i
            className={`bi ${
              showPassword ? "bi-eye-slash" : "bi-eye"
            } position-absolute end-0 top-50 me-3 text-secondary`}
            style={{ cursor: "pointer" }}
            onClick={() => setShowPassword(!showPassword)}
          ></i>
          {errors.password && <div className="text-danger">{errors.password}</div>}
        </div>

        <button type="submit" className="btn btn-dark w-100 mt-3" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
