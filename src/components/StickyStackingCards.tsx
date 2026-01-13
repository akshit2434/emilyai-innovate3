"use client";

import React from "react";
import { motion } from "framer-motion";

interface StackingCard {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    bgColor: string;
}

interface StickyStackingCardsProps {
    cards: StackingCard[];
    sectionTitle: string;
    sectionSubtitle: string;
}

export default function StickyStackingCards({
    cards,
    sectionTitle,
    sectionSubtitle
}: StickyStackingCardsProps) {
    return (
        <section id="features" className="py-28 px-6 relative overflow-hidden">
            {/* Soft background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--cream-paper)] via-white to-[var(--cream-paper)]" />

            {/* Decorative blobs */}
            <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-[var(--soft-peach)]/30 blur-3xl" />
            <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[var(--dream-lavender)]/30 blur-3xl" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <p className="text-xs font-semibold text-[var(--solar-orange)] uppercase tracking-[0.2em] mb-4">
                        {sectionSubtitle}
                    </p>
                    <h2 className="text-4xl md:text-5xl font-[var(--font-playfair)] font-medium text-[var(--charcoal-plum)]">
                        {sectionTitle}
                    </h2>
                </motion.div>

                {/* Cards Grid - Simple 2x2 */}
                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                    {cards.map((card, i) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group"
                        >
                            <div className={`${card.bgColor} rounded-3xl p-8 lg:p-10 border border-white/80 shadow-lg shadow-[var(--charcoal-plum)]/[0.04] hover:shadow-xl transition-all duration-300`}>
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-2xl ${card.gradient} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    {card.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl lg:text-2xl font-semibold text-[var(--charcoal-plum)] mb-3">
                                    {card.title}
                                </h3>
                                <p className="text-[var(--mauve-gray)] leading-relaxed">
                                    {card.subtitle}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
