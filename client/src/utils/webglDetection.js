/**
 * Detects if WebGL is supported in the browser
 */
export const isWebGLSupported = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    // Check if context was created AND not disabled
    if (!gl) {
      return false;
    }

    // Check if WebGL is disabled
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // If vendor/renderer are "Disabled", WebGL is not available
      if (vendor?.includes('Disabled') || renderer?.includes('Disabled')) {
        return false;
      }
    }

    return true;
  } catch (e) {
    console.warn('WebGL detection failed:', e);
    return false;
  }
};
