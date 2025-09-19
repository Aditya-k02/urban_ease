import React from "react";
import logo from '../imgs/logo.png';
import "../assets/css/Navbar.css"
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { logout } from "../Slices/authSlice";

export const Navbar = ({ userType }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    return (
        <>
            <nav
              className="d-flex align-items-center pt-2 justify-content-between bg-white"
              style={{ paddingLeft: '20px',paddingRight:'10px' }}
            >

              <button className="menu-toggle d-xl-none">
                <i className="bi bi-list"></i>
              </button>

              <div className=" pb-1">
                <img src={logo} alt="Logo"  />
              </div>
              <ul className="d-flex gap-3 align-items-center list-unstyled mobile-menu">
                {
                  userType === 'admin' ? (
                    <>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/admin/dashboard">Dashboard</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/admin/profile" >Profile</NavLink></li>
                    </>
                  ) : userType === 'Resident' ? (
                    <>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/resident/dashboard">Dashboard</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/resident/preApproval">Pre approval</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/resident/issueRaising">Issue Raising</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/resident/commonSpace">Common space Bookings</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/resident/payments">Payments</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/resident/profile" >Profile</NavLink></li>
                    </>
                  ) : userType === 'Worker' ? (
                    <>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/worker/dashboard">Dashboard</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/worker/history">History</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/worker/tasks">Tasks</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/worker/profile" >Profile</NavLink></li>
                    </>
                  ) : userType === 'manager' ? (
                    <>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/manager/dashboard">Dashboard</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/manager/userManagement">User Management</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/manager/issueResolving">Issue Resolving</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/manager/commonSpace">Common space Bookings</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/manager/payments">Payments</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/manager/advertisement">Advertisement</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/manager/profile" >Profile</NavLink></li>
                    </>
                  ) :userType === 'security' ? (
                    <>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/security/dashboard">Dashboard</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/security/visitorManagement">Visitor Management</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/security/preapproval">Preapproval</NavLink></li>
                      <li className="px-2"><NavLink className={({isActive})=>(isActive ? "Nactive" : "")} to="/security/profile" >Profile</NavLink></li>
                    </>
                  ): (
                    <p>No Links Available</p>
                  )
                }
              </ul>
              <div className="log-out-con  d-flex justify-content-around align-items-center" style={{position: 'relative'}}>
                <button className="log-out btn btn-warning p-2" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-1"></i>Logout
                </button>
              </div>
            </nav>
        </>
    )
}