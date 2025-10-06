// Phase 6: Security & Fraud Prevention

export const generateSecureCode = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
};

export const isQRCodeExpired = (sessionEndTime: string): boolean => {
  return new Date(sessionEndTime) < new Date();
};

export const validateDeviceId = async (studentId: string, deviceId: string): Promise<boolean> => {
  // Store device fingerprint to prevent multi-device scanning
  const storedDevices = localStorage.getItem(`devices_${studentId}`);
  
  if (!storedDevices) {
    localStorage.setItem(`devices_${studentId}`, JSON.stringify([deviceId]));
    return true;
  }
  
  const devices = JSON.parse(storedDevices);
  if (devices.includes(deviceId)) {
    return true;
  }
  
  // Allow up to 2 devices per student
  if (devices.length < 2) {
    devices.push(deviceId);
    localStorage.setItem(`devices_${studentId}`, JSON.stringify(devices));
    return true;
  }
  
  return false;
};

export const getDeviceFingerprint = (): string => {
  // Combine multiple device characteristics for robust fingerprinting
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasFingerprint = '';
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device Fingerprint', 2, 2);
    canvasFingerprint = canvas.toDataURL();
  }
  
  // Combine multiple factors for stronger fingerprint
  const fingerprint = [
    canvasFingerprint.substring(0, 100),
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || 'unknown'
  ].join('|');
  
  return btoa(fingerprint);
};

export const preventScreenshot = (callback: () => void) => {
  // Detect if user tries to take screenshot (visibility change)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      callback();
    }
  });
  
  // Prevent right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Detect print screen
  document.addEventListener('keyup', (e) => {
    if (e.key === 'PrintScreen') {
      callback();
    }
  });
};
