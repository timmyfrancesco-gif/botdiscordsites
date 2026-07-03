"use client";

import { motion } from "framer-motion";

const SUIT_CHAR: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣", "?": "" };

export default function PlayingCard({
  rank,
  suit,
  index = 0,
  hidden = false,
}: {
  rank: string;
  suit: string;
  index?: number;
  hidden?: boolean;
}) {
  const red = suit === "H" || suit === "D";
  const isHidden = hidden || rank === "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: -40, rotate: -12, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26, delay: index * 0.08 }}
      className={`relative flex h-[92px] w-[64px] items-center justify-center rounded-lg shadow-[0_6px_16px_-4px_rgba(0,0,0,0.55)] ${
        isHidden ? "" : "bg-[#fafafa]"
      } ${red ? "text-[#dc2626]" : "text-[#18181b]"}`}
    >
      {isHidden ? (
        <div className="h-full w-full rounded-lg bg-gradient-to-br from-[#2563eb] to-[#1e3a8a] p-1.5">
          <div className="h-full w-full rounded-md border-2 border-white/35 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.14)_0_6px,transparent_6px_12px)]" />
        </div>
      ) : (
        <>
          <span className="absolute left-[7px] top-[6px] text-[13px] font-extrabold leading-none">{rank}{SUIT_CHAR[suit]}</span>
          <span className="text-[30px] leading-none">{SUIT_CHAR[suit]}</span>
          <span className="absolute bottom-[6px] right-[7px] rotate-180 text-[13px] font-extrabold leading-none">{rank}{SUIT_CHAR[suit]}</span>
        </>
      )}
    </motion.div>
  );
}
