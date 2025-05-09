'use client';

import { useEffect, useRef } from 'react';

interface TestimonialCardProps {
  quote: string;
  name: string;
  business: string;
  color: string;
  initial: string;
  avatarColor: string;
  rotation?: string;
}

export default function TestimonialCard({
  quote,
  name,
  business,
  color,
  initial,
  avatarColor,
  rotation = '-1deg'
}: TestimonialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation is handled client-side only
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const animation = entry.target.getAttribute('data-animation');
          if (animation) {
            entry.target.classList.add(`animate-${animation}`);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className="animate-on-scroll testimonial-card" 
      data-animation="rotate" 
      style={{ 
        backgroundColor: color,
        transform: `rotate(${rotation})`
      }}
    >
      <div className="testimonial-stars">
        ⭐⭐⭐⭐⭐
      </div>
      <p className="testimonial-quote">
        "{quote}"
      </p>
      <div className="testimonial-author">
        <div 
          className="testimonial-avatar" 
          style={{ 
            backgroundColor: avatarColor
          }}
        >
          {initial}
        </div>
        <div className="testimonial-info">
          <p className="testimonial-name">{name}</p>
          <p className="testimonial-business">{business}</p>
        </div>
      </div>
    </div>
  );
} 