import { useEffect, useState } from "react";

export interface UseImagePreloaderResult {
  images: HTMLImageElement[];
  loadedCount: number;
  isLoaded: boolean;
}

export default function useImagePreloader(
  sources: string[],
  minimumLoaded: number = sources.length
): UseImagePreloaderResult {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    if (!sources.length) return;

    let isCancelled = false;
    const imageElements: HTMLImageElement[] = new Array(sources.length);
    let count = 0;

    sources.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      img.decoding = "async";
      img.onload = () => {
        if (isCancelled) return;
        imageElements[index] = img;
        count += 1;
        setLoadedCount(count);
        if (count === sources.length) {
          setImages(imageElements);
        }
      };
      img.onerror = () => {
        if (isCancelled) return;
        count += 1;
        setLoadedCount(count);
      };
    });

    return () => {
      isCancelled = true;
    };
  }, [sources]);

  const isLoaded = loadedCount >= minimumLoaded && images.length > 0;

  return { images, loadedCount, isLoaded };
}

