"use client";

import { motion } from "framer-motion";

export function ScoreGauge({ score, label }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // Determine color based on score
    let color = "#39ff14"; // Green
    if (score > 80) color = "#ef4444"; // Red (Too complex?)
    else if (score > 50) color = "#eab308"; // Yellow

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="#1f2937"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke={color}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{score}</span>
                </div>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        </div>
    );
}
