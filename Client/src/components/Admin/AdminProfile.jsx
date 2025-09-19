import React, { useState, useEffect } from "react";
import Header from "./Header";

export default function AdminProfile() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [originalData, setOriginalData] = useState({
    name: "",
    email: "",
    image: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("/default-profile.png");

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? `${window.location.origin}/admin/api`
      : "http://localhost:3000/admin/api";

  // ===== Fetch Admin Profile =====
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/profile`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json && json.admin) {
          const { name, email, image } = json.admin;
          setFormData({ name, email });
          setOriginalData({ name, email, image: image || "" });
          if (image) setPreviewUrl(image);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setErrorMsg("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ===== Input Handlers =====
  const handleProfileChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ===== Detect if any change made =====
  const isFormChanged = () => {
    const imageChanged = profileImage !== null;
    return (
      formData.name !== originalData.name ||
      formData.email !== originalData.email ||
      imageChanged
    );
  };

  // ===== Save Profile (API) =====
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      if (profileImage) formDataToSend.append("image", profileImage);

      const res = await fetch(`${API_BASE_URL}/profile/update`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
        body: formDataToSend,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Update failed");

      setSuccessMsg("Profile updated successfully!");
      if (json.admin.image) setPreviewUrl(json.admin.image);

      // Reset original data to latest saved version
      setOriginalData({
        name: formData.name,
        email: formData.email,
        image: json.admin.image || originalData.image,
      });
      setProfileImage(null);
    } catch (err) {
      console.error("Profile update error:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== Change Password (API) =====
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setErrorMsg("");
    setSuccessMsg("");

    if (passwordData.new !== passwordData.confirm) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/profile/change-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to change password");

      setSuccessMsg("Password updated successfully!");
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (err) {
      console.error("Password change error:", err);
      setErrorMsg(err.message);
    }
  };

  return (
    <>
      {/* ===== Header ===== */}
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 100 }}
      >
        <Header title="Profile Management" />
      </div>

      <div className="container-fluid px-4 pb-5">
        <div className="row g-4">
          {/* ===== Left: Profile Info ===== */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-person-circle me-2 text-danger"></i>
                Profile Information
              </h5>

              <div className="text-center mb-4">
                <label htmlFor="imageUpload" style={{ cursor: "pointer" }}>
                  <div
                    className="rounded-circle overflow-hidden mx-auto position-relative"
                    style={{
                      width: "120px",
                      height: "120px",
                      border: "3px solid #dc2626",
                    }}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Profile"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <i
                        className="bi bi-person-fill"
                        style={{
                          fontSize: "4rem",
                          color: "#ccc",
                          lineHeight: "120px",
                        }}
                      ></i>
                    )}
                  </div>
                </label>
                <input
                  type="file"
                  id="imageUpload"
                  className="d-none"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    name="name"
                    value={formData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input
                    type="email"
                    className="form-control rounded-3"
                    name="email"
                    value={formData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                {successMsg && (
                  <div className="alert alert-success py-2">{successMsg}</div>
                )}
                {errorMsg && (
                  <div className="alert alert-danger py-2">{errorMsg}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isFormChanged()}
                  className="btn btn-danger w-100 rounded-3 fw-semibold py-2 mt-3"
                >
                  {loading ? (
                    <span>
                      <i className="bi bi-hourglass-split me-2"></i>Saving...
                    </span>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i>
                      {isFormChanged() ? "Save Changes" : "No Changes"}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ===== Right: Change Password ===== */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-shield-lock-fill text-danger me-2"></i>
                Change Password
              </h5>

              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="form-control rounded-3"
                    name="current"
                    placeholder="Enter current password"
                    value={passwordData.current}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">New Password</label>
                  <input
                    type="password"
                    className="form-control rounded-3"
                    name="new"
                    placeholder="Enter new password"
                    value={passwordData.new}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className={`form-control rounded-3 ${
                      errors.confirm ? "is-invalid" : ""
                    }`}
                    name="confirm"
                    placeholder="Confirm new password"
                    value={passwordData.confirm}
                    onChange={handlePasswordChange}
                  />
                  {errors.confirm && (
                    <div className="invalid-feedback">{errors.confirm}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-danger w-100 rounded-3 fw-semibold py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <i className="bi bi-hourglass-split me-2"></i>Updating...
                    </span>
                  ) : (
                    <>
                      <i className="bi bi-key-fill me-2"></i>Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
