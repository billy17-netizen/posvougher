import React from 'react';
import Image from 'next/image';
import './brutalism.css';

interface ScreenshotProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export default function Screenshot({ 
  src, 
  alt, 
  width = 800, 
  height = 500 
}: ScreenshotProps) {
  return (
    <div className="group relative w-full max-w-screen-xl mx-auto">
      {/* Screenshot Container */}
      <div className="brutalism-screen brutalism-transition hover:shadow-[15px_15px_0px_0px_rgba(0,0,0,0.9)] hover:-translate-y-1">
        
        {/* Screenshot Window Header */}
        <div className="brutalism-screen-header">
          <div className="brutalism-browser-dots">
            <div className="brutalism-browser-dot bg-red-500"></div>
            <div className="brutalism-browser-dot bg-yellow-500"></div>
            <div className="brutalism-browser-dot bg-green-500"></div>
          </div>
          <div className="brutalism-address-bar">
            <div className="brutalism-url">
              posvougher.app
            </div>
          </div>
        </div>
        
        {/* Screenshot Image */}
        <div className="relative">
          <Image 
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="w-full object-cover"
            quality={100}
            priority
          />
          
          {/* Hover effect */}
          <div className="brutalism-hover-effect"></div>
        </div>
        
        {/* Caption */}
        <div className="brutalism-caption">
          {alt}
        </div>
      </div>
    </div>
  );
} 