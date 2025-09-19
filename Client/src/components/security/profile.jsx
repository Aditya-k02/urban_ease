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

export const SecurityProfile = () => {
  const [displayData, setDisplayData] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    communityName: "",
    image: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    communityName: "",
    image: "",
  });

  const [isPassword, setIsPassword] = useState(false);

  // ------------------------------------------------
  // Fetch Profile
  // ------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("http://localhost:3000/security/profile", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          const s = data.security;

          const fetched = {
            name: s.name || "",
            email: s.email || "",
            contact: s.contact || "",
            address: s.address || "",
            communityName: s.community?.communityName || "",
            image: s.image || "",
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
  // Handle Input Change
  // ------------------------------------------------
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // ------------------------------------------------
  // Save Profile (PUT)
  // ------------------------------------------------
  const handleSaveProfile = async () => {
    try {
      const res = await fetch("http://localhost:3000/security/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          address: formData.address,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      alert("Profile updated!");

      setDisplayData(formData);
    } catch (error) {
      console.error(error);
      alert("Error updating profile.");
    }
  };

  // ------------------------------------------------
  // Change Password
  // ------------------------------------------------
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:3000/security/change-password",
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

      if (!data.success) {
        alert(data.message);
        return;
      }

      alert("Password updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating password.");
    }
  };

  // ------------------------------------------------
  // Initials
  // ------------------------------------------------
  const initials =
    displayData.name
      ? displayData.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
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

            <button
              className="btn btn-light position-absolute p-1 d-flex align-items-center justify-content-center border rounded-circle"
              style={{
                bottom: "0px",
                right: "0px",
                width: "26px",
                height: "26px",
              }}
            >
              <Camera size={14} />
            </button>
          </div>

          <div>
            <h5 className="mb-1 fw-semibold">
              {displayData.name || "Loading..."}
            </h5>

            <p className="mb-0 text-secondary">{displayData.communityName}</p>
            <p className="mb-2 text-secondary">{displayData.address}</p>
          </div>
        </div>

        <button
          className="btn btn-light border rounded-3 d-flex align-items-center gap-2"
          onClick={() => setIsPassword((prev) => !prev)}
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
              <input type="password" className="form-control" id="currentPassword" />
            </div>

            <div className="d-flex gap-3">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="newPassword"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button className="btn btn-primary" onClick={handlePasswordSubmit}>
                Update Password
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* PROFILE MODE */
        <div className="row g-4 mt-3">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h6 className="mb-3 fw-semibold d-flex align-items-center gap-2">
                <User size={20} className="text-primary" />
                Personal Information
              </h6>

              <div className="d-flex flex-column gap-2 text-secondary">
                <div>
                  <small className="fw-semibold text-dark d-block mb-1">
                    Full Name
                  </small>
                  <input
                    id="name"
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <small className="fw-semibold text-dark d-block mb-1">
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
                  <small className="fw-semibold text-dark d-block mb-1">
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
                  <small className="fw-semibold text-dark d-block mb-1">
                    <MapPin size={14} className="me-2 text-muted" />
                    Address
                  </small>
                  <input
                    id="address"
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={handleChange}
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

          {/* Community Info */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h6 className="mb-3 fw-semibold d-flex align-items-center gap-2">
                <Building2 size={20} className="text-success" />
                Community Details
              </h6>

              <div className="d-flex flex-column gap-2 text-secondary">
                <div>
                  <small className="fw-semibold d-block mb-1">Community</small>
                  <input
                    id="communityName"
                    className="form-control"
                    value={formData.communityName}
                    readOnly
                  />
                </div>

                <div>
                  <small className="fw-semibold d-block mb-1">Address</small>
                  <input
                    id="address"
                    className="form-control"
                    value={formData.address}
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
