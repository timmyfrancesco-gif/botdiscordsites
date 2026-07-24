"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format";
import { useLocale } from "@/lib/hooks/useLocale";
import { useHomepageData } from "@/lib/contexts/HomepageDataContext";
import type { Review } from "@/lib/types";

export default function Testimonials() {
  const { t } = useLocale();
  const { reviews: reviewsRes } = useHomepageData();
  const [liveReviews, setLiveReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (reviewsRes?.reviews) setLiveReviews(reviewsRes.reviews);
  }, [reviewsRes]);

  if (liveReviews.length === 0) return null;

  return (
    <section id="vouches" className="section-glow relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-4">
          {liveReviews.map((review, i) => (
            <motion.figure
              key={review.orderId}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative mb-4 flex min-h-[170px] break-inside-avoid flex-col justify-between overflow-hidden rounded-xl border border-white/[0.07] bg-background-elevated p-5 transition-colors duration-300 hover:brightness-110"
            >
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <motion.svg
                      key={starIndex}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 + starIndex * 0.06, type: "spring", stiffness: 300 }}
                      viewBox="0 0 20 20"
                      className={`h-3 w-3 ${starIndex < review.rating ? "text-[#fa8b90]" : "text-white/15"}`}
                      fill="currentColor"
                    >
                      <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
                    </motion.svg>
                  ))}
                </div>

                {review.comment ? (
                  <blockquote className="text-[13px] leading-relaxed text-white/70">
                    {review.comment}
                  </blockquote>
                ) : (
                  <blockquote className="text-[13px] italic leading-relaxed text-white/70">
                    {review.rating >= 4 ? t("reviews.greatExperience") : t("reviews.leftRating")}
                  </blockquote>
                )}
              </div>

              <figcaption className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.05] pt-3">
                <span className="truncate text-[11px] font-medium text-white/55">{t("reviews.verifiedBuyer")}</span>
                {review.createdAt && (
                  <span className="shrink-0 text-[11px] text-white/45">
                    {formatRelativeTime(new Date(review.createdAt).getTime())}
                  </span>
                )}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
