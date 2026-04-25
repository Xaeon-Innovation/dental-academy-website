"use client";

import React, { useEffect, useState } from "react";
import { HeroParallax, type HeroParallaxProduct } from "@/components/ui/hero-parallax";
import { getCases } from "@/lib/actions/case";
import type { Case } from "@/types/case";
import CaseGalleryModal from "@/components/CaseGalleryModal";

export default function CasesClient() {
  const [cases, setCases] = useState<Case[]>([]);
  const [products, setProducts] = useState<HeroParallaxProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    async function loadCases() {
      try {
        const caseData = await getCases();
        setCases(caseData);

        const productsData: HeroParallaxProduct[] = caseData
          .filter((caseItem: Case) => {
            if (!caseItem.images || caseItem.images.length === 0) return false;
            const primaryIndex = caseItem.primaryImageIndex ?? 0;
            return caseItem.images[primaryIndex] || caseItem.images[0];
          })
          .map((caseItem: Case) => {
            const primaryIndex = caseItem.primaryImageIndex ?? 0;
            const primaryImage = caseItem.images[primaryIndex] || caseItem.images[0] || "#";

            return {
              title: caseItem.title,
              link: `#case-${caseItem.id}`,
              thumbnail: primaryImage,
            };
          });
        setProducts(productsData);
      } catch (err) {
        console.error("Failed to load cases:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  const handleCaseClick = (caseId: string) => {
    const caseItem = cases.find((c) => c.id === caseId);
    if (caseItem && caseItem.images && caseItem.images.length > 0) {
      setSelectedCase(caseItem);
      setGalleryOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/70">Loading cases...</p>
      </div>
    );
  }

  return (
    <>
      <HeroParallax
        products={products}
        title="Clinical cases"
        description="Case studies and clinical cases from our academy. Explore outcomes and approaches from real practice."
        onCaseClick={handleCaseClick}
      />

      {selectedCase ? (
        <CaseGalleryModal
          isOpen={galleryOpen}
          onClose={() => {
            setGalleryOpen(false);
            setSelectedCase(null);
          }}
          images={selectedCase.images}
          currentIndex={selectedCase.primaryImageIndex ?? 0}
          title={selectedCase.title}
        />
      ) : null}
    </>
  );
}

