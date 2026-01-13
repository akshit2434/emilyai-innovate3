"use client";

import React from "react";
import { motion } from "framer-motion";

export default function MarketingIllustration() {
    return (
        <div className="relative w-full h-full">
            <svg
                viewBox="0 0 600 450"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Gradient Definitions */}
                <defs>
                    {/* Background orbs */}
                    <radialGradient id="orbPeach" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFB088" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#FFB088" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="orbBlush" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFC4D6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#FFC4D6" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="orbLavender" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#D8B4FE" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#D8B4FE" stopOpacity="0" />
                    </radialGradient>

                    {/* Hero gradient */}
                    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="50%" stopColor="#EC4899" />
                        <stop offset="100%" stopColor="#FB923C" />
                    </linearGradient>

                    {/* Product gradients */}
                    <linearGradient id="perfumeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#E6E0F8" />
                        <stop offset="100%" stopColor="#D8B4FE" />
                    </linearGradient>
                    <linearGradient id="chocolateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8B4513" />
                        <stop offset="100%" stopColor="#5D3A1A" />
                    </linearGradient>
                    <linearGradient id="cosmeticGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFC4D6" />
                        <stop offset="100%" stopColor="#FFB088" />
                    </linearGradient>
                    <linearGradient id="techGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4A5568" />
                        <stop offset="100%" stopColor="#2D3748" />
                    </linearGradient>

                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.15" />
                    </filter>
                </defs>

                {/* Background orbs */}
                <motion.ellipse
                    cx="100"
                    cy="100"
                    rx="150"
                    ry="120"
                    fill="url(#orbPeach)"
                    animate={{ cx: [100, 120, 90, 100], cy: [100, 80, 120, 100] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.ellipse
                    cx="520"
                    cy="350"
                    rx="130"
                    ry="110"
                    fill="url(#orbBlush)"
                    animate={{ cx: [520, 500, 540, 520], cy: [350, 370, 330, 350] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.ellipse
                    cx="450"
                    cy="100"
                    rx="100"
                    ry="90"
                    fill="url(#orbLavender)"
                    animate={{ cx: [450, 470, 430, 450], cy: [100, 80, 120, 100] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Central AI Brain/Network Hub */}
                <motion.g filter="url(#glow)">
                    {/* Central hexagon representing AI */}
                    <motion.path
                        d="M300 180 L340 200 L340 240 L300 260 L260 240 L260 200 Z"
                        fill="white"
                        stroke="url(#heroGrad)"
                        strokeWidth="3"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    />
                    <motion.text
                        x="300"
                        y="228"
                        textAnchor="middle"
                        fill="url(#heroGrad)"
                        fontSize="16"
                        fontWeight="bold"
                        fontFamily="system-ui"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        AI
                    </motion.text>

                    {/* Pulsing ring around AI */}
                    <motion.path
                        d="M300 165 L350 190 L350 250 L300 275 L250 250 L250 190 Z"
                        fill="none"
                        stroke="url(#heroGrad)"
                        strokeWidth="1.5"
                        strokeOpacity="0.3"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </motion.g>

                {/* Product Cards floating around AI */}

                {/* Perfume Bottle - Top Left */}
                <motion.g
                    filter="url(#shadow)"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    <motion.g
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <rect x="80" y="120" width="100" height="130" rx="16" fill="white" />
                        {/* Perfume bottle shape */}
                        <rect x="115" y="155" width="30" height="50" rx="4" fill="url(#perfumeGrad)" />
                        <rect x="120" y="145" width="20" height="12" rx="2" fill="#9F7AEA" />
                        <rect x="127" y="135" width="6" height="12" fill="#805AD5" />
                        <circle cx="130" cy="193" r="8" fill="#805AD5" fillOpacity="0.3" />
                        <text x="130" y="225" textAnchor="middle" fontSize="10" fill="#645D6E" fontWeight="500">Luxe Parfum</text>
                    </motion.g>
                </motion.g>

                {/* Chocolate Box - Top Right */}
                <motion.g
                    filter="url(#shadow)"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                >
                    <motion.g
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    >
                        <rect x="420" y="100" width="100" height="130" rx="16" fill="white" />
                        {/* Chocolate box */}
                        <rect x="445" y="130" width="50" height="35" rx="4" fill="url(#chocolateGrad)" />
                        <rect x="448" y="133" width="14" height="29" rx="2" fill="#6B4423" />
                        <rect x="463" y="133" width="14" height="29" rx="2" fill="#8B5A2B" />
                        <rect x="478" y="133" width="14" height="29" rx="2" fill="#6B4423" />
                        {/* Ribbon */}
                        <rect x="445" y="143" width="50" height="6" fill="#D4AF37" />
                        <circle cx="470" cy="180" r="6" fill="#D4AF37" />
                        <text x="470" y="210" textAnchor="middle" fontSize="10" fill="#645D6E" fontWeight="500">Artisan Choco</text>
                    </motion.g>
                </motion.g>

                {/* Cosmetics - Bottom Left */}
                <motion.g
                    filter="url(#shadow)"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                >
                    <motion.g
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    >
                        <rect x="60" y="280" width="100" height="130" rx="16" fill="white" />
                        {/* Lipstick */}
                        <rect x="85" y="310" width="20" height="55" rx="10" fill="url(#cosmeticGrad)" />
                        <rect x="85" y="305" width="20" height="15" rx="3" fill="#2D2438" />
                        <ellipse cx="95" cy="325" rx="8" ry="4" fill="#E11D48" />
                        {/* Compact */}
                        <circle cx="125" cy="345" r="18" fill="#FFF0F3" stroke="#FFC4D6" strokeWidth="2" />
                        <circle cx="125" cy="345" r="12" fill="url(#cosmeticGrad)" />
                        <text x="110" y="390" textAnchor="middle" fontSize="10" fill="#645D6E" fontWeight="500">Beauty Co</text>
                    </motion.g>
                </motion.g>

                {/* Electronics - Bottom Right */}
                <motion.g
                    filter="url(#shadow)"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4, duration: 0.6 }}
                >
                    <motion.g
                        animate={{ y: [0, -12, 0] }}
                        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    >
                        <rect x="440" y="280" width="100" height="130" rx="16" fill="white" />
                        {/* Smartphone */}
                        <rect x="465" y="300" width="35" height="65" rx="6" fill="url(#techGrad)" />
                        <rect x="468" y="305" width="29" height="52" rx="3" fill="#1A202C" />
                        {/* Screen glow */}
                        <rect x="470" y="307" width="25" height="48" rx="2" fill="#4299E1" fillOpacity="0.3" />
                        <rect x="475" y="315" width="15" height="3" rx="1" fill="#63B3ED" />
                        <rect x="475" y="322" width="12" height="3" rx="1" fill="#63B3ED" />
                        <circle cx="482" cy="350" r="3" fill="#F97316" />
                        <text x="490" y="390" textAnchor="middle" fontSize="10" fill="#645D6E" fontWeight="500">TechPro</text>
                    </motion.g>
                </motion.g>

                {/* Connection lines from products to AI */}
                {[
                    { x1: 180, y1: 185, x2: 260, y2: 210, delay: 1.6 },
                    { x1: 420, y1: 165, x2: 340, y2: 210, delay: 1.7 },
                    { x1: 160, y1: 345, x2: 265, y2: 250, delay: 1.8 },
                    { x1: 440, y1: 345, x2: 335, y2: 250, delay: 1.9 },
                ].map((line, i) => (
                    <motion.line
                        key={i}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="url(#heroGrad)"
                        strokeWidth="2"
                        strokeDasharray="8 4"
                        strokeOpacity="0.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: line.delay, duration: 0.8 }}
                    />
                ))}

                {/* Data/Analytics floating elements */}
                {[
                    { x: 200, y: 90, text: "+248%", color: "#10B981" },
                    { x: 400, y: 260, text: "↑ ROI", color: "#F97316" },
                    { x: 320, y: 380, text: "10x", color: "#EC4899" },
                ].map((stat, i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 2 + i * 0.2, duration: 0.5 }}
                    >
                        <motion.g
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <rect
                                x={stat.x - 30}
                                y={stat.y - 12}
                                width="60"
                                height="24"
                                rx="12"
                                fill="white"
                                stroke={stat.color}
                                strokeWidth="1.5"
                            />
                            <text
                                x={stat.x}
                                y={stat.y + 5}
                                textAnchor="middle"
                                fill={stat.color}
                                fontSize="11"
                                fontWeight="bold"
                                fontFamily="system-ui"
                            >
                                {stat.text}
                            </text>
                        </motion.g>
                    </motion.g>
                ))}

                {/* Sparkle effects */}
                {[
                    { x: 250, y: 130, delay: 0 },
                    { x: 350, y: 300, delay: 0.5 },
                    { x: 180, y: 250, delay: 1 },
                    { x: 420, y: 230, delay: 1.5 },
                ].map((sparkle, i) => (
                    <motion.g key={i}>
                        <motion.path
                            d={`M${sparkle.x} ${sparkle.y - 8} L${sparkle.x} ${sparkle.y + 8} M${sparkle.x - 8} ${sparkle.y} L${sparkle.x + 8} ${sparkle.y}`}
                            stroke="url(#heroGrad)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: sparkle.delay,
                                ease: "easeInOut",
                            }}
                        />
                    </motion.g>
                ))}
            </svg>
        </div>
    );
}
