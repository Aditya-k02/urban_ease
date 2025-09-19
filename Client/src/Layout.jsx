import { Navbar } from "./components/Navbar"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import './assets/css/Layout.css'
import { useEffect } from "react"
import React, { useState } from "react";

export const Layout = ({ userType, ads }) => {

    const [adsState, setAdsState] = useState(null);
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refetchAds = () => {
        setRefreshTrigger((t) => t + 1);
    };

    useEffect(() => {
        // Fetch ads for the logged-in user's community
        const fetchAds = async () => {
            try {
                const res = await fetch("http://localhost:3000/ads", {
                    credentials: "include",
                });
                if (!res.ok) return;
                const json = await res.json();
                if (json && Array.isArray(json.ads)) {
                    setAdsState(json.ads);
                    setCurrent(0);
                }

            } catch (err) {
                console.error("Failed to fetch ads:", err);
            }
        };

        fetchAds();
    }, [ads, refreshTrigger]);

    useEffect(() => {
        const slideList = (adsState && adsState.length > 0) ? adsState : (ads || []);
        if (!slideList || slideList.length <= 1) return;

        const t = setInterval(() => {
            if (paused) return;
            setCurrent((c) => (c + 1) % slideList.length);
        }, 4000);

        return () => clearInterval(t);
    }, [adsState, ads, paused]);

    const slides = (adsState && adsState.length > 0) ? adsState : (ads || []);
    const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
    const next = () => setCurrent((c) => (c + 1) % slides.length);



    return (
        <>
            <Navbar userType={userType} />
            <div className="bodyContainer">
                <div className="adCon d-flex justify-content-center align-items-center">
                    <div className="advertisement" id="ad-slider" >
                        {(() => {
                            if (!slides || slides.length === 0) {
                                return (
                                    <div className="empty-ad-box d-flex justify-content-center align-items-center"
                                        style={{
                                            height: '100%',
                                            width: '100%',
                                            backgroundColor: '#83c1ff65',
                                            border: '2px dashed #0044b9ff',
                                            borderRadius: 10
                                        }}>
                                        <p className="fs-4 fw-bold text-primary">Advertisement</p>
                                    </div>
                                );
                            }

                            const imgSrc = (ad) =>
                                `http://localhost:3000/${(ad.imagePath || ad.path || ad.image || "").replace(/\\/g, "/")}`;

                            const handleAdClick = () => {
                                const currentAd = slides[current];
                                if (currentAd && currentAd.link) {
                                    window.open(currentAd.link, "_blank");
                                }
                            };

                            return (
                                <div
                                    className="ad-slider-inner"
                                    onMouseEnter={() => setPaused(true)}
                                    onMouseLeave={() => setPaused(false)}
                                    style={{
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        height: "100%",
                                        width: "100%",
                                    }}
                                >
                                    <button
                                        className="ad-nav ad-prev"
                                        onClick={prev}
                                        aria-label="Previous"
                                        style={{ background: "transparent", border: "none", cursor: "pointer" }}
                                    >
                                        ◀
                                    </button>

                                    {slides.map((ad, index) => (
                                        <img
                                            key={ad._id || index}
                                            src={imgSrc(ad)}
                                            className="ad-slide"
                                            alt={ad.title || "Ad"}
                                            onClick={handleAdClick}
                                            style={{
                                                display: index === current ? "block" : "none",
                                                width: "100%",
                                                height: "100%",
                                                cursor: ad.link ? "pointer" : "default",
                                            }}
                                        />
                                    ))}

                                    <button
                                        className="ad-nav ad-next"
                                        onClick={next}
                                        aria-label="Next"
                                        style={{ background: "transparent", border: "none", cursor: "pointer" }}
                                    >
                                        ▶
                                    </button>

                                    <div
                                        className="ad-indicators"
                                        style={{
                                            position: "absolute",
                                            bottom: 6,
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            display: "flex",
                                            gap: 6,
                                        }}
                                    >
                                        {slides.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrent(i)}
                                                aria-label={`Go to slide ${i + 1}`}
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    background: i === current ? "#0040c1" : "rgba(0,0,0,0.2)",
                                                    border: "none",
                                                    padding: 0,
                                                    cursor: "pointer",
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}


                    </div>
                </div>


                <div className="contentCon">
                    <Outlet context={{ onAdCreated: refetchAds }} />
                </div>
            </div>

        </>
    )
}