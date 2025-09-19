import React, { useState, useEffect } from "react";
import { Tag, Plus, Save, Trash2, Edit2, X, Check, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminSubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    planKey: "",
    name: "",
    price: "",
    duration: "monthly",
    maxResidents: "",
    features: "",
    isActive: true,
    displayOrder: 0,
  });

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? `${window.location.origin}/admin/api`
      : "http://localhost:3000/admin/api";

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/subscription-plans`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
      });

      const json = await res.json();
      if (json.success) {
        setPlans(json.data);
      } else {
        toast.error("Failed to fetch plans");
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Error loading plans");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f);

      const payload = {
        planKey: formData.planKey.toLowerCase().trim(),
        name: formData.name.trim(),
        price: Number(formData.price),
        duration: formData.duration,
        maxResidents: formData.maxResidents ? Number(formData.maxResidents) : null,
        features: featuresArray,
        isActive: formData.isActive,
        displayOrder: Number(formData.displayOrder),
      };

      const url = editingPlan
        ? `${API_BASE_URL}/subscription-plans/${editingPlan._id}`
        : `${API_BASE_URL}/subscription-plans`;

      const res = await fetch(url, {
        method: editingPlan ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(editingPlan ? "Plan updated successfully" : "Plan created successfully");
        fetchPlans();
        resetForm();
      } else {
        toast.error(json.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Error saving plan");
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      planKey: plan.planKey,
      name: plan.name,
      price: plan.price.toString(),
      duration: plan.duration,
      maxResidents: plan.maxResidents ? plan.maxResidents.toString() : "",
      features: plan.features.join("\n"),
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/subscription-plans/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Plan deleted successfully");
        fetchPlans();
      } else {
        toast.error(json.message || "Failed to delete plan");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Error deleting plan");
    }
  };

  const resetForm = () => {
    setFormData({
      planKey: "",
      name: "",
      price: "",
      duration: "monthly",
      maxResidents: "",
      features: "",
      isActive: true,
      displayOrder: 0,
    });
    setEditingPlan(null);
    setShowForm(false);
  };

  const styles = {
    header: {
      marginBottom: "32px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "16px",
    },
    createBtn: {
      background: "#0f172a",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: 500,
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease",
    },
    cancelBtn: {
      background: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: 500,
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(239,68,68,0.3)",
      transition: "all 0.2s ease",
    },
    refreshBtn: {
      background: "#ffffff",
      color: "#0f172a",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    formCard: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "28px 32px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      marginBottom: "32px",
      border: "1px solid #f1f5f9",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px",
      marginBottom: "24px",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#334155",
      marginBottom: "4px",
    },
    input: {
      padding: "10px 14px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      transition: "all 0.2s ease",
      outline: "none",
    },
    textarea: {
      padding: "10px 14px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      transition: "all 0.2s ease",
      outline: "none",
      resize: "vertical",
      minHeight: "120px",
    },
    select: {
      padding: "10px 14px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      cursor: "pointer",
      outline: "none",
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
      marginTop: "24px",
    },
    saveBtn: {
      background: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: 600,
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.2s ease",
    },
    cancelFormBtn: {
      background: "#f1f5f9",
      color: "#475569",
      border: "none",
      borderRadius: "10px",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: 600,
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.2s ease",
    },
    plansGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
      gap: "24px",
    },
    planCard: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      border: "1px solid #f1f5f9",
      transition: "all 0.25s ease",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    },
    planHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "start",
      marginBottom: "16px",
    },
    planName: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#0f172a",
      margin: "0 0 4px 0",
    },
    planKey: {
      fontSize: "12px",
      color: "#64748b",
      fontFamily: "monospace",
      background: "#f1f5f9",
      padding: "2px 8px",
      borderRadius: "4px",
    },
    badge: {
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.3px",
    },
    badgeActive: {
      background: "#dcfce7",
      color: "#166534",
    },
    badgeInactive: {
      background: "#f1f5f9",
      color: "#64748b",
    },
    priceSection: {
      marginBottom: "20px",
      paddingBottom: "20px",
      borderBottom: "1px solid #f1f5f9",
    },
    price: {
      fontSize: "36px",
      fontWeight: 700,
      color: "#3b82f6",
      margin: "0",
      lineHeight: "1",
    },
    duration: {
      fontSize: "14px",
      color: "#64748b",
      textTransform: "uppercase",
      marginTop: "4px",
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      fontSize: "14px",
    },
    infoLabel: {
      color: "#64748b",
    },
    infoValue: {
      color: "#0f172a",
      fontWeight: 600,
    },
    featuresSection: {
      marginTop: "20px",
      marginBottom: "20px",
      flexGrow: 1,
    },
    featuresTitle: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#334155",
      marginBottom: "12px",
    },
    featuresList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    featureItem: {
      display: "flex",
      alignItems: "start",
      gap: "8px",
      marginBottom: "8px",
      fontSize: "14px",
      color: "#475569",
    },
    actionsRow: {
      display: "flex",
      gap: "8px",
      marginTop: "auto",
      paddingTop: "16px",
      borderTop: "1px solid #f1f5f9",
    },
    editBtn: {
      flex: 1,
      background: "#eff6ff",
      color: "#3b82f6",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    deleteBtn: {
      flex: 1,
      background: "#fef2f2",
      color: "#ef4444",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    emptyState: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "64px 32px",
      textAlign: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      border: "1px solid #f1f5f9",
    },
    emptyIcon: {
      color: "#cbd5e1",
      marginBottom: "16px",
    },
    emptyTitle: {
      fontSize: "18px",
      fontWeight: 600,
      color: "#64748b",
      margin: "0 0 8px 0",
    },
    emptyText: {
      fontSize: "14px",
      color: "#94a3b8",
      margin: 0,
    },
    switchContainer: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    switch: {
      position: "relative",
      width: "48px",
      height: "24px",
    },
    switchInput: {
      opacity: 0,
      width: 0,
      height: 0,
    },
    switchSlider: {
      position: "absolute",
      cursor: "pointer",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#cbd5e1",
      transition: "0.3s",
      borderRadius: "24px",
    },
    switchSliderBefore: {
      position: "absolute",
      content: '""',
      height: "18px",
      width: "18px",
      left: "3px",
      bottom: "3px",
      background: "white",
      transition: "0.3s",
      borderRadius: "50%",
    },
  };

  if (loading && plans.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 0" }}>
        <div style={{ fontSize: "16px", color: "#64748b" }}>Loading subscription plans...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Subscription Plans
          </h2>
          <span style={{ color: "#64748b", fontSize: "14px" }}>
            Manage subscription plans for communities
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            style={styles.refreshBtn}
            onClick={fetchPlans}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            <RefreshCw size={18} /> {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            style={showForm ? styles.cancelBtn : styles.createBtn}
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = showForm
                ? "0 4px 12px rgba(239,68,68,0.4)"
                : "0 4px 12px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = showForm
                ? "0 2px 6px rgba(239,68,68,0.3)"
                : "0 2px 6px rgba(0,0,0,0.1)";
            }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Cancel" : "Create New Plan"}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#0f172a", marginBottom: "24px" }}>
            {editingPlan ? "Edit Subscription Plan" : "Create New Subscription Plan"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Plan Key * <span style={{ fontSize: "12px", fontWeight: 400, color: "#64748b" }}>(unique, lowercase)</span>
                </label>
                <input
                  type="text"
                  name="planKey"
                  value={formData.planKey}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="e.g., basic, premium"
                  required
                  disabled={!!editingPlan}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Plan Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="e.g., Basic Plan"
                  required
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="999"
                  required
                  min="0"
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Duration *</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  style={styles.select}
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Max Residents <span style={{ fontSize: "12px", fontWeight: 400, color: "#64748b" }}>(leave empty for unlimited)</span>
                </label>
                <input
                  type="number"
                  name="maxResidents"
                  value={formData.maxResidents}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="e.g., 50"
                  min="1"
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="0"
                  min="0"
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Active Status
              </label>
              <div style={styles.switchContainer}>
                <label style={styles.switch}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    style={styles.switchInput}
                  />
                  <span
                    style={{
                      ...styles.switchSlider,
                      background: formData.isActive ? "#3b82f6" : "#cbd5e1",
                    }}
                  >
                    <span
                      style={{
                        ...styles.switchSliderBefore,
                        transform: formData.isActive ? "translateX(24px)" : "translateX(0)",
                      }}
                    />
                  </span>
                </label>
                <span style={{ fontSize: "14px", color: "#475569" }}>
                  {formData.isActive ? "Active (visible to users)" : "Inactive (hidden)"}
                </span>
              </div>
            </div>

            <div style={{ ...styles.inputGroup, marginTop: "20px" }}>
              <label style={styles.label}>
                Features * <span style={{ fontSize: "12px", fontWeight: 400, color: "#64748b" }}>(one per line)</span>
              </label>
              <textarea
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                style={styles.textarea}
                placeholder={"Up to 50 residents\nBasic management\nEmail support\n24/7 access"}
                required
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="submit"
                style={styles.saveBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#2563eb";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3b82f6";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Save size={18} />
                {editingPlan ? "Update Plan" : "Create Plan"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={styles.cancelFormBtn}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <Tag size={64} />
          </div>
          <h3 style={styles.emptyTitle}>No Subscription Plans Found</h3>
          <p style={styles.emptyText}>Create your first subscription plan to get started</p>
        </div>
      ) : (
        <div style={styles.plansGrid}>
          {plans.map((plan) => (
            <div
              key={plan._id}
              style={styles.planCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
              }}
            >
              {/* Header */}
              <div style={styles.planHeader}>
                <div>
                  <h3 style={styles.planName}>{plan.name}</h3>
                  <span style={styles.planKey}>{plan.planKey}</span>
                </div>
                <span style={{ ...styles.badge, ...(plan.isActive ? styles.badgeActive : styles.badgeInactive) }}>
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Price */}
              <div style={styles.priceSection}>
                <div style={styles.price}>₹{plan.price}</div>
                <div style={styles.duration}>per {plan.duration}</div>
              </div>

              {/* Info */}
              <div style={{ marginBottom: "20px" }}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Max Residents:</span>
                  <span style={styles.infoValue}>{plan.maxResidents || "Unlimited"}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Display Order:</span>
                  <span style={styles.infoValue}>{plan.displayOrder}</span>
                </div>
              </div>

              {/* Features */}
              <div style={styles.featuresSection}>
                <div style={styles.featuresTitle}>Features</div>
                <ul style={styles.featuresList}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} style={styles.featureItem}>
                      <Check size={16} style={{ color: "#22c55e", flexShrink: 0, marginTop: "2px" }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div style={styles.actionsRow}>
                <button
                  style={styles.editBtn}
                  onClick={() => handleEdit(plan)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(plan._id)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
