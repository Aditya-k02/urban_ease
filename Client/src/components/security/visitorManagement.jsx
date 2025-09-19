import { useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Filter,
  X,
  CheckCircle
} from "lucide-react";

const VisitorManagement = () => {
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    visitorType: "",
    fullName: "",
    contact: "",
    visitDate: "",
    email: "",
    visitTime: "",
    vehicle: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="container py-4" style={{ fontFamily: "Inter, Montserrat, sans-serif" }}>
      {/* Header */}
      <h4 className="fw-semibold mb-4">Visitor Management</h4>

      {/* Stats */}
      <div className="row g-4 mb-4">
        <StatCard
          title="Total Visitors Today"
          value="0"
          color="success"
          icon={<Users size={28} />}
        />
        <StatCard
          title="Checked out visitors"
          value="0"
          color="warning"
          icon={<UserX size={28} />}
        />
        <StatCard
          title="Active Visitors"
          value="0"
          color="primary"
          icon={<UserCheck size={28} />}
        />
      </div>

      {/* Add Visitor */}
      <button
        className="btn btn-outline-warning w-100 mb-4 d-flex align-items-center gap-2 justify-content-center"
        style={{ borderRadius: "10px" }}
        onClick={() => setShowModal(true)}
      >
        <Plus />
        Add New Visitor
      </button>

      {/* Search & Export */}
      <div className="d-flex gap-3 mb-3">
        <input
          className="form-control"
          placeholder="Search by name, date, status..."
        />
        <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
          <Filter size={16} />
          Search
        </button>
        <button className="btn btn-warning text-white">Export</button>
      </div>

      {/* Tabs */}
      <div className="border-bottom mb-4 d-flex gap-4">
        <span className="fw-semibold border-bottom border-primary pb-2 text-primary">
          All Visitors
        </span>
        <span className="text-muted">Active</span>
        <span className="text-muted">Checked Out</span>
      </div>

      {/* Empty State */}
      <div
        className="text-center bg-white shadow-sm rounded p-5"
        style={{ minHeight: "240px" }}
      >
        <Users size={40} className="text-muted mb-3" />
        <h5 className="fw-semibold">No Visitors Found</h5>
        <p className="text-muted mb-0">
          Add new visitors to see them listed here
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">Add a visitor</h5>
                <button className="btn" onClick={closeModal}>
                  <X />
                </button>
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Type of visitor</label>
                    <select
                      className="form-select"
                      name="visitorType"
                      onChange={handleChange}
                    >
                      <option>Select visitor type</option>
                      <option>Guest</option>
                      <option>Delivery</option>
                      <option>Service</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Contact number</label>
                    <input
                      className="form-control"
                      placeholder="10 digit mobile number"
                      name="contact"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Full name</label>
                    <input
                      className="form-control"
                      placeholder="Enter visitor's full name"
                      name="fullName"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email address</label>
                    <input
                      className="form-control"
                      placeholder="visitor@example.com"
                      name="email"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Visit date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="visitDate"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Visit time</label>
                    <input
                      type="time"
                      className="form-control"
                      name="visitTime"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label">
                      Vehicle number <span className="text-muted">(Optional)</span>
                    </label>
                    <input
                      className="form-control"
                      placeholder="Optional"
                      name="vehicle"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  <X size={16} /> Cancel
                </button>
                <button className="btn btn-warning text-white">
                  <CheckCircle size={16} /> Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color, icon }) => (
  <div className="col-md-4">
    <div
      className={`card shadow-sm border-top border-4 border-${color}`}
      style={{ borderRadius: "14px" }}
    >
      <div className="card-body text-center">
        <p className="text-muted mb-1">{title}</p>
        <h2 className={`fw-bold text-${color}`}>{value}</h2>
        <div className={`text-${color}`}>{icon}</div>
      </div>
    </div>
  </div>
);

export { VisitorManagement};
