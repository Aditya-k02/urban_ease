import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Camera,
  Edit3,
  User,
  MapPin,
  Building2,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

export const ResidentProfile = () => {
  const [displayData, setDisplayData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contact: "",
    uCode: "",
    communityName: "",
    image: "",
  });

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contact: "",
    uCode: "",
    communityName: "",
    image: "",
  });

  const [isPassword, setIspassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    caseMix: false,
    numberSpecial: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);

  // ------------------------------------------------
  // Fetch Profile
  // ------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("http://localhost:3000/resident/profile", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          const fetched = {
            firstname: data.resident.firstname || "",
            lastname: data.resident.lastname || "",
            email: data.resident.email || "",
            contact: data.resident.contact || "",
            uCode: data.resident.uCode || "",
            communityName: data.resident.communityName || "",
            image: data.resident.image || "",
          };

          setDisplayData(fetched);
          setFormData(fetched);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    }

    loadProfile();
  }, []);

  // ------------------------------------------------
  // Handle Updates
  // ------------------------------------------------
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    if (
      !passwordValidation.minLength ||
      !passwordValidation.caseMix ||
      !passwordValidation.numberSpecial
    ) {
      alert("Password does not meet security requirements.");
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:3000/resident/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await res.json();

      if (!data.success && !data.ok) {
        alert(data.message || "Password update failed.");
        return;
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordValidation({
        minLength: false,
        caseMix: false,
        numberSpecial: false,
      });

      alert("Password updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating password.");
    }
  };

  const handleSaveProfile = async () => {
    try {
      const form = new FormData();

      form.append("firstName", formData.firstname);
      form.append("lastName", formData.lastname);
      form.append("contact", formData.contact);
      form.append("email", formData.email);
      form.append("uCode", formData.uCode);

      if (selectedImage) {
        form.append("image", selectedImage);
      }

      // only if image upload exists later
      // form.append("image", selectedFile);

      const res = await fetch("http://localhost:3000/resident/profile", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Update failed");
        return;
      }

      setDisplayData(formData);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  };

  // ------------------------------------------------
  // Password Validation
  // ------------------------------------------------
  const handlePasswordInput = (e) => {
    const { id, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [id]: value,
    }));

    // Run validation only for new password
    if (id === "newPassword") {
      setPasswordValidation({
        minLength: value.length >= 8,
        caseMix: /^(?=.*[a-z])(?=.*[A-Z])/.test(value),
        numberSpecial: /^(?=.*[0-9!@#$%^&*])/.test(value),
      });
    }
  };

  // ------------------------------------------------
  // Initials
  // ------------------------------------------------
  const initials =
    displayData.firstname && displayData.lastname
      ? `${displayData.firstname[0]}${displayData.lastname[0]}`.toUpperCase()
      : "?";

  return (
    <>
      {/* TOP PROFILE CARD */}
      <div className="card border-1 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          {/* Avatar */}
          <div className="position-relative">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#2979ff",
                color: "white",
                fontSize: "28px",
                fontWeight: "600",
              }}
            >
              {initials}
            </div>

            <input
              type="file"
              accept="image/*"
              id="profileImageInput"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSelectedImage(file);
                }
              }}
            />

            <button
              className="btn btn-light position-absolute p-1 d-flex align-items-center justify-content-center border rounded-circle"
              style={{
                bottom: "0px",
                right: "0px",
                width: "26px",
                height: "26px",
              }}
              onClick={() =>
                document.getElementById("profileImageInput").click()
              }
            >
              <Camera size={14} />
            </button>
          </div>

          <div>
            <h5 className="mb-1 fw-semibold">
              {displayData.firstname || displayData.lastname
                ? `${displayData.firstname} ${displayData.lastname}`
                : "Loading..."}
            </h5>

            <p className="mb-0 text-secondary">{formData.communityName}</p>
            <p className="mb-2 text-secondary">Unit Code: {formData.uCode}</p>
          </div>
        </div>

        <button
          className="btn btn-light border rounded-3 d-flex align-items-center gap-2"
          onClick={() => setIspassword((prev) => !prev)}
        >
          <Edit3 size={16} /> {isPassword ? "Edit Profile" : "Change Password"}
        </button>
      </div>

      {/* PASSWORD MODE */}
      {isPassword ? (
        <div id="passwordSection" className="form-section p-3">
          <form id="passwordForm">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                className="form-control"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordInput}
              />
            </div>

            <div className="d-flex gap-3">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInput}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInput}
                />
              </div>
            </div>

            <div className="rule-box">
              <ul className="password-requirements px-2">
                <li
                  style={{
                    color: passwordValidation.minLength ? "green" : "red",
                  }}
                >
                  Minimum 8 characters
                </li>
                <li
                  style={{
                    color: passwordValidation.caseMix ? "green" : "red",
                  }}
                >
                  One uppercase + one lowercase
                </li>
                <li
                  style={{
                    color: passwordValidation.numberSpecial ? "green" : "red",
                  }}
                >
                  One number or special character
                </li>
              </ul>
            </div>

            <div className="d-flex justify-content-end">
              <button
                type="submit"
                className="btn btn-primary"
                onClick={handlePasswordSubmit}
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      ) : (
        // PROFILE MODE
        <div className="row g-4 mt-3">
          {/* LEFT - Personal Info */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h6 className="mb-3 fw-semibold d-flex align-items-center gap-2">
                <User size={20} className="text-primary" />
                Personal Information
              </h6>

              <div className="d-flex flex-column gap-2 text-secondary">
                <div>
                  <small className="fw-semibold text-dark mb-1 d-block">
                    Full Name
                  </small>
                  <div className="d-flex gap-2">
                    <input
                      id="firstname"
                      type="text"
                      className="form-control"
                      placeholder="First Name"
                      value={formData.firstname}
                      onChange={handleChange}
                    />
                    <input
                      id="lastname"
                      type="text"
                      className="form-control"
                      placeholder="Last Name"
                      value={formData.lastname}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <small className="fw-semibold text-dark mb-1 d-block">
                    <Mail size={14} className="me-2 text-muted" />
                    Email
                  </small>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <small className="fw-semibold text-dark mb-1 d-block">
                    <Phone size={14} className="me-2 text-muted" />
                    Contact
                  </small>
                  <input
                    id="contact"
                    type="text"
                    className="form-control"
                    value={formData.contact}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <small className="fw-semibold text-dark mb-1 d-block">
                    <MapPin size={14} className="me-2 text-muted" />
                    Unit Code
                  </small>
                  <input
                    id="uCode"
                    type="text"
                    className="form-control"
                    value={formData.uCode}
                    readOnly
                  />
                </div>

                <div className="d-flex py-2 justify-content-end">
                  <button
                    className="btn w-50 btn-primary"
                    onClick={handleSaveProfile}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - Community Info */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h6 className="mb-3 fw-semibold d-flex align-items-center gap-2">
                <Building2 size={20} className="text-success" />
                Community Details
              </h6>

              <div className="d-flex flex-column gap-2 text-secondary">
                <div>
                  <small className="fw-semibold mb-1 text-dark d-block">
                    Community Name
                  </small>
                  <input
                    id="communityName"
                    className="form-control"
                    value={formData.communityName}
                    readOnly
                  />
                </div>

                <div>
                  <small className="fw-semibold mb-1 text-dark d-block">
                    Unit Code
                  </small>
                  <input
                    id="uCode"
                    className="form-control"
                    value={formData.uCode}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
