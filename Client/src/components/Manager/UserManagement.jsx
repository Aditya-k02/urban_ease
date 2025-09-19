// UserManagement.jsx
import React, { useEffect, useState } from "react";
import "../../assets/css/Manager/userManagement.css";

const makeBase = () =>
    process.env.NODE_ENV === "production"
        ? `${window.location.origin}/manager`
        : "http://localhost:3000/manager";

/* -------------------------
   Small Helpers & Subcomponents
--------------------------*/

const IconButton = ({ children, className = "", ...props }) => (
    <button className={`um-icon-btn ${className}`} {...props}>
        {children}
    </button>
);

const Modal = ({ visible, onClose, title, children }) => {
    if (!visible) return null;
    return (
        <div className="um-backdrop" onClick={onClose}>
            <div className="um-modal" onClick={(e) => e.stopPropagation()}>
                <div className="um-modal-header">
                    <h4>{title}</h4>
                    <button className="um-close" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="um-modal-body">{children}</div>
            </div>
        </div>
    );
};

const Card = ({ title, subtitle, meta = [], onEdit, onDelete }) => (
    <div className="um-card">
        <div className="um-card-header">
            <div>
                <div className="um-card-title">{title}</div>
                {subtitle && <div className="um-card-sub">{subtitle}</div>}
            </div>
            <div className="um-card-actions">
                {onEdit && (
                    <button className="um-btn um-btn-edit" onClick={onEdit}>
                        Edit
                    </button>
                )}
                {onDelete && (
                    <button className="um-btn um-btn-delete" onClick={onDelete}>
                        Delete
                    </button>
                )}
            </div>
        </div>
        <div className="um-card-body">
            {meta.map((m, idx) => (
                <div key={idx} className="um-meta">
                    <strong>{m.label}: </strong>
                    <span>{m.value ?? "-"}</span>
                </div>
            ))}
        </div>
    </div>
);

const DynamicForm = ({ fields, initial = {}, onSubmit, submitLabel = "Save" }) => {
    const [form, setForm] = useState(() =>
        fields.reduce((acc, f) => ({ ...acc, [f.key]: initial[f.key] ?? "" }), {})
    );

    useEffect(() => {
        setForm(fields.reduce((acc, f) => ({ ...acc, [f.key]: initial[f.key] ?? "" }), {}));
    }, [fields, initial]);

    const handle = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    console.log("formData:", form);
    console.log("fields: ", fields);
    console.log("initial: ", initial);



    return (
        <form
            className="um-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(form);
            }}
        >
            {fields.map((f) => (
                <div className="um-form-row" key={f.key}>
                    <label>{f.label}</label>
                    {f.type === "textarea" ? (
                        <textarea value={form[f.key]} onChange={(e) => handle(f.key, e.target.value)} />
                    ) : (
                        <input
                            type={f.type || "text"}
                            value={form[f.key]}
                            onChange={(e) => handle(f.key, e.target.value)}
                            placeholder={f.placeholder || ""}
                        />
                    )}
                </div>
            ))}
            <div className="um-form-actions">
                <button type="submit" className="um-btn um-btn-primary">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
};

