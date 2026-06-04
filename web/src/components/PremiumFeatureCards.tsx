"use client";

import { memo } from "react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    id: "match",
    title: "Interest-first matching",
    desc: "Shared tags get priority in the queue. No overlap? You still match randomly in seconds.",
    icon: "✦",
    accent: "from-[#00E5FF]/20 to-[#FF00C2]/10",
    border: "hover:border-[#00E5FF]/50",
    glow: "hover:shadow-[0_0_32px_-8px_rgba(0,229,255,0.45)]",
  },
  {
    id: "secure",
    title: "Encrypted voice",
    desc: "Peer-to-peer WebRTC with DTLS-SRTP. Your voice never passes through our servers.",
    icon: "🔒",
    accent: "from-[#FF00C2]/20 to-[#FF0062]/10",
    border: "hover:border-[#FF00C2]/50",
    glow: "hover:shadow-[0_0_32px_-8px_rgba(255,0,194,0.45)]",
  },
  {
    id: "safety",
    title: "Built-in safety",
    desc: "Report, skip, or end any call instantly. Anonymous reports with rate limits.",
    icon: "🛡️",
    accent: "from-[#4CAF50]/15 to-[#00E5FF]/10",
    border: "hover:border-[#4CAF50]/50",
    glow: "hover:shadow-[0_0_32px_-8px_rgba(76,175,80,0.4)]",
  },
] as const;

interface PremiumFeatureCardsProps {
  compact?: boolean;
}

export const PremiumFeatureCards = memo(function PremiumFeatureCards({
  compact,
}: PremiumFeatureCardsProps) {
  if (compact) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            className={`feature-card-compact flex items-start gap-2.5 rounded-xl border border-white/10 bg-gradient-to-br ${f.accent} p-3`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-black/25 text-base"
              aria-hidden
            >
              {f.icon}
            </span>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white">{f.title}</h3>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#B0B8C8]">
                {f.desc}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
      {FEATURES.map((f, i) => (
        <motion.article
          key={f.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-24px" }}
          transition={{ delay: i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -6, transition: { duration: 0.2 } }}
          className={`feature-card-premium group relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br ${f.accent} p-6 transition-[border-color,box-shadow,transform] duration-300 ${f.border} ${f.glow}`}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          />
          <span
            className="feature-card-icon flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-2xl transition-transform duration-300 group-hover:scale-110"
            aria-hidden
          >
            {f.icon}
          </span>
          <h3 className="mt-5 text-lg font-bold text-white">{f.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#B0B8C8]">{f.desc}</p>
        </motion.article>
      ))}
    </div>
  );
});
