'use client';
import React from "react";
import HeroSection from "../../Components/HeroSection/HeroSection";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";

import "./LandingPage.css";

const LandingPage = () => {

  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection />
      <Footer />
    </div>

  )
};

export default LandingPage;
