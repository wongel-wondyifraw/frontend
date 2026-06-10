'use client';
import React from "react";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PushpinFilled, UserOutlined, BankOutlined, CalendarOutlined, TeamOutlined } from "@ant-design/icons";
import "./HeroSection.css";

const HeroSection = () => {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const fadeIn = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1, x: 0, y: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.8 } };

  const fadeUp = (delay = 0) => prefersReducedMotion
    ? { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay } };

  return (
    <div className="hero-section">
      <div className="hero-content">
        <motion.div className="hero-left" {...fadeIn}>
          <motion.h1 {...fadeUp(0.2)}>
            <span className="Herotxt">Advanced Church Management Solution</span>
          </motion.h1>

          <motion.div
            className="hero-features"
            {...(prefersReducedMotion
              ? { initial: false, animate: { opacity: 1 } }
              : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.6 } })}
          >
            <div className="feature-pill"><UserOutlined /> Membership</div>
            <div className="feature-pill"><BankOutlined /> Finance</div>
            <div className="feature-pill"><CalendarOutlined /> Events</div>
            <div className="feature-pill"><TeamOutlined /> Check-in</div>
          </motion.div>

          <motion.button
            className="cta-button"
            {...(prefersReducedMotion ? {} : { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } })}
            onClick={() => router.push("/login")}
            type="button"
          >
            LOGIN
            <ArrowRight className="arrow-icon" aria-hidden="true" />
          </motion.button>
        </motion.div>

        <motion.div
          className="hero-right"
          initial={prefersReducedMotion ? false : "hidden"}
          animate="visible"
          variants={prefersReducedMotion ? undefined : {
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.3 } },
          }}
        >
          {["matthew-card", "daily-verse-card"].map((cardName, idx) => (
            <motion.div
              key={cardName}
              className={`card ${cardName}`}
              {...(prefersReducedMotion
                ? { initial: false, animate: { opacity: 1, y: 0 } }
                : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: idx * 0.3 } })}
            >
              <div className="card-title">
                {cardName === "matthew-card" ? "Mat 28:19" : (
                  <>
                    <PushpinFilled className="pin-icon" /> Daily Verse
                  </>
                )}
              </div>
              <div className="card-text">
                <strong>
                  {cardName === "matthew-card"
                    ? "Therefore go and make disciples of all nations..."
                    : "Trust in the Lord with all your heart and lean not on your own understanding..."}
                </strong>
              </div>
              <div className="card-footer">{cardName === "matthew-card" ? "From Jesus" : "Proverbs 3:5-6"}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
