'use client';

import { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';

// Register the ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // Check if we're in the dashboard section
  const isDashboard = pathname?.startsWith('/dashboard');

  // Initialize Lenis smooth scrolling
  useEffect(() => {
    // Don't apply smooth scrolling on dashboard pages
    if (isDashboard) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Store the lenis instance
    lenisRef.current = lenis;

    // Connect lenis to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Set up a RAF loop to update lenis
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    
    requestAnimationFrame(raf);

    return () => {
      // Clean up
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isDashboard, pathname]);

  // Initialize scroll animations
  useEffect(() => {
    // Skip scroll animations on dashboard 
    if (isDashboard || !lenisRef.current) return;

    // Animate elements when they enter the viewport
    const animateElements = gsap.utils.toArray('.animate-on-scroll');
    
    animateElements.forEach((element) => {
      const el = element as HTMLElement;
      
      // Create a scroll trigger for each element
      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        onEnter: () => {
          // Add animation class based on data attribute
          const animationType = el.dataset.animation || 'fade-in';
          el.classList.add(`animate-${animationType}`);
          el.style.visibility = 'visible';
        },
        once: true
      });
    });

    return () => {
      // Clean up all scroll triggers when component unmounts
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isDashboard, pathname]);

  // For dashboard routes, just return children without smooth scrolling
  if (isDashboard) {
    return <>{children}</>;
  }

  return <>{children}</>;
} 