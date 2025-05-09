'use client';

import React, { useEffect, useRef } from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  textColor?: string;
  iconBgColor?: string;
  iconBorderColor?: string;
  borderColor?: string;
}

export default function FeatureCard({
  title,
  description,
  icon,
  color = 'white',
  textColor = '#312e81',
  iconBgColor = '#DBEAFE',
  iconBorderColor = '#0F172A',
  borderColor = '#0F172A'
}: FeatureCardProps) {
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
      className="animate-on-scroll feature-card" 
      data-animation="scale-in"
      style={{
        backgroundColor: color,
        color: textColor
      }}
    >
      <div className="feature-header">
        <div 
          className="feature-icon" 
          style={{
            backgroundColor: iconBgColor,
            borderColor: iconBorderColor
          }}
        >
          {icon}
        </div>
        <h3 
          className="feature-title" 
          style={{
            color: textColor,
            borderColor: borderColor
          }}
        >
          {title}
        </h3>
      </div>
      <p 
        className="feature-description" 
        style={{
          color: textColor === 'white' ? 'white' : 'inherit'
        }}
      >
        {description}
      </p>
    </div>
  );
} 