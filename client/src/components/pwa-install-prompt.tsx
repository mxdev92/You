import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download } from 'lucide-react';

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
      <Card className="bg-gradient-to-r from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-xl border border-green-200 dark:border-green-700 backdrop-blur-sm animate-bounce" style={{animationDuration: '2s', animationIterationCount: '3'}}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Left: Small Download Icon */}
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <Download className="h-4 w-4 text-white" />
            </div>
            
            {/* Middle: Text */}
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                احصل على تجربة افضل
              </p>
            </div>
            
            {/* Right: Install Button and Close */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-4 py-2 h-8 rounded-lg shadow-md transition-all duration-200"
                data-testid="install-button"
              >
                تثبيت التطبيق
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                data-testid="dismiss-button"
              >
                <X className="h-3 w-3 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}