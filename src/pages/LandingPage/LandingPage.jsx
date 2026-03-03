import React from "react";
import HeroSection from "../../Components/HeroSection/HeroSection.jsx";
import Navbar from "../../Components/Navbar/Navbar.jsx";
import Footer from "../../Components/Footer/Footer.jsx";

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
