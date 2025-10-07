import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA as early as possible
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
        // Wait for service worker to be ready
        navigator.serviceWorker.ready.then(() => {
          console.log('SW is active and ready');
        });
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  };

  // Register immediately if DOM is ready, otherwise wait for DOMContentLoaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW();
  } else {
    window.addEventListener('DOMContentLoaded', registerSW);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
