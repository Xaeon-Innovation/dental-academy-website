"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import type { Case } from "@/types/case";
import CaseDetailModal from "./CaseDetailModal";

interface CasesDisplayProps {
  cases: Case[];
}

export default function CasesDisplay({ cases }: CasesDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const devToolsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Ensure we're on the client before setting up event listeners
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts for screenshots
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Print Screen (multiple variations)
      if (e.key === "PrintScreen" || e.keyCode === 44 || e.code === "PrintScreen") {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
        return false;
      }
      // Disable Windows + Print Screen
      if ((e.ctrlKey || e.metaKey || e.altKey) && (e.key === "PrintScreen" || e.keyCode === 44)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
        return false;
      }
      // Disable Alt + Print Screen
      if (e.altKey && (e.key === "PrintScreen" || e.keyCode === 44)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
        return false;
      }
      // Disable F12 (DevTools)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return false;
      }
      // Disable Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return false;
      }
      // Disable Ctrl+Shift+C (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return false;
      }
      // Disable Ctrl+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return false;
      }
      // Disable Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U" || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Disable Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.keyCode === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Disable Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P" || e.keyCode === 80)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return false;
      }
      // Disable Ctrl+A (Select All)
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A" || e.keyCode === 65)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Disable copy completely
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      // Clear clipboard
      if (e.clipboardData) {
        e.clipboardData.setData("text/plain", "");
        e.clipboardData.setData("text/html", "");
      }
      return false;
    };

    // Disable cut
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      return false;
    };

    // Disable paste
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Detect dev tools opening (disabled by default to avoid false positives)
    // Only detects when DevTools is actually opened via keyboard shortcuts
    // Size-based detection is disabled as it causes too many false positives
    const detectDevTools = () => {
      // Disabled - too many false positives with window resizing
      // DevTools detection now only works via keyboard shortcut blocking
      return;
    };

    // Don't start automatic DevTools detection
    // Users can still be warned via keyboard shortcut blocking
    const startDevToolsDetection = () => {
      // Disabled to prevent false positives
      return;
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("dragstart", handleDragStart, { capture: true });
    document.addEventListener("selectstart", handleSelectStart, { capture: true });
    document.addEventListener("copy", handleCopy, { capture: true });
    document.addEventListener("cut", handleCut, { capture: true });
    document.addEventListener("paste", handlePaste, { capture: true });
    
    // Start dev tools detection
    startDevToolsDetection();

    // Disable image dragging specifically (after a short delay to ensure DOM is ready)
    setTimeout(() => {
      const images = containerRef.current?.querySelectorAll("img");
      images?.forEach((img) => {
        img.addEventListener("dragstart", handleDragStart);
        img.style.pointerEvents = "none";
        img.style.userSelect = "none";
        img.style.webkitUserSelect = "none";
      });
    }, 100);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("dragstart", handleDragStart, { capture: true });
      document.removeEventListener("selectstart", handleSelectStart, { capture: true });
      document.removeEventListener("copy", handleCopy, { capture: true });
      document.removeEventListener("cut", handleCut, { capture: true });
      document.removeEventListener("paste", handlePaste, { capture: true });
      if (devToolsIntervalRef.current) {
        clearInterval(devToolsIntervalRef.current);
        devToolsIntervalRef.current = null;
      }
    };
  }, [isMounted]);

  if (cases.length === 0) {
    return (
      <div className="py-12 text-center text-white/70">
        <p>Case studies and clinical cases coming soon.</p>
      </div>
    );
  }

  return (
    <>
      {/* Warning Message */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-pulse">
          <div className="rounded-lg border-2 border-red-500 bg-red-500/20 px-10 py-8 text-center backdrop-blur-lg shadow-2xl">
            <p className="text-2xl font-bold text-red-400 mb-3">
              ⚠️ SCREENSHOT PROTECTION ACTIVE
            </p>
            <p className="text-lg font-semibold text-white mb-2">
              Screenshots and copying are strictly prohibited
            </p>
            <p className="text-sm text-white/80">
              This content is protected by copyright. Unauthorized copying or distribution is illegal.
            </p>
          </div>
        </div>
      )}
      
      <div ref={containerRef} className="case-protected grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cases.map((caseItem) => (
        <div
          key={caseItem.id}
          onClick={() => setSelectedCase(caseItem)}
          className="case-protected group relative overflow-hidden rounded-lg border border-white/10 bg-black/40 cursor-pointer transition hover:border-white/20 hover:scale-[1.02]"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            pointerEvents: "auto",
          }}
        >
          {/* Watermark Overlay */}
          <div
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
            style={{
              background: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)",
            }}
          >
            <div className="text-white/20 text-2xl font-bold select-none">
              KALEIDOSCOPE DENTAL
            </div>
          </div>

          {/* Image Container */}
          <div className="relative aspect-video w-full overflow-hidden bg-black/20">
            {(() => {
              const images = caseItem.imageUrls?.length 
                ? caseItem.imageUrls 
                : caseItem.imageUrl 
                ? [caseItem.imageUrl] 
                : [];
              
              if (images.length === 0) {
                return (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-white/20" />
                  </div>
                );
              }
              
              return (
                <>
                  {/* Show first image, or carousel if multiple */}
                  {images.length === 1 ? (
                    <img
                      src={images[0]}
                      alt={caseItem.title}
                      className="h-full w-full object-cover"
                      draggable="false"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      style={{
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        pointerEvents: "none",
                        touchAction: "none",
                      }}
                    />
                  ) : (
                    <div className="relative h-full w-full">
                      {/* Image Gallery - show first image with indicator */}
                      <img
                        src={images[0]}
                        alt={caseItem.title}
                        className="h-full w-full object-cover"
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          pointerEvents: "none",
                          touchAction: "none",
                        }}
                      />
                      {/* Multiple images indicator */}
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                        {images.length} images
                      </div>
                    </div>
                  )}
                  {/* Additional protection overlay */}
                  <div
                    className="absolute inset-0 z-20"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      pointerEvents: "auto",
                    }}
                  />
                </>
              );
            })()}
          </div>

          {/* Content */}
          <div className="p-4 relative z-10">
            <h3 className="font-semibold text-white select-none">{caseItem.title}</h3>
            {caseItem.description && (
              <p className="mt-1 text-sm text-white/70 select-none line-clamp-3">
                {caseItem.description}
              </p>
            )}
          </div>

          {/* Additional protection layer */}
          <div
            className="absolute inset-0 z-30"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              pointerEvents: "auto",
            }}
          />
        </div>
      ))}
      </div>

      {/* Case Detail Modal */}
      <CaseDetailModal
        open={!!selectedCase}
        caseItem={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </>
  );
}