/* -------------------------
   Main Component
--------------------------*/
export default function UserManagement() {
    const BASE = makeBase();

    const [activeTab, setActiveTab] = useState("residents");

    const [resList, setResList] = useState([]);
    const [secList, setSecList] = useState([]);
    const [wrkList, setWrkList] = useState([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalCfg, setModalCfg] = useState(null);

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmPayload, setConfirmPayload] = useState(null);

    const [loading, setLoading] = useState(false);

    /* -------------------------
       GET LISTS
    --------------------------*/
    const fetchLists = async () => {
        try {
            setLoading(true);
            // residents
            try {
                const r = await fetch(`${BASE}/userManagement`, { credentials: "include" });
                if (r.ok) {
                    const jr = await r.json();
                    setResList(jr.R || []);
                    setSecList(jr.S || []);
                    setWrkList(jr.W || []);
                }
            } catch (err) {

            }

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        fetchLists();

    }, []);

    /* -------------------------
      Config per entity
    --------------------------*/
    const configFor = (entity) => {
        if (entity === "resident") {
            return {
                label: "Resident",
                endpoint: "resident",
                listName: "residents",
                fields: [
                    { key: "residentFirstname", label: "First Name" },
                    { key: "residentLastname", label: "Last Name" },
                    { key: "email", label: "Email", type: "email" },
                    { key: "uCode", label: "UCode / Flat" },
                    { key: "contact", label: "Contact" },
                ],
            };
        }
        if (entity === "security") {
            return {
                label: "Security",
                endpoint: "security",
                listName: "security",
                fields: [
                    { key: "securityName", label: "Name" },
                    { key: "securityEmail", label: "Email", type: "email" },
                    { key: "securityContact", label: "Contact" },
                    { key: "securityAddress", label: "Address" },
                    { key: "securityShift", label: "Shift" },
                ],
            };
        }
        // worker
        return {
            label: "Worker",
            endpoint: "worker",
            listName: "workers",
            fields: [
                { key: "workerName", label: "Name" },
                { key: "workerEmail", label: "Email", type: "email" },
                { key: "workerJobRole", label: "Job Role" },
                { key: "workerContact", label: "Contact" },
                { key: "workerAddress", label: "Address" },
                { key: "workerSalary", label: "Salary" },
            ],
        };
    };

    /* -------------------------
     Open Add Modal
    --------------------------*/
    const openAdd = (entity) => {
        const cfg = configFor(entity);
        setModalCfg({ entity, mode: "add", fields: cfg.fields, initial: {}, id: null });
        setModalVisible(true);
    };

    const openEdit = async (entity, id) => {
        setLoading(true);
        try {
            const cfg = configFor(entity);
            const res = await fetch(`${BASE}/userManagement/${cfg.endpoint}/${id}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load");
            const json = await res.json();
            console.log("json :", json.r);

            const payload = json.r || json[entity] || json[cfg.listName?.slice(0, -1)] || json;
            // map server fields to form initial keys
            const initial = mapServerToForm(entity, payload);
            setModalCfg({ entity, mode: "edit", fields: cfg.fields, initial, id });
            setModalVisible(true);
        } catch (err) {
            console.error("openEdit error", err);
            alert("Failed to load data for edit");
        } finally {
            setLoading(false);
        }
    };

    const saveEntity = async (entity, values, idForUpdate) => {
        setLoading(true);
        try {
            const cfg = configFor(entity);
            // build payload; backend expects Rid/Sid/Wid for updates
            const payload = { ...values };
            if (idForUpdate) {
                const idKey = entity === "resident" ? "Rid" : entity === "security" ? "Sid" : "Wid";
                payload[idKey] = idForUpdate;
            }

            const res = await fetch(`${BASE}/userManagement/${cfg.endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!json || !json.success) {
                const msg = (json && json.message) || "Save failed";
                alert(msg);
                return;
            }

            if (entity === "resident") {
                if (json.isUpdate) {
                    setResList((p) => p.map((x) => (x._id === json.resident._id ? json.resident : x)));
                } else {
                    setResList((p) => [json.resident, ...p]);
                }
            } else if (entity === "security") {
                if (json.isUpdate) {
                    setSecList((p) => p.map((x) => (x._id === json.security._id ? json.security : x)));
                } else {
                    setSecList((p) => [json.security, ...p]);
                }
            } else {
                if (json.isUpdate) {
                    setWrkList((p) => p.map((x) => (x._id === json.worker._id ? json.worker : x)));
                } else {
                    setWrkList((p) => [json.worker, ...p]);
                }
            }

            setModalVisible(false);
            setModalCfg(null);
        } catch (err) {
            console.error("save error", err);
            alert("Save failed");
        } finally {
            setLoading(false);
        }
    };

    /* -------------------------
      Delete
    --------------------------*/
    const askDelete = (entity, id) => {
        setConfirmPayload({ entity, id });
        setConfirmVisible(true);
    };

    const doDelete = async () => {
        if (!confirmPayload) return;
        setLoading(true);
        try {
            const { entity, id } = confirmPayload;
            const cfg = configFor(entity);
            const res = await fetch(`${BASE}/userManagement/${cfg.endpoint}/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const json = await res.json();
            if (!json || !(json.ok || json.success)) {
                alert("Delete failed");
                return;
            }

            if (entity === "resident") setResList((p) => p.filter((x) => x._id !== id));
            if (entity === "security") setSecList((p) => p.filter((x) => x._id !== id));
            if (entity === "worker") setWrkList((p) => p.filter((x) => x._id !== id));
            setConfirmVisible(false);
            setConfirmPayload(null);
        } catch (err) {
            console.error("delete error", err);
            alert("Delete failed");
        } finally {
            setLoading(false);
        }
    };

    /* -------------------------
      Helpers to map server <-> form keys
    --------------------------*/
    const mapServerToForm = (entity, item = {}) => {
        if (!item) return {};
        if (entity === "resident") {
            return {
                residentFirstname: item.residentFirstname || item.firstName || "",
                residentLastname: item.residentLastname || item.lastName || "",
                email: item.email || "",
                uCode: item.uCode || item.flat || "",
                contact: item.contact || "",
            };
        }
        if (entity === "security") {
            return {
                securityName: item.name || "",
                securityEmail: item.email || "",
                securityContact: item.contact || "",
                securityAddress: item.address || "",
                securityShift: item.Shift || "",
                gate: item.workplace || "",
            };
        }
        // worker
        return {
            workerName: item.name || "",
            workerEmail: item.email || "",
            workerJobRole: item.jobRole || "",
            workerContact: item.contact || "",
            workerAddress: item.address || "",
            workerSalary: item.salary || "",
        };
    };

    /* -------------------------
      Renderers
    --------------------------*/
    const renderResidents = () =>
        resList.map((r) => (
            <Card
                key={r._id}
                title={`${r.residentFirstname || ""} ${r.residentLastname || ""}`}
                subtitle={r.uCode || r.flat || ""}
                meta={[
                    { label: "Email", value: r.email },
                    { label: "Contact", value: r.contact },
                ]}
                onEdit={() => openEdit("resident", r._id)}
                onDelete={() => askDelete("resident", r._id)}
            />
        ));

    const renderSecurity = () =>
        secList.map((s) => (
            <Card
                key={s._id}
                title={s.name}
                subtitle={s.workplace || s.gate || ""}
                meta={[
                    { label: "Shift", value: s.Shift || s.securityShift },
                    { label: "Contact", value: s.contact },
                ]}
                onEdit={() => openEdit("security", s._id)}
                onDelete={() => askDelete("security", s._id)}
            />
        ));

    const renderWorkers = () =>
        wrkList.map((w) => (
            <Card
                key={w._id}
                title={w.name}
                subtitle={w.jobRole || w.workerJobRole || ""}
                meta={[
                    { label: "Contact", value: w.contact },
                    { label: "Salary", value: w.salary },
                ]}
                onEdit={() => openEdit("worker", w._id)}
                onDelete={() => askDelete("worker", w._id)}
            />
        ));

    return (
        <div className="um-page">
            <div className="um-header">
                <div>
                    <h2>User Management</h2>
                    <p className="um-subtle">Manage residents, security staff and workers</p>
                </div>

                {/* header actions intentionally removed — add buttons are shown inside the content area per active tab */}
            </div>

            <div className="um-tabs">
                <button className={`um-tab ${activeTab === "residents" ? "active" : ""}`} onClick={() => setActiveTab("residents")}>
                    Residents ({resList.length})
                </button>
                <button className={`um-tab ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
                    Security ({secList.length})
                </button>
                <button className={`um-tab ${activeTab === "workers" ? "active" : ""}`} onClick={() => setActiveTab("workers")}>
                    Workers ({wrkList.length})
                </button>
            </div>

            <div className="um-content">
                <div className="um-content-actions d-flex justify-content-end" style={{ marginBottom: 12 }}>
                    {activeTab === "residents" && (
                        <button className="um-btn" onClick={() => openAdd("resident")}>
                            + Resident
                        </button>
                    )}
                    {activeTab === "security" && (
                        <button className="um-btn" onClick={() => openAdd("security")}>
                            + Security
                        </button>
                    )}
                    {activeTab === "workers" && (
                        <button className="um-btn" onClick={() => openAdd("worker")}>
                            + Worker
                        </button>
                    )}
                </div>

                {activeTab === "residents" && <div className="um-grid">{renderResidents()}</div>}
                {activeTab === "security" && <div className="um-grid">{renderSecurity()}</div>}
                {activeTab === "workers" && <div className="um-grid">{renderWorkers()}</div>}
            </div>

            {/* Modal Add/Edit */}
            <Modal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setModalCfg(null);
                }}
                title={modalCfg ? (modalCfg.mode === "edit" ? `Edit ${configFor(modalCfg.entity).label}` : `Add ${configFor(modalCfg.entity).label}`) : ""}
            >
                {modalCfg && (
                    <DynamicForm
                        fields={modalCfg.fields}
                        initial={modalCfg.initial}
                        submitLabel={modalCfg.mode === "edit" ? "Update" : "Create"}
                        onSubmit={(values) => saveEntity(modalCfg.entity, values, modalCfg.mode === "edit" ? modalCfg.id : null)}
                    />
                )}
            </Modal>

            {/* Confirm delete */}
            <Modal visible={confirmVisible} onClose={() => setConfirmVisible(false)} title="Confirm delete">
                <div>
                    <p>Are you sure you want to delete this item?</p>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button className="um-btn" onClick={() => setConfirmVisible(false)}>
                            Cancel
                        </button>
                        <button className="um-btn um-btn-danger" onClick={doDelete}>
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

            {loading && (
                <div className="um-loading-overlay">
                    <div className="um-loading">Loading...</div>
                </div>
            )}
        </div>
    );
}
