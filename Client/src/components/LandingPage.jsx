import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../assets/css/LandingPage.css";
import { NavLink } from "react-router-dom";
import logo from "../imgs/URBAN_EASE.png";
import { ShieldCheck, CalendarCheck, Wrench, Bell } from "lucide-react";

export const Landingpage = () => {
  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg fixed-top w-100 p-0">
        <div className="container-fluid d-flex align-items-between mx-2 px-0">
          <NavLink className="navbar-brand mx-2" to="/">
            <img src={logo} alt="URBAN EASE" />
          </NavLink>

          <button
            className="navbar-toggler ms-auto text-white border-white my-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className="collapse navbar-collapse w-100 justify-content-end"
            id="navbarNav"
          >
            <ul className="navbar-nav d-flex align-items-lg-center align-items-start flex-lg-row flex-column">
              <li className="nav-item px-3 py-2">
                <a className="nav-link" href="#home">Home</a>
              </li>
              <li className="nav-item px-3 py-2">
                <a className="nav-link" href="#features">Features</a>
              </li>
              <li className="nav-item px-3 py-2">
                <a className="nav-link" href="#roles">Roles</a>
              </li>
              <li className="nav-item px-3 py-2">
                <NavLink className="btn btn-primary" to="/SignIn">Login</NavLink>
              </li>
              <li className="nav-item px-3 py-2">
                <NavLink className="btn btn-secondary" to="/interestForm">Register</NavLink>
              </li>
              <li className="nav-item px-3 py-2">
                <NavLink className="btn btn-outline-primary" to="/residentRegister">
                  Resident Registration
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="gap"></div>

      {/* WRAPPER START */}
      <main className="landing-wrapper">

        {/* HERO SECTION */}
        <section id="home" className="hero page-section text-center">
          <div className="overlay"></div>

          <div className="hero-content">
            <h1 className="display-4 fw-bold mb-4">
              Modern Management for Smarter Communities
            </h1>

            <p className="lead mb-5">
              A unified platform that connects residents, security, community
              managers, and administrators — making gated communities efficient,
              secure, and easier to manage.
            </p>

            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <NavLink to="/SignIn" className="btn btn-primary btn-lg">
                Get Started
              </NavLink>

              <a href="#features" className="btn btn-outline-light btn-lg">
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="page-section">
          <div className="container py-5">
            <div className="text-center mb-5">
              <h2 className="display-5 fw-bold">Key Features</h2>
              <p className="lead text-muted">
                Tools that streamline daily operations in your community
              </p>
            </div>

            <div className="row g-4">
              {[
                {
                  icon: <ShieldCheck size={32} strokeWidth={2.5} />,
                  title: "Visitor Management",
                  text: "Efficient check-in/check-out, QR verification, and security dashboards.",
                },
                {
                  icon: <CalendarCheck size={32} strokeWidth={2.5} />,
                  title: "Common Space Booking",
                  text: "Easily book community halls, amenities, sports facilities, and shared spaces with live availability.",
                },
                {
                  icon: <Wrench size={32} strokeWidth={2.5} />,
                  title: "Issue Tracking",
                  text: "Residents can report issues, track progress, and communicate with managers for quick resolutions.",
                },
                {
                  icon: <Bell size={32} strokeWidth={2.5} />,
                  title: "Announcements & Alerts",
                  text: "Broadcast important updates instantly across the community.",
                },
              ].map((item, i) => (
                <div className="col-12 col-sm-6 col-lg-3" key={i}>
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center p-4">
                      <div className="feature-icon mb-3">{item.icon}</div>
                      <h3 className="h4 mb-3">{item.title}</h3>
                      <p className="text-muted">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROLES SECTION */}
        <section id="roles" className="page-section bg-light">
          <div className="container py-5">
            <div className="text-center mb-5">
              <h2 className="display-5 fw-bold">Who Uses the Platform?</h2>
            </div>

            <div className="row g-4">
              {[
                { role: "Admin", desc: "Full control over communities, users, and system settings." },
                { role: "Community Manager", desc: "Manage residents, workers, amenities, and internal operations." },
                { role: "Resident", desc: "Pre-approve visitors, submit requests, view announcements." },
                { role: "Security", desc: "Verify visitors, manage entries, and maintain gate logs." },
              ].map((item, idx) => (
                <div className="col-12 col-sm-6 col-lg-3" key={idx}>
                  <div className="card h-100 text-center border-0 shadow">
                    <div className="card-body p-4">
                      <h3 className="h4 fw-bold mb-2">{item.role}</h3>
                      <p className="text-muted">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      {/* WRAPPER END */}

      {/* FOOTER */}
      <footer className="ue-footer">
        <div className=" py-5">
          <div className="row">
            {/* Left */}
            <div className="col-md-6 mb-4">
              <h5 className="footer-title">URBAN EASE</h5>
              <p className="footer-text">
                The premier platform for gated community management and discovery.
              </p>
            </div>

            {/* Right */}
            <div className="col-md-6 mb-4">
              <h5 className="footer-title">Resources</h5>
              <ul className="footer-links">
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <hr className="footer-divider" />

          <div className="text-center footer-copy">
            © 2025 URBAN EASE. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};
