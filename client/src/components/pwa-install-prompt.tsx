import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom install prompt after 1 second
      setTimeout(() => {
        setShowPrompt(true);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
          setShowPrompt(false);
        }, 10000);
      }, 1000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Clean up
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA: User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('PWA: User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !deferredPrompt || !showPrompt) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-700"
      data-testid="pwa-install-prompt"
    >
      <Card className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm animate-bounce" style={{animationDuration: '3s', animationIterationCount: '2'}}>
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            {/* Left: Close Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              data-testid="dismiss-button"
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
            
            {/* Middle: Text */}
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                احصل على تجربة افضل
              </p>
            </div>
            
            {/* Right: Install Button */}
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-4 py-2 h-9 rounded-lg transition-all duration-200"
              data-testid="install-button"
            >
              تثبيت التطبيق
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}