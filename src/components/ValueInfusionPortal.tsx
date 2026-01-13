"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugin
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export default function ValueInfusionPortal() {
    const containerRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<SVGGElement>(null);
    const elementsRef = useRef<(SVGGElement | null)[]>([]);

    useEffect(() => {
        if (!containerRef.current) return;

        // Create explosion effect on scroll
        const elements = elementsRef.current.filter(Boolean);

        elements.forEach((el, i) => {
            if (!el) return;

            gsap.fromTo(
                el,
                {
                    x: 0,
                    y: 0,
                    scale: 0.85,
                    opacity: 0.6
                },
                {
                    x: (i % 2 === 0 ? 1 : -1) * (15 + i * 6),
                    y: (i < 3 ? -1 : 1) * (12 + i * 4),
                    scale: 1,
                    opacity: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top center",
                        end: "bottom center",
                        scrub: 1,
                    },
                }
            );
        });

        return () => {
            ScrollTrigger.getAll().forEach(st => st.kill());
        };
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <svg
                viewBox="0 0 600 500"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Gradient & Marker Definitions */}
                <defs>
                    {/* Background orbs */}
                    <radialGradient id="portalGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#EC4899" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </radialGradient>

                    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="50%" stopColor="#EC4899" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>

                    <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>

                    <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF0E5" />
                        <stop offset="100%" stopColor="#FFC4D6" />
                    </linearGradient>

                    <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFC4D6" />
                        <stop offset="100%" stopColor="#D8B4FE" />
                    </linearGradient>

                    <linearGradient id="cardGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D8B4FE" />
                        <stop offset="100%" stopColor="#FFF0E5" />
                    </linearGradient>

                    {/* Arrow markers */}
                    <marker
                        id="arrowhead"
                        markerWidth="12"
                        markerHeight="10"
                        refX="10"
                        refY="5"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path
                            d="M0,0 L12,5 L0,10 L3,5 Z"
                            fill="url(#arrowGrad)"
                        />
                    </marker>

                    <marker
                        id="arrowheadPink"
                        markerWidth="12"
                        markerHeight="10"
                        refX="10"
                        refY="5"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path
                            d="M0,0 L12,5 L0,10 L3,5 Z"
                            fill="#EC4899"
                        />
                    </marker>

                    <marker
                        id="arrowheadViolet"
                        markerWidth="12"
                        markerHeight="10"
                        refX="10"
                        refY="5"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path
                            d="M0,0 L12,5 L0,10 L3,5 Z"
                            fill="#8B5CF6"
                        />
                    </marker>

                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.12" />
                    </filter>
                </defs>

                {/* Portal glow background */}
                <motion.ellipse
                    cx="300"
                    cy="250"
                    rx="180"
                    ry="180"
                    fill="url(#portalGlow)"
                    animate={{
                        rx: [180, 200, 180],
                        ry: [180, 200, 180],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Central AI Portal */}
                <g ref={portalRef}>
                    {/* Outer ring */}
                    <motion.circle
                        cx="300"
                        cy="250"
                        r="90"
                        fill="none"
                        stroke="url(#heroGrad)"
                        strokeWidth="3"
                        strokeDasharray="20 10"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        style={{ transformOrigin: "300px 250px" }}
                    />

                    {/* Inner ring */}
                    <motion.circle
                        cx="300"
                        cy="250"
                        r="60"
                        fill="none"
                        stroke="url(#heroGrad)"
                        strokeWidth="2"
                        strokeOpacity="0.5"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        style={{ transformOrigin: "300px 250px" }}
                    />

                    {/* Core glow */}
                    <circle cx="300" cy="250" r="45" fill="url(#innerGlow)" />

                    {/* AI Text */}
                    <motion.text
                        x="300"
                        y="258"
                        textAnchor="middle"
                        fill="url(#heroGrad)"
                        fontSize="26"
                        fontWeight="bold"
                        fontFamily="system-ui"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        AI
                    </motion.text>
                </g>

                {/* Exploding Elements - Work Sample Placeholders (repositioned to avoid overlap) */}

                {/* Element 1: Research Report - Top Left */}
                <g ref={el => { elementsRef.current[0] = el; }} filter="url(#softShadow)">
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <rect x="40" y="70" width="110" height="85" rx="12" fill="white" />
                        <rect x="40" y="70" width="110" height="22" rx="12" fill="url(#cardGrad1)" />
                        <text x="95" y="85" textAnchor="middle" fontSize="9" fill="#2D2438" fontWeight="600">Research Report</text>
                        {/* Placeholder lines */}
                        <rect x="52" y="102" width="70" height="5" rx="2" fill="#E5E5E5" />
                        <rect x="52" y="112" width="55" height="5" rx="2" fill="#E5E5E5" />
                        <rect x="52" y="122" width="60" height="5" rx="2" fill="#E5E5E5" />
                        <rect x="52" y="132" width="35" height="5" rx="2" fill="#FFB088" />
                    </motion.g>
                </g>

                {/* Element 2: Social Post - Top Right */}
                <g ref={el => { elementsRef.current[1] = el; }} filter="url(#softShadow)">
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect x="450" y="55" width="110" height="90" rx="12" fill="white" />
                        <rect x="450" y="55" width="110" height="22" rx="12" fill="url(#cardGrad2)" />
                        <text x="505" y="70" textAnchor="middle" fontSize="9" fill="#2D2438" fontWeight="600">Social Post</text>
                        {/* Post preview */}
                        <rect x="460" y="87" width="90" height="45" rx="6" fill="#F5F5F5" />
                        <circle cx="474" cy="100" r="7" fill="#FFC4D6" />
                        <rect x="486" y="96" width="45" height="4" rx="2" fill="#D0D0D0" />
                        <rect x="486" y="104" width="28" height="4" rx="2" fill="#D0D0D0" />
                        <rect x="460" y="118" width="55" height="3" rx="1" fill="#E0E0E0" />
                        <rect x="460" y="125" width="40" height="3" rx="1" fill="#E0E0E0" />
                    </motion.g>
                </g>

                {/* Element 3: Analytics Dashboard - Bottom Left */}
                <g ref={el => { elementsRef.current[2] = el; }} filter="url(#softShadow)">
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <rect x="55" y="340" width="120" height="85" rx="12" fill="white" />
                        <rect x="55" y="340" width="120" height="22" rx="12" fill="url(#cardGrad3)" />
                        <text x="115" y="355" textAnchor="middle" fontSize="9" fill="#2D2438" fontWeight="600">Analytics</text>
                        {/* Chart bars */}
                        <rect x="70" y="390" width="11" height="22" rx="2" fill="#D8B4FE" />
                        <rect x="88" y="378" width="11" height="34" rx="2" fill="#EC4899" />
                        <rect x="106" y="382" width="11" height="30" rx="2" fill="#F97316" />
                        <rect x="124" y="370" width="11" height="42" rx="2" fill="#8B5CF6" />
                        <rect x="142" y="375" width="11" height="37" rx="2" fill="#FFC4D6" />
                    </motion.g>
                </g>

                {/* Element 4: Ad Creative - Bottom Right */}
                <g ref={el => { elementsRef.current[3] = el; }} filter="url(#softShadow)">
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <rect x="430" y="330" width="120" height="100" rx="12" fill="white" />
                        <rect x="430" y="330" width="120" height="22" rx="12" fill="url(#cardGrad1)" />
                        <text x="490" y="345" textAnchor="middle" fontSize="9" fill="#2D2438" fontWeight="600">Ad Creative</text>
                        {/* Ad preview */}
                        <rect x="442" y="362" width="96" height="55" rx="6" fill="url(#heroGrad)" fillOpacity="0.15" />
                        <rect x="452" y="378" width="45" height="7" rx="2" fill="#2D2438" fillOpacity="0.2" />
                        <rect x="452" y="390" width="32" height="5" rx="2" fill="#2D2438" fillOpacity="0.15" />
                        <rect x="452" y="402" width="28" height="10" rx="4" fill="url(#heroGrad)" />
                    </motion.g>
                </g>

                {/* Element 5: Brand Voice - Top Center */}
                <g ref={el => { elementsRef.current[4] = el; }} filter="url(#softShadow)">
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                    >
                        <rect x="220" y="30" width="160" height="65" rx="12" fill="white" />
                        <rect x="220" y="30" width="160" height="20" rx="10" fill="url(#cardGrad2)" />
                        <text x="300" y="44" textAnchor="middle" fontSize="9" fill="#2D2438" fontWeight="600">Brand Voice</text>
                        {/* Tags */}
                        <rect x="238" y="58" width="38" height="15" rx="7" fill="#FFF0E5" />
                        <text x="257" y="69" textAnchor="middle" fontSize="7" fill="#F97316">Bold</text>
                        <rect x="282" y="58" width="38" height="15" rx="7" fill="#FFC4D6" />
                        <text x="301" y="69" textAnchor="middle" fontSize="7" fill="#EC4899">Chic</text>
                        <rect x="326" y="58" width="38" height="15" rx="7" fill="#D8B4FE" />
                        <text x="345" y="69" textAnchor="middle" fontSize="7" fill="#8B5CF6">Premium</text>
                    </motion.g>
                </g>

                {/* Element 6: Video Script - Bottom Center */}
                <g ref={el => { elementsRef.current[5] = el; }} filter="url(#softShadow)">
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <rect x="220" y="410" width="160" height="70" rx="12" fill="white" />
                        <rect x="220" y="410" width="160" height="20" rx="10" fill="url(#cardGrad3)" />
                        <text x="300" y="424" textAnchor="middle" fontSize="9" fill="#2D2438" fontWeight="600">Video Script</text>
                        {/* Play button */}
                        <circle cx="300" cy="455" r="15" fill="url(#heroGrad)" />
                        <polygon points="296,449 296,461 306,455" fill="white" />
                    </motion.g>
                </g>

                {/* Connection arrows from portal to elements - with proper arrowheads */}
                {[
                    { x1: 220, y1: 200, x2: 150, y2: 130, marker: "arrowhead" },
                    { x1: 380, y1: 200, x2: 450, y2: 110, marker: "arrowheadPink" },
                    { x1: 220, y1: 300, x2: 145, y2: 360, marker: "arrowheadViolet" },
                    { x1: 380, y1: 300, x2: 455, y2: 355, marker: "arrowhead" },
                    { x1: 300, y1: 160, x2: 300, y2: 95, marker: "arrowheadPink" },
                    { x1: 300, y1: 340, x2: 300, y2: 410, marker: "arrowheadViolet" },
                ].map((arrow, i) => (
                    <motion.line
                        key={i}
                        x1={arrow.x1}
                        y1={arrow.y1}
                        x2={arrow.x2}
                        y2={arrow.y2}
                        stroke="url(#heroGrad)"
                        strokeWidth="2"
                        strokeOpacity="0.6"
                        markerEnd={`url(#${arrow.marker})`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.15, duration: 0.8 }}
                    />
                ))}

                {/* Animated pulse on arrows */}
                {[
                    { cx: 185, cy: 165, delay: 0 },
                    { cx: 415, cy: 155, delay: 0.3 },
                    { cx: 182, cy: 330, delay: 0.6 },
                    { cx: 417, cy: 327, delay: 0.9 },
                    { cx: 300, cy: 127, delay: 1.2 },
                    { cx: 300, cy: 375, delay: 1.5 },
                ].map((pulse, i) => (
                    <motion.circle
                        key={`pulse-${i}`}
                        cx={pulse.cx}
                        cy={pulse.cy}
                        r="4"
                        fill="url(#heroGrad)"
                        animate={{
                            scale: [0.8, 1.5, 0.8],
                            opacity: [0.8, 0.3, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: pulse.delay,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Floating particles */}
                {[
                    { cx: 180, cy: 210, r: 4 },
                    { cx: 420, cy: 210, r: 3 },
                    { cx: 140, cy: 270, r: 5 },
                    { cx: 460, cy: 270, r: 4 },
                    { cx: 200, cy: 340, r: 3 },
                    { cx: 400, cy: 190, r: 4 },
                ].map((particle, i) => (
                    <motion.circle
                        key={`particle-${i}`}
                        cx={particle.cx}
                        cy={particle.cy}
                        r={particle.r}
                        fill="url(#heroGrad)"
                        animate={{
                            y: [0, -12, 0],
                            opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}
