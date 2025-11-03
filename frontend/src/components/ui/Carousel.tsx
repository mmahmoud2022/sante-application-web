/**
 * Carousel Component
 * Interactive carousel with smooth navigation for appointments, patients, etc.
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface CarouselProps {
  children: React.ReactNode[];
  itemsPerView?: number;
  gap?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  className?: string;
}

export function Carousel({
  children,
  itemsPerView = 1,
  gap = 16,
  autoPlay = false,
  autoPlayInterval = 5000,
  showIndicators = true,
  className,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const itemCount = children.length;
  const maxIndex = Math.max(0, itemCount - itemsPerView);

  // Auto-play functionality
  const handlePrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev >= maxIndex) {
        return 0; // Loop back to start
      }
      return prev + 1;
    });
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, maxIndex]);

  useEffect(() => {
    if (!autoPlay || itemCount <= itemsPerView) {
      return;
    }

    const interval = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, itemCount, itemsPerView, handleNext]);

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Don't show navigation if all items fit in view
  const showNavigation = itemCount > itemsPerView;

  return (
    <div className={clsx('relative', className)}>
      {/* Carousel Container */}
      <div className="overflow-hidden">
        <div
          ref={carouselRef}
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            gap: `${gap}px`,
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                width: `calc((100% - ${gap * (itemsPerView - 1)}px) / ${itemsPerView})`,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {showNavigation && (
        <>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={clsx(
              'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4',
              'p-2 rounded-full',
              'bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md',
              'border-2 border-primary-200 dark:border-primary-700',
              'text-primary-600 dark:text-primary-400',
              'shadow-lg hover:shadow-xl',
              'transition-all duration-300',
              'hover:scale-110 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              'z-10'
            )}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex >= maxIndex && !autoPlay}
            className={clsx(
              'absolute right-0 top-1/2 -translate-y-1/2 translate-x-4',
              'p-2 rounded-full',
              'bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md',
              'border-2 border-primary-200 dark:border-primary-700',
              'text-primary-600 dark:text-primary-400',
              'shadow-lg hover:shadow-xl',
              'transition-all duration-300',
              'hover:scale-110 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              'z-10'
            )}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && showNavigation && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-8 bg-primary-500'
                  : 'w-2 bg-neutral-300 dark:bg-neutral-600 hover:bg-primary-300'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
