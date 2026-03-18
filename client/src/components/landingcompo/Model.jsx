import React, { useState, useEffect } from 'react';
import Spline from "@splinetool/react-spline";

export default function Model() {
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    // Check if WebGL is supported
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.warn('WebGL not supported, falling back to gradient background');
      setWebglError(true);
    }
  }, []);

  if (webglError) {
    // Fallback when WebGL is not available
    return (
      <div 
        style={{ 
          width: "100vw", 
          height: "100vh",
          background: 'linear-gradient(180deg, #0B0F1A 0%, #0F1729 50%, #131B2E 100%)'
        }} 
      />
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Spline 
        scene="https://prod.spline.design/1MLJjE2m5bXho0n5/scene.splinecode"
        onError={(error) => {
          console.error('Spline loading error:', error);
          setWebglError(true);
        }}
      />
    </div>
  );
}
