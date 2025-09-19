/**
 * @license Proprietary
 * @fileoverview Worker Profile Component
 * @copyright All rights reserved
 */

import React, {useEffect, useState} from "react";
import "../../assets/css/Worker/Profile.css";
import image from "../../imgs/image.png";
import {useSelector, useDispatch} from 'react-redux';
import {toast} from "react-toastify";
import {Loader} from "../Loader";


export const WorkerProfile = () => {
    const [formData, setFormData] = useState({
        name: "Rahul Sharma",
        email: "rahul.sharma@urbanease.com",
        contact: "+1 (555) 123-467",
        address: "San Francisco, CA",
        department: "Plumber",
        status: true,
        image: image,
        shift: "9:00AM to 5:00PM"
    });
    const [imageFile, setImageFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPassword, setIspassword] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState({minLength: false, caseMix: false, numberSpecial: false});
    const [passwords, setPasswords] = useState({cp: "", np: "", confirm: ""});


    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                const response = await fetch("http://localhost:3000/worker/getUserData", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include"
                });

                const data = await response.json();
                console.log(data);

                if (data.success && data.worker) {
                    const jobRole = data.worker.jobRole;
                    setFormData((prev) => ({
                        ...prev,
                        name: data.worker.name || prev.name,
                        email: data.worker.email || prev.email,
                        contact: data.worker.contact || prev.contact,
                        address: data.worker.address || prev.address,
                        // Map backend jobRole (can be String or [String]) to frontend department field
                        department: Array.isArray(jobRole) ? jobRole.join(", ") : jobRole || prev.department,
                        // Keep existing shift unless backend starts sending one
                        shift: data.worker.shift || prev.shift,
                        // If backend has stored image path, prefix with server URL so it loads correctly
                        image: data.worker.image ? `http://localhost:3000/${
                            data.worker.image
                        }` : prev.image
                    }));
                } else {
                    toast.error(data.message || "Failed to load worker data");
                }
            } catch (err) {
                console.error(err);
                toast.error("Something went wrong while loading worker data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

    }, [])


    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const {name, value} = e.target;
        setPasswords((prev) => ({
            ...prev,
            [name]: value
        }));

        const password = name === "np" ? value : passwords.np;

        setPasswordValidation({
            minLength: password.length >= 8,
            caseMix: /^(?=.*[a-z])(?=.*[A-Z])/.test(password),
            numberSpecial: /^(?=.*[0-9!@#$%^&*])/.test(password)
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (! file) 
            return;
        


        setImageFile(file);

        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({
                ...prev,
                image: reader.result
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleToggle = () => {
        setFormData((prev) => ({
            ...prev,
            status: !prev.status
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const body = new FormData();
            body.append("name", formData.name || "");
            body.append("email", formData.email || "");
            body.append("contact", formData.contact || "");
            body.append("address", formData.address || "");
            if (imageFile) {
                body.append("image", imageFile);
            }

            const response = await fetch("http://localhost:3000/worker/profile", {
                method: "POST",
                credentials: "include",
                body
            });

            const data = await response.json();

            if (data.success && data.r) {
                const jobRole = data.r.jobRole;
                toast.success(data.message || "Profile updated successfully");
                setFormData((prev) => ({
                    ...prev,
                    name: data.r.name || prev.name,
                    email: data.r.email || prev.email,
                    contact: data.r.contact || prev.contact,
                    address: data.r.address || prev.address,
                    department: Array.isArray(jobRole) ? jobRole.join(", ") : jobRole || prev.department,
                    // Refresh image preview if it was updated
                    image: data.r.image ? `http://localhost:3000/${
                        data.r.image
                    }` : prev.image
                }));
            } else {
                toast.error(data.message || "Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong while updating profile");
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwords.np !== passwords.confirm) {
            toast.error("New password and confirm password do not match");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/worker/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(
                    {cp: passwords.cp, np: passwords.np}
                )
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || "Password changed successfully");
                setPasswords({cp: "", np: "", confirm: ""});
                setPasswordValidation({minLength: false, caseMix: false, numberSpecial: false});
            } else {
                toast.error(data.message || "Failed to change password");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong while changing password");
        }
    };

    if (isLoading) {
        return (
            <div className="d-flex h-100 justify-content-center align-items-center" >
                <Loader/>
            </div>
        )
    }

    return (
        <div className="container worker-profile-container m-0">
            <div className="profile-header d-flex justify-content-end align-items-center">
                <div className="profile-image ">
                    <img src={
                            formData.image
                        }
                        alt="Worker"
                        className="rounded-circle shadow-sm"/>
                </div>
                <div className="d-flex w-75 justify-content-between">
                    <div className="name d-flex flex-column">
                        <h3>{
                            formData.name
                        }</h3>
                        <p className="role-text mb-2">Plumber</p>
                    </div>
                    <div className="profile-actions">
                        <label className="btn me-2 cam-btn" htmlFor="imgUpload" aria-label="Upload profile image">
                            <i className="bi bi-camera"></i>
                        </label>
                        <input className="" type="file" id="imgUpload" name="image" accept="image/*"
                            onChange={handleImageChange}
                            hidden/>
                        <button className="btn edit-btn "
                            onClick={
                                () => {
                                    setIspassword(prev => !prev);
                                    console.log(isPassword);
                                }
                        }>
                            <i className="bi bi-pencil me-1"></i>
                            {
                            isPassword ? <small>
                                Edit Profile</small> : <small>Change password</small>
                        } </button>
                    </div>
                </div>
            </div>

            {
            isPassword ? (
                <div id="passwordSection" className="form-section p-3">
                    <form id="passwordForm" type="worker"
                        onSubmit={handlePasswordSubmit}>
                        <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input type="password" className="form-control" id="currentPassword" name="cp"
                                value={
                                    passwords.cp
                                }
                                onChange={handlePasswordChange}/>
                        </div>

                        <div className="d-flex gap-3">
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input type="password" className="form-control" id="newPassword" name="np"
                                    value={
                                        passwords.np
                                    }
                                    onChange={handlePasswordChange}/>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input type="password" className="form-control" id="confirmPassword" name="confirm"
                                    value={
                                        passwords.confirm
                                    }
                                    onChange={handlePasswordChange}/>
                            </div>
                        </div>

                        <div className="rule-box">
                            <h5 className="mb-3">
                                <i className="bi bi-shield-check me-2"></i>Password Requirements
                            </h5>
                            <ul className="password-requirements px-2">
                                <li>
                                    <i className={
                                        `bi ${
                                            passwordValidation.minLength ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'
                                        }`
                                    }></i>
                                    <label>Minimum 8 characters long</label>
                                </li>
                                <li>
                                    <i className={
                                        `bi  ${
                                            passwordValidation.caseMix ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'
                                        }`
                                    }></i>
                                    <label>At least one uppercase and one lowercase letter</label>
                                </li>
                                <li>
                                    <i className={
                                        `bi ${
                                            passwordValidation.numberSpecial ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'
                                        }`
                                    }></i>
                                    <label>At least one number or special character</label>
                                </li>
                            </ul>
                        </div>

                        <div className="d-flex justify-content-end">
                            <button type="submit" className="btn btn-primary">
                                <i className="bi bi-key me-2"></i>Update Password
                            </button>
                        </div>
                    </form>
                </div>

            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="row mt-4">


                        <div className="col-md-6">
                            <div className="card info-card">
                                <div className="card-body">
                                    <h5 className="mb-4">Profile Information</h5>
                                    <div className="mb-3">
                                        <label className="form-label">Full Name</label>
                                        <div className="input-wrapper">
                                            <input type="text" name="name" className="form-control"
                                                value={
                                                    formData.name
                                                }
                                                onChange={handleChange}/>

                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Email</label>
                                        <div className="input-wrapper">
                                            <input type="email" name="email" className="form-control"
                                                value={
                                                    formData.email
                                                }
                                                onChange={handleChange}/>

                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Phone Number</label>
                                        <div className="input-wrapper">
                                            <input type="text" name="contact" className="form-control"
                                                value={
                                                    formData.contact
                                                }
                                                onChange={handleChange}/>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Address</label>
                                        <input type="text" name="address" className="form-control"
                                            value={
                                                formData.address
                                            }
                                            onChange={handleChange}/>
                                    </div>

                                    <div className="d-flex justify-content-end mt-3">
                                        <button className="btn btn-primary" type="submit">
                                            <i className="bi bi-save me-2"></i>Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card info-card mb-3">
                                <div className="card-body">
                                    <h5 className="mb-4">Work Information</h5>
                                    <div className="mb-3">
                                        <label className="form-label">Department</label>
                                        <div className="input-wrapper">
                                            <input type="text" className="form-control"
                                                value={
                                                    formData.department
                                                }
                                                readOnly/>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Shift</label>
                                        <div className="input-wrapper">
                                            <input type="text" className="form-control"
                                                value={
                                                    formData.shift
                                                }
                                                readOnly/>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Average rating</label>
                                        <div className="input-wrapper">
                                            <input type="text" className="form-control" value="4.5" readOnly/>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            )
        } </div>
    );
};
