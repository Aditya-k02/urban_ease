import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Megaphone,
    Eye,
    Timer,
    DollarSign,
    Trash2,
    Edit,
    Plus,
    UploadCloud,
    AlertCircle,
    Loader2
} from "lucide-react";
import "../../assets/css/Manager/Ad.css";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = process.env.NODE_ENV === "production" ? `${window.location.origin
    }/manager/api` : "http://localhost:3000/manager/api";

// Base URL for non-API manager routes (e.g. file uploads / images)
const MANAGER_BASE_URL = process.env.NODE_ENV === "production" ? `${window.location.origin
    }/manager` : "http://localhost:3000/manager";

const statusBadge = (status) => {
    switch (status) {
        case "Active":
            return <span className="badge bg-success">
                {status}</span>;
        case "Pending":
            return (
                <span className="badge bg-warning text-dark">
                    {status}</span>
            );
        case "Expired":
            return <span className="badge bg-secondary">
                {status}</span>;
        case "Rejected":
            return <span className="badge bg-danger">
                {status}</span>;
        default:
            return <span className="badge bg-light text-dark">
                {status}</span>;
    }
};

const getAdImageUrl = (imagePath) => {
    if (!imagePath)
        return null;



    const normalizedPath = imagePath.replace(/\\/g, "/");
    // If imagePath is already absolute (starts with http), return it.
    if (/^https?:\/\//i.test(normalizedPath))
        return normalizedPath;



    // Otherwise construct full URL
    const baseUrl = process.env.NODE_ENV === "production" ? window.location.origin : "http://localhost:3000";
    return `${baseUrl}/${normalizedPath.replace(/^\/+/, "")
        }`;
};

/* ==============================
   Advertisement Popup Component
   ============================== */
const AdvertisementPopup = ({
    setShowPopup,
    ad,
    setAds,
    ads = [],
    setEditingAd,
    onAdCreated
}) => {
    const {
        register,
        handleSubmit,
        formState: {
            errors
        },
        reset,
        setValue,
        watch
    } = useForm({
        mode: "onChange",
        shouldUnregister: false
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const isEditing = !!ad;

    console.log(ad);


    useEffect(() => {
        if (isEditing && ad) {
            // Pre-fill form values with proper formatting
            setValue("title", ad.title || "");
            setValue("startDate", ad.startDate || "");
            setValue("endDate", ad.endDate || "");
            setValue("adType", ad.adType || "");
            setValue("targetAudience", ad.targetAudience || "");
            setValue("link", ad.link || "");
            setValue("status", ad.status || "");

            setImagePreview(getAdImageUrl(ad.imagePath || ad.image || ""));
        } else {
            reset();
            setImagePreview(null);
            setFileToUpload(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ad, isEditing]);

    const handleImageUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file)
            return;



        if (file.size > 5 * 1024 * 1024) {
            alert("File size should be less than 5MB.");
            return;
        }
        setFileToUpload(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const submitHandler = async (data) => {
        try {
            setSubmitting(true);
            setSubmitError(null);

            // Basic client-side validation for required image when creating
            if (!isEditing && !fileToUpload) {
                throw new Error("Advertisement image is required for new ads.");
            }

            const formData = new FormData();
            formData.append("title", data.title || "");
            formData.append("startDate", data.startDate || "");
            formData.append("endDate", data.endDate || "");
            formData.append("adType", data.adType || "");
            formData.append("targetAudience", data.targetAudience || "");



            if (data.link)
                formData.append("link", data.link);



            if (fileToUpload)
                formData.append("image", fileToUpload);



            const url = isEditing ? `${API_BASE_URL}/ad/${ad._id
                }` : `${API_BASE_URL}/ad`;

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                credentials: "include",
                body: formData
            });

            if (response.status === 401) {
                throw new Error("Unauthorized access. Please log in again.");
            }

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to ${isEditing ? "update" : "create"
                    } advertisement: ${response.status
                    } ${text}`);
            }

            const json = await response.json();

            if (!json.success || !json.ad) {
                throw new Error(json.message || `Failed to ${isEditing ? "update" : "create"
                    } advertisement`);
            }

            // Update ads state in parent
            if (isEditing) {
                setAds((prev) => {
                    const safePrev = Array.isArray(prev) ? prev : [];
                    return safePrev.map((a) => (a._id === json.ad._id ? json.ad : a));
                });
            } else {
                setAds((prev) => {
                    const safePrev = Array.isArray(prev) ? prev : [];
                    return [
                        json.ad,
                        ...safePrev
                    ];
                });
            }

            // Reset and close
            reset();
            setImagePreview(null);
            setFileToUpload(null);
            setShowPopup(false);
            setEditingAd(null);

            // Trigger Layout refresh
            if (onAdCreated && typeof onAdCreated === 'function') {
                onAdCreated();
            }
        } catch (err) {
            console.error("Error submitting advertisement:", err);
            setSubmitError(err.message || `An error occurred while ${isEditing ? "updating" : "creating"
                } the advertisement. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div className="popup"
                initial={
                    { opacity: 0 }
                }
                animate={
                    { opacity: 1 }
                }
                exit={
                    { opacity: 0 }
                }>
                <motion.div className="popup-content"
                    initial={
                        {
                            scale: 0.8,
                            opacity: 0
                        }
                    }
                    animate={
                        {
                            scale: 1,
                            opacity: 1
                        }
                    }
                    exit={
                        {
                            scale: 0.8,
                            opacity: 0
                        }
                    }>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">
                            {
                                isEditing ? "Edit Advertisement" : "Create Advertisement"
                            }</h5>
                        <button type="button" className="btn-close" aria-label="Close"
                            onClick={
                                () => {
                                    setShowPopup(false);
                                    setEditingAd(null);
                                }
                            }></button>
                    </div>

                    <form onSubmit={
                        handleSubmit(submitHandler)
                    }
                        className="px-2">
                        <div className="mb-3">
                            <label className="form-label fw-medium">Advertisement Title *</label>
                            <input type="text" className="form-control" placeholder="Enter ad title (max 60 characters)"
                                maxLength={60}
                                {...register("title", { required: true })} /> {
                                errors.title && <small className="text-danger">Title is required</small>
                            } </div>

                        <div className="mb-3">
                            <label className="form-label fw-medium">Image/Banner Upload {
                                isEditing ? "(Optional)" : "*"
                            }</label>
                            <div className="border border-2 rounded-3 p-4 text-center"
                                style={
                                    {
                                        borderStyle: "dashed",
                                        background: "#f9fafb",
                                        cursor: "pointer"
                                    }
                                }
                                onClick={
                                    () => document.getElementById("fileInput")?.click()
                                }>
                                {
                                    imagePreview ? (
                                        <img src={imagePreview}
                                            alt="Ad Preview"
                                            className="img-fluid rounded"
                                            style={
                                                {
                                                    maxHeight: "160px",
                                                    objectFit: "cover"
                                                }
                                            } />
                                    ) : (
                                        <>
                                            <UploadCloud size={36}
                                                className="text-secondary mb-2" />
                                            <p className="text-secondary mb-0">Click to upload or drag and drop</p>
                                            <p className="small text-muted mb-0">JPEG or PNG (max 5MB)</p>
                                        </>
                                    )
                                }

                                <input type="file" id="fileInput" accept="image/png, image/jpeg"
                                    style={
                                        { display: "none" }
                                    }
                                    onChange={handleImageUpload} />
                            </div>
                            {
                                submitError && <small className="text-danger d-block mt-1">
                                    {submitError}</small>
                            } </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Start Date *</label>
                                <input type="date" className="form-control" {...register("startDate", { required: true })} /> {
                                    errors.startDate && <small className="text-danger">Start date is required</small>
                                } </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">End Date *</label>
                                <input type="date" className="form-control" {...register("endDate", { required: true })} /> {
                                    errors.endDate && <small className="text-danger">End date is required</small>
                                } </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Ad Type *</label>
                                <select className="form-select" {...register("adType", { required: true })}>
                                    <option value="">Select type</option>
                                    <option value="Sponsored">Sponsored</option>
                                    <option value="Announcement">Announcement</option>
                                </select>
                                {
                                    errors.adType && <small className="text-danger">Ad type is required</small>
                                } </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Target Audience *</label>
                                <select className="form-select" {...register("targetAudience", { required: true })}>
                                    <option value="">Select audience</option>
                                    <option value="All">All Residents</option>
                                    <option value="Block A">Block A</option>
                                    <option value="Block B">Block B</option>
                                </select>
                                {
                                    errors.targetAudience && <small className="text-danger">Target audience is required</small>
                                } </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-medium">Link (Optional)</label>
                            <input type="url" className="form-control" placeholder="Enter advertisement link (e.g., https://example.com)" {...register("link")} />
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button type="button" className="btn btn-outline-secondary"
                                onClick={
                                    () => {
                                        setShowPopup(false);
                                        setEditingAd(null);
                                    }
                                }
                                disabled={submitting}>
                                Cancel
                            </button>

                            <button type="submit" className="btn btn-success"
                                disabled={submitting}>
                                {
                                    submitting ? "Saving..." : isEditing ? "Update Ad" : "Create Ad"
                                } </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

/* ==============================
   ManagerAdvertisementContainer
   ============================== */
const ManagerAdvertisementContainer = ({ ads, setShowPopup, setEditingAd, handleDelete }) => {
    if (!ads || !Array.isArray(ads) || ads.length === 0) {
        return (
            <div className="container-fluid px-0 py-3">
                <div className="text-center py-5">
                    <p className="text-muted">No advertisements found. Create your first ad to get started!</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div className="container-fluid px-0 py-3"
            initial={
                { opacity: 0 }
            }
            animate={
                { opacity: 1 }
            }>
            <div className="row g-4">
                {
                    ads.map((ad, i) => (
                        <motion.div key={
                            ad._id || `ad-${i}`
                        }
                            className="col-md-4"
                            initial={
                                {
                                    opacity: 0,
                                    y: 30
                                }
                            }
                            animate={
                                {
                                    opacity: 1,
                                    y: 0
                                }
                            }
                            transition={
                                {
                                    delay: i * 0.1
                                }
                            }>
                            <div className="card shadow-sm border-1 h-100 rounded-3">
                                <div className="card-body p-3">
                                    {
                                        getAdImageUrl(ad.imagePath || ad.image) && (
                                            <div className="mb-2">
                                                <img src={
                                                    getAdImageUrl(ad.imagePath || ad.image)
                                                }
                                                    alt={
                                                        ad.title || "Advertisement"
                                                    }
                                                    className="img-fluid rounded"
                                                    style={
                                                        {
                                                            maxHeight: "160px",
                                                            width: "100%",
                                                            objectFit: "cover"
                                                        }
                                                    } />
                                            </div>
                                        )
                                    }

                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="card-title mb-0 fw-semibold">
                                            {
                                                ad.title || "Untitled Ad"
                                            }</h5>
                                        {
                                            statusBadge(ad.status || "Pending")
                                        } </div>

                                    {
                                        ad.link && (
                                            <p className="text-muted mb-1 small">
                                                <a href={
                                                    ad.link
                                                }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-decoration-none">
                                                    View Link
                                                </a>
                                            </p>
                                        )
                                    }

                                    <div className="small text-secondary mb-2">
                                        <div>Start: {
                                            ad.startDate || "N/A"
                                        }</div>
                                        <div>End: {
                                            ad.endDate || "N/A"
                                        }</div>
                                    </div>

                                    <div className="d-flex justify-content-start gap-3 mt-3">
                                        <button className="AdActionEditBtn btn"
                                            onClick={
                                                () => {
                                                    setEditingAd(ad);
                                                    setShowPopup(true);
                                                }
                                            }>
                                            <Edit size={18}
                                                title="Edit" />
                                            Edit
                                        </button>

                                        <button className="btn btn-outline-danger"
                                            onClick={
                                                () => handleDelete(ad._id)
                                            }
                                            title="Delete">
                                            <Trash2 size={18}
                                                title="Delete" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                } </div>
        </motion.div>
    );
};

/* ==============================
   AdOverview Component
   ============================== */
const AdOverview = ({ statistics }) => {
    const stats = statistics || {
        total: 0,
        active: 0,
        expired: 0,
        pending: 0
    };

    const data = [
        {
            icon: <Megaphone size={24}
                className="text-success" />,
            title: "Total Ads",
            value: stats.total || 0,
            color: "text-success"
        }, {
            icon: <Eye size={24}
                className="text-warning" />,
            title: "Active ads",
            value: stats.active || 0,
            color: "text-warning"
        }, {
            icon: <Timer size={24}
                className="text-danger" />,
            title: "Expired ads",
            value: stats.expired || 0,
            color: "text-danger"
        }, {
            icon: <DollarSign size={24}
                className="text-info" />,
            title: "Pending ads",
            value: stats.pending || 0,
            color: "text-info"
        }
    ];

    return (
        <div className="p-0 py-4">
            <div className="row g-4">
                {
                    data.map((item, i) => (
                        <motion.div key={i}
                            className="col-md-6 col-lg-3"
                            initial={
                                {
                                    opacity: 0,
                                    y: 30
                                }
                            }
                            animate={
                                {
                                    opacity: 1,
                                    y: 0
                                }
                            }
                            transition={
                                {
                                    delay: i * 0.1
                                }
                            }>
                            <div className="payment-card shadow-sm p-3 rounded-4 bg-white">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="icon-box">
                                        {
                                            item.icon
                                        }</div>
                                </div>
                                <h6 className="mt-3 text-secondary">
                                    {
                                        item.title
                                    }</h6>
                                <h4 className={
                                    `fw-semibold mt-1 ${item.color
                                    }`
                                }>
                                    {
                                        item.value
                                    }</h4>
                            </div>
                        </motion.div>
                    ))
                } </div>
        </div>
    );
};

/* ==============================
   SearchBar (basic UI)
   ============================== */
const SearchBar = ({ setShowPopup, setEditingAd, searchTerm, setSearchTerm, statusFilter, setStatusFilter }) => {
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleStatusFilter = (e) => {
        setStatusFilter(e.target.value);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
    };

    return (
        <div className="d-flex gap-2 align-items-center mb-3 flex-wrap">
            <input
                type="text"
                className="form-control m-0"
                placeholder="Search by ad title..."
                value={searchTerm}
                onChange={handleSearch}
                style={{
                    maxWidth: "70%"
                }}
            />
            <select
                className="form-select m-0"
                value={statusFilter}
                onChange={handleStatusFilter}
                style={{
                    maxWidth: "120px"
                }}
            >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
            </select>

            <button
                className="btn"
                style={{
                    backgroundColor: "orangeRed",
                    color: "white"
                }}
                onClick={() => {
                    setEditingAd(null);
                    setShowPopup(true);
                }}
            >
                <Plus size={18} />
                Add new ad
            </button>
        </div>
    );
};

/* ==============================
   Main Advertisement Component
   ============================== */
export const Advertisement = () => {
    const { onAdCreated } = useOutletContext() || {};
    const [ads, setAds] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Filter ads based on search term and status
    const filteredAds = ads.filter((ad) => {
        const matchesSearch = ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchesStatus = !statusFilter || ad.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDelete = async (adId) => {
        if (!window.confirm("Are you sure you want to delete this advertisement?"))
            return;



        const originalAds = [...ads];
        setAds(ads.filter((ad) => ad._id !== adId)); // Optimistic update

        try {
            const response = await fetch(`${MANAGER_BASE_URL}/ad/${adId}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (!response.ok) {
                const text = await response.text();
                console.log("Failed to delete ad:", response.status, text);
                throw new Error("Failed to delete ad.");
            }

        } catch (err) {
            console.error("Error deleting ad:", err);
            setAds(originalAds); // Revert on error
            alert("Could not delete the advertisement. Please try again.");
        }
    };

    useEffect(() => {
        const fetchAds = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${API_BASE_URL}/ad`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                if (response.status === 401) {
                    setError("Unauthorized access. Please log in again.");
                    setLoading(false);
                    return;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch ads: ${response.status
                        } ${errorText}`);
                }

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Invalid response format. Expected JSON.");
                }

                const data = await response.json();
                console.log(data);


                if (data.success) {
                    setAds(Array.isArray(data.ads) ? data.ads : []);
                    setStatistics(data.statistics || null);
                } else {
                    throw new Error(data.message || "Failed to fetch advertisements");
                }
            } catch (err) {
                console.error("Error fetching ads:", err);
                setError(err.message || "An error occurred while fetching advertisements. Please try again later.");
                setAds([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, []);

    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <Loader2 size={48}
                    className="text-primary mb-3"
                    style={
                        { animation: "spin 1s linear infinite" }
                    } />
                <p className="text-muted">Loading advertisements...</p>
                <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <AlertCircle size={48}
                    className="text-danger mb-3" />
                <h5 className="text-danger mb-2">Error Loading Advertisements</h5>
                <p className="text-muted text-center">
                    {error}</p>
                <button className="btn btn-primary mt-3"
                    onClick={
                        () => {
                            setError(null);
                            setLoading(true);
                            window.location.reload();
                        }
                    }>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column">
            <AdOverview statistics={statistics} />
            <SearchBar
                setShowPopup={setShowPopup}
                setEditingAd={setEditingAd}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
            />
            <ManagerAdvertisementContainer ads={filteredAds}
                setShowPopup={setShowPopup}
                setEditingAd={setEditingAd}
                handleDelete={handleDelete}
            /> {
                showPopup && (
                    <AdvertisementPopup setShowPopup={setShowPopup}
                        ad={editingAd}
                        setAds={setAds}
                        ads={ads}
                        setEditingAd={setEditingAd}
                        onAdCreated={onAdCreated} />
                )
            } </div>
    );
};
