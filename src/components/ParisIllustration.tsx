"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ParisIllustration() {
  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 600 400"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sunset Drift Gradients */}
        <defs>
          {/* Floating Orbs - Soft pastels */}
          <radialGradient id="orbPeach" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB088" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFB088" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orbBlush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFC4D6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFC4D6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orbLavender" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D8B4FE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D8B4FE" stopOpacity="0" />
          </radialGradient>

          {/* Hero Gradient - Solar Orange → Luminous Pink → Glow Orange */}
          <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>

          {/* Agent Gradients */}
          <linearGradient id="agentA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="agentB" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
          <linearGradient id="agentC" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Floating orbs - Background glow */}
        <motion.ellipse
          cx="100"
          cy="120"
          rx="120"
          ry="100"
          fill="url(#orbPeach)"
          animate={{
            cx: [100, 120, 90, 100],
            cy: [120, 100, 140, 120],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.ellipse
          cx="500"
          cy="280"
          rx="140"
          ry="120"
          fill="url(#orbBlush)"
          animate={{
            cx: [500, 480, 520, 500],
            cy: [280, 300, 260, 280],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.ellipse
          cx="380"
          cy="80"
          rx="100"
          ry="80"
          fill="url(#orbLavender)"
          animate={{
            cx: [380, 400, 360, 380],
            cy: [80, 60, 100, 80],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Abstract Eiffel Tower - Minimalist geometric curves */}
        <motion.g filter="url(#softGlow)">
          {/* Main tower silhouette */}
          <motion.path
            d="M300 360 L265 180 Q300 155 335 180 L300 360"
            stroke="url(#heroGrad)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />

          {/* Elegant arches */}
          <motion.path
            d="M250 180 Q300 145 350 180"
            stroke="url(#heroGrad)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          />
          <motion.path
            d="M270 230 Q300 205 330 230"
            stroke="url(#heroGrad)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
          />
          <motion.path
            d="M280 290 Q300 270 320 290"
            stroke="url(#heroGrad)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}
          />

          {/* Tower spire */}
          <motion.path
            d="M300 180 L300 120"
            stroke="url(#heroGrad)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 1.3, ease: "easeOut" }}
          />

          {/* Top beacon */}
          <motion.circle
            cx="300"
            cy="110"
            r="10"
            fill="url(#agentA)"
            filter="url(#glow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.8 }}
          />
        </motion.g>

        {/* AI Network - Connected nodes representing intelligent agents */}
        {[
          { cx: 140, cy: 160, gradient: "agentA", delay: 0.2, size: 14 },
          { cx: 170, cy: 280, gradient: "agentB", delay: 0.4, size: 12 },
          { cx: 430, cy: 140, gradient: "agentC", delay: 0.5, size: 14 },
          { cx: 460, cy: 230, gradient: "agentA", delay: 0.7, size: 12 },
          { cx: 380, cy: 320, gradient: "agentB", delay: 0.9, size: 13 },
          { cx: 200, cy: 100, gradient: "agentC", delay: 0.3, size: 11 },
          { cx: 520, cy: 310, gradient: "agentA", delay: 0.8, size: 12 },
          { cx: 80, cy: 240, gradient: "agentB", delay: 0.6, size: 10 },
        ].map((node, i) => (
          <motion.g key={i}>
            {/* Outer ring */}
            <motion.circle
              cx={node.cx}
              cy={node.cy}
              r={node.size + 4}
              fill="none"
              stroke={`url(#${node.gradient})`}
              strokeWidth="1"
              strokeOpacity="0.3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                delay: node.delay + 1.5,
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Main node */}
            <motion.circle
              cx={node.cx}
              cy={node.cy}
              r={node.size}
              fill="white"
              stroke={`url(#${node.gradient})`}
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: node.delay + 1.2, duration: 0.5 }}
            />
            {/* Inner dot */}
            <motion.circle
              cx={node.cx}
              cy={node.cy}
              r={node.size * 0.4}
              fill={`url(#${node.gradient})`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: node.delay + 1.5, duration: 0.3 }}
            />
          </motion.g>
        ))}

        {/* Connection Lines - Neural network effect */}
        {[
          { x1: 154, y1: 160, x2: 250, y2: 180, delay: 1.8 },
          { x1: 170, y1: 268, x2: 265, y2: 180, delay: 1.9 },
          { x1: 416, y1: 140, x2: 350, y2: 180, delay: 2.0 },
          { x1: 448, y1: 230, x2: 335, y2: 180, delay: 2.1 },
          { x1: 380, y1: 307, x2: 320, y2: 290, delay: 2.2 },
          { x1: 200, y1: 111, x2: 250, y2: 180, delay: 2.3 },
          { x1: 508, y1: 310, x2: 448, y2: 230, delay: 2.4 },
          { x1: 140, y1: 172, x2: 170, y2: 268, delay: 2.5 },
          { x1: 430, y1: 152, x2: 460, y2: 218, delay: 2.6 },
          { x1: 92, y1: 240, x2: 158, y2: 280, delay: 2.7 },
        ].map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="url(#heroGrad)"
            strokeWidth="1.5"
            strokeOpacity="0.25"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: line.delay, duration: 0.6 }}
          />
        ))}

        {/* Decorative sparkles */}
        {[
          { x: 180, y: 140, size: 10 },
          { x: 420, y: 90, size: 8 },
          { x: 540, y: 260, size: 9 },
          { x: 110, y: 200, size: 7 },
          { x: 350, y: 350, size: 8 },
        ].map((sparkle, i) => (
          <motion.g key={`sparkle-${i}`}>
            <motion.path
              d={`M${sparkle.x} ${sparkle.y - sparkle.size} L${sparkle.x} ${sparkle.y + sparkle.size} M${sparkle.x - sparkle.size} ${sparkle.y} L${sparkle.x + sparkle.size} ${sparkle.y}`}
              stroke="url(#heroGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: 2.5 + i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          </motion.g>
        ))}

        {/* Abstract fashion element - elegant flowing curves */}
        <motion.path
          d="M80 340 Q100 300 90 270 Q120 285 130 265 Q125 305 145 340"
          stroke="#FFC4D6"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: [
              "M80 340 Q100 300 90 270 Q120 285 130 265 Q125 305 145 340",
              "M80 340 Q105 295 90 270 Q125 280 130 265 Q120 310 145 340",
              "M80 340 Q100 300 90 270 Q120 285 130 265 Q125 305 145 340",
            ],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating diamond shape */}
        <motion.path
          d="M520 100 L535 115 L520 130 L505 115 Z"
          stroke="url(#agentC)"
          strokeWidth="1.5"
          fill="rgba(139, 92, 246, 0.1)"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
