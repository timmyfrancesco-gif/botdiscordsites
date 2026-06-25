"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
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
    <section id="vouches" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t("reviews.eyebrow")}
          title={t("reviews.title")}
          description={t("reviews.description")}
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Live reviews from API */}
          {liveReviews.map((review, i) => (
            <motion.figure
              key={review.orderId}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="glass-panel flex flex-col rounded-2xl p-6"
            >
              <div className="mb-3 flex gap-1" aria-hidden>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <svg
                    key={starIndex}
                    viewBox="0 0 20 20"
                    className={`h-4 w-4 ${starIndex < review.rating ? "text-yellow-400" : "text-border"}`}
                    fill="currentColor"
                  >
                    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
                  </svg>
                ))}
              </div>
              {review.comment ? (
                <blockquote className="flex-1 text-sm text-foreground">
                  &ldquo;{review.comment}&rdquo;
                </blockquote>
              ) : (
                <blockquote className="flex-1 text-sm text-muted italic">
                  {review.rating >= 4 ? t("reviews.greatExperience") : t("reviews.leftRating")}
                </blockquote>
              )}
              <figcaption className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>
                  <span className="font-semibold text-foreground">{t("reviews.verifiedBuyer")}</span>
                  {" — "}{t("reviews.shopCustomer")}
                </span>
                {review.createdAt && (
                  <span>{formatRelativeTime(new Date(review.createdAt).getTime())}</span>
                )}
              </figcaption>
            </motion.figure>
          ))}

        </div>
      </div>
    </section>
  );
}
