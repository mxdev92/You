import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, Truck, CheckCircle, XCircle, Clock, MapPin, Phone, User, Package, DollarSign, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Driver {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  active: boolean;
}

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  address?: {
    governorate: string;
    district: string;
    neighborhood: string;
    notes?: string;
  };
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    total: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  totalAmount: string | number;
  status: string;
  createdAt: string;
  notes?: string;
}

export default function DriverPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    totalDeliveries: 0,
    averageRating: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Initialize notification audio and permissions
  useEffect(() => {
    // Aggressive notification permission request for Android
    const requestNotificationPermission = async () => {
      if ('Notification' in window) {
        console.log('Initial notification permission:', Notification.permission);
        
        if (Notification.permission === 'default') {
          try {
            const permission = await Notification.requestPermission();
            console.log('Notification permission granted:', permission);
            
            if (permission === 'granted') {
              // Test notification to ensure it works
              const testNotification = new Notification('PAKETY Driver Ready', {
                body: 'نظام الإشعارات جاهز للعمل',
                icon: '/favicon.ico',
                silent: false,
                requireInteraction: false
              });
              
              setTimeout(() => testNotification.close(), 2000);
            }
          } catch (error) {
            console.error('Notification permission error:', error);
          }
        }
      }
      
      // Professional vibration capability check
      if ('vibrate' in navigator) {
        console.log('✅ Vibration API available');
        // Test with professional subtle pattern
        navigator.vibrate([100, 50, 100]);
      }
    };
    
    requestNotificationPermission();
  }, []);

  // Beautiful, harmonious notification sound system
  useEffect(() => {
    const createElegantAudio = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        
        if (!AudioContext) {
          // Elegant HTML5 fallback with beautiful tone
          const audio = new Audio();
          audio.src = 'data:audio/wav;base64,UklGRl9yAABXQVZFZmt0IBgAAAABAAEAECcAACBOAAACABAAAABzbmQgCAAAAAEAAAB0ZXh0GgAAAAAAAABMYXZmNTcuODMuMTAwZmFrZQAAAAAAPAAAAAABACoAAABkYXRhFAAAAAlAQUlOdGVyZmFjZQABAAAAAQAA';
          (audioRef as any).current = { 
            play: () => {
              try {
                audio.currentTime = 0;
                audio.volume = 0.4; // Gentle volume
                audio.play().catch(() => {}); // Silent catch for elegance
              } catch (e) {
                // Silent elegant fallback
              }
            }
          };
          return;
        }

        let audioContext: AudioContext | null = null;
        
        // Create beautiful, harmonious notification sound
        const createElegantSound = () => {
          try {
            if (!audioContext) {
              audioContext = new AudioContext();
            }
            
            if (audioContext.state === 'suspended') {
              audioContext.resume();
            }
            
            // Beautiful chord progression: C Major (C-E-G)
            const createTone = (frequency: number, startTime: number, duration: number, volume: number) => {
              const oscillator = audioContext!.createOscillator();
              const gainNode = audioContext!.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext!.destination);
              
              oscillator.frequency.setValueAtTime(frequency, startTime);
              oscillator.type = 'sine'; // Pure, beautiful sine wave
              
              // Smooth, elegant envelope
              gainNode.gain.setValueAtTime(0, startTime);
              gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.1);
              gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
              
              oscillator.start(startTime);
              oscillator.stop(startTime + duration);
            };
            
            const currentTime = audioContext.currentTime;
            
            // First chord: C Major (523.25Hz, 659.25Hz, 783.99Hz)
            createTone(523.25, currentTime, 1.2, 0.15); // C5
            createTone(659.25, currentTime, 1.2, 0.12); // E5
            createTone(783.99, currentTime, 1.2, 0.10); // G5
            
            // Second chord (softer): F Major (349.23Hz, 440Hz, 523.25Hz)
            setTimeout(() => {
              const time2 = audioContext!.currentTime;
              createTone(349.23, time2, 0.8, 0.08); // F4
              createTone(440, time2, 0.8, 0.06); // A4
              createTone(523.25, time2, 0.8, 0.05); // C5
            }, 400);
            
            console.log('🎵 Beautiful notification sound played');
            
          } catch (error) {
            console.error('Elegant sound creation error:', error);
          }
        };
        
        (audioRef as any).current = { play: createElegantSound };
        
      } catch (error) {
        console.error('Audio system initialization error:', error);
        (audioRef as any).current = { play: () => {} };
      }
    };
    
    createElegantAudio();
  }, []);

  // Check authentication on load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // WebSocket connection management
  useEffect(() => {
    if (isLoggedIn && driver) {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isLoggedIn, driver]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('driverToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/drivers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDriver(data.driver);
        setIsLoggedIn(true);
        await loadDriverStats();
      } else {
        localStorage.removeItem('driverToken');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('driverToken');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await fetch('/api/drivers/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('driverToken', data.token);
        setDriver(data.driver);
        setIsLoggedIn(true);
        await loadDriverStats();
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${data.driver.fullName}`,
        });
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: data.message || "بيانات غير صحيحة",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const loadDriverStats = async () => {
    try {
      const token = localStorage.getItem('driverToken');
      const response = await fetch('/api/drivers/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const connectWebSocket = () => {
    if (!driver) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    setConnectionStatus('connecting');
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnectionStatus('connected');
      
      // Register driver for notifications
      wsRef.current?.send(JSON.stringify({
        type: 'DRIVER_REGISTER',
        driverId: driver.id,
        token: localStorage.getItem('driverToken')
      }));

      toast({
        title: "متصل",
        description: "تم الاتصال بنظام الإشعارات بنجاح",
      });
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setConnectionStatus('disconnected');
      
      // Attempt reconnection after 3 seconds
      setTimeout(() => {
        if (isLoggedIn && driver) {
          connectWebSocket();
        }
      }, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'NEW_ORDER':
        showOrderNotification(data.order);
        break;
      case 'ORDER_CANCELLED':
        if (pendingOrder?.id === data.orderId) {
          setPendingOrder(null);
          toast({
            title: "تم إلغاء الطلب",
            description: `الطلب رقم ${data.orderId} تم إلغاؤه من قبل العميل`,
            variant: "destructive"
          });
        }
        break;
      default:
        console.log('Unknown WebSocket message:', data);
    }
  };

  const showOrderNotification = (order: Order) => {
    console.log('🔔 New order notification received:', order);
    
    // Set pending order immediately
    setPendingOrder(order);

    // Check if running in React Native WebView
    const isReactNativeWebView = () => {
      return (window as any).ReactNativeWebView !== undefined || 
             (window as any).webkit?.messageHandlers?.ReactNativeWebView !== undefined ||
             navigator.userAgent.includes('ReactNative');
    };

    // Send notification data to React Native app
    if (isReactNativeWebView()) {
      const notificationData = {
        type: 'NEW_ORDER_NOTIFICATION',
        payload: {
          orderId: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: order.totalAmount,
          address: order.address?.governorate || order.customerAddress,
          items: order.items,
          timestamp: Date.now()
        }
      };

      // Send via multiple React Native communication methods
      try {
        // Method 1: Direct ReactNativeWebView postMessage
        if ((window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify(notificationData));
          console.log('📱 Sent notification to React Native via ReactNativeWebView');
        }
        
        // Method 2: iOS WebKit message handler
        if ((window as any).webkit?.messageHandlers?.ReactNativeWebView) {
          (window as any).webkit.messageHandlers.ReactNativeWebView.postMessage(notificationData);
          console.log('📱 Sent notification to React Native via WebKit');
        }
        
        // Method 3: Custom window function for Android
        if ((window as any).ReactNativeWebViewBridge) {
          (window as any).ReactNativeWebViewBridge.postMessage(JSON.stringify(notificationData));
          console.log('📱 Sent notification to React Native via custom bridge');
        }

        console.log('📱 Notification data sent to React Native:', notificationData);
        
        // Don't play web audio/vibration in React Native - let native app handle it
        return;
        
      } catch (error) {
        console.error('❌ Failed to send notification to React Native:', error);
        // Fallback to web notifications if React Native communication fails
      }
    }

    // Web browser fallback: Beautiful sound notification
    const playElegantSound = () => {
      if (audioRef.current && (audioRef as any).current.play) {
        try {
          console.log('🎵 Playing elegant web notification...');
          (audioRef as any).current.play();
        } catch (error) {
          console.error('Audio play error:', error);
        }
      }
    };
    
    playElegantSound();

    // Elegant, harmonious vibration matching the beautiful sound
    const triggerElegantVibration = () => {
      if ('vibrate' in navigator) {
        try {
          console.log('📳 Elegant vibration sequence starting...');
          
          // Pattern that matches the beautiful C Major chord progression
          // Synchronized with the audio timing for harmony
          
          // First vibration: Matches C Major chord (strong but elegant)
          const firstVibration = navigator.vibrate([300, 100, 200, 100, 200]);
          console.log('🎵 First harmonic vibration:', firstVibration);
          
          // Second vibration: Matches F Major chord (softer, after 400ms delay)
          setTimeout(() => {
            const secondVibration = navigator.vibrate([150, 50, 150]);
            console.log('🎵 Second harmonic vibration:', secondVibration);
          }, 400);
          
          // Gentle reminder vibration after 3 seconds (if order still pending)
          setTimeout(() => {
            if (pendingOrder?.id === order.id) {
              const reminderVibration = navigator.vibrate([100, 100, 100]);
              console.log('🔔 Gentle reminder vibration:', reminderVibration);
            }
          }, 3000);
          
          // Final soft reminder after 10 seconds
          setTimeout(() => {
            if (pendingOrder?.id === order.id) {
              const finalVibration = navigator.vibrate([200]);
              console.log('💫 Final gentle vibration:', finalVibration);
            }
          }, 10000);
          
        } catch (e) {
          console.error('Elegant vibration error:', e);
        }
      } else {
        console.log('📳 Vibration not available - using visual elegance');
        
        // Elegant visual feedback instead of harsh flashing
        const elegantGlow = () => {
          document.body.style.transition = 'background-color 0.3s ease';
          document.body.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'; // Soft green glow
          
          setTimeout(() => {
            document.body.style.backgroundColor = '';
            setTimeout(() => {
              document.body.style.transition = '';
            }, 300);
          }, 600);
        };
        
        elegantGlow();
      }
    };
    
    // Only trigger web vibration if not in React Native WebView
    if (!isReactNativeWebView()) {
      triggerElegantVibration();
    }

    // Enhanced Android system notification with maximum compatibility
    const showBrowserNotification = () => {
      if ('Notification' in window) {
        console.log('🔔 Current notification permission:', Notification.permission);
        
        if (Notification.permission === 'granted') {
          try {
            // Create main Android system notification
            const mainNotification = new Notification('🚚 PAKETY - طلب جديد!', {
              body: `العميل: ${order.customerName}\nالمبلغ: ${typeof order.totalAmount === 'string' ? order.totalAmount : order.totalAmount.toLocaleString()} د.ع\nالعنوان: ${order.address?.governorate || order.customerAddress}`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `pakety-order-${order.id}`,
              requireInteraction: true,
              silent: false,
              dir: 'rtl', // Right-to-left for Arabic
              lang: 'ar'
            });

            // Additional urgent Android notification
            setTimeout(() => {
              const urgentNotification = new Notification('⚡ طلب عاجل - يتطلب الرد', {
                body: `طلب #${order.id} في انتظار الرد\nالعميل: ${order.customerName}`,
                icon: '/favicon.ico',
                tag: `pakety-urgent-${order.id}`,
                requireInteraction: true,
                silent: false,
                dir: 'rtl',
                lang: 'ar'
              });
              
              urgentNotification.onclick = () => {
                window.focus();
                urgentNotification.close();
                mainNotification.close();
              };
              
              // Auto-close after 45 seconds
              setTimeout(() => urgentNotification.close(), 45000);
            }, 2000);

            mainNotification.onclick = () => {
              console.log('✅ Android notification clicked - focusing window');
              window.focus();
              mainNotification.close();
            };
            
            // Keep notification visible for longer on Android
            setTimeout(() => {
              if (pendingOrder?.id === order.id) {
                mainNotification.close();
              }
            }, 60000);
            
            console.log('✅ Android system notifications created successfully');
          } catch (notificationError) {
            console.error('❌ Android notification creation failed:', notificationError);
            
            // Aggressive fallback notification request
            Notification.requestPermission().then(permission => {
              console.log('Fallback permission result:', permission);
              if (permission === 'granted') {
                setTimeout(() => {
                  if (!isReactNativeWebView()) {
                    showBrowserNotification();
                  }
                }, 500);
              }
            });
          }
        } else if (Notification.permission === 'default') {
          console.log('🔄 Requesting Android notification permission...');
          Notification.requestPermission().then(permission => {
            console.log('📱 Android permission granted:', permission);
            if (permission === 'granted') {
              if (!isReactNativeWebView()) {
                showBrowserNotification();
              }
            } else {
              console.log('❌ Android notification permission denied');
            }
          });
        } else {
          console.log('❌ Android notifications blocked by user');
        }
      } else {
        console.log('❌ Notification API not available on this Android device');
      }
    };
    
    // Only show browser notifications if not in React Native WebView
    if (!isReactNativeWebView()) {
      showBrowserNotification();
    }

    // Android-specific wake up and alert mechanisms
    setTimeout(() => {
      if (pendingOrder?.id === order.id) {
        // Multiple wake-up attempts for Android
        window.focus();
        
        // Screen wake attempt
        if ('wakeLock' in navigator) {
          (navigator as any).wakeLock.request('screen').catch((e: any) => 
            console.log('Screen wake lock failed:', e)
          );
        }
        
        // Final alert for maximum Android visibility
        const shouldAlert = confirm(`🚨 طلب عاجل - PAKETY\n\n👤 العميل: ${order.customerName}\n💰 المبلغ: ${typeof order.totalAmount === 'string' ? order.totalAmount : order.totalAmount.toLocaleString()} د.ع\n📍 ${order.address?.governorate || order.customerAddress}\n\n⚡ يرجى الرد بسرعة!\n\nاضغط موافق للمتابعة`);
        
        if (shouldAlert) {
          window.focus();
          
          // Immediate strong vibration on user interaction
          if ('vibrate' in navigator) {
            try {
              navigator.vibrate(800);
              setTimeout(() => navigator.vibrate([200, 100, 200, 100, 200]), 200);
              console.log('User interaction vibration triggered');
            } catch (e) {
              console.error('User interaction vibration failed:', e);
            }
          }
        }
      }
    }, 3000);

    // Auto-dismiss after 60 seconds if no action
    notificationTimeoutRef.current = setTimeout(() => {
      if (pendingOrder?.id === order.id) {
        setPendingOrder(null);
        
        // Clear any active vibration
        if ((window as any).activeVibrationInterval) {
          clearInterval((window as any).activeVibrationInterval);
        }
        
        toast({
          title: "انتهت مهلة الطلب",
          description: "تم تجاهل الطلب تلقائياً",
          variant: "destructive"
        });
      }
    }, 60000);
  };

  const handleOrderAction = async (orderId: number, action: 'accept' | 'decline', reason?: string) => {
    try {
      const token = localStorage.getItem('driverToken');
      const endpoint = action === 'accept' 
        ? `/api/drivers/orders/${orderId}/accept`
        : `/api/drivers/orders/${orderId}/decline`;
      
      const body = action === 'decline' && reason ? { reason } : {};

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setPendingOrder(null);
        
        // Clear all notification timers and intervals
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        
        // Clear active vibration
        if ((window as any).activeVibrationInterval) {
          clearInterval((window as any).activeVibrationInterval);
        }

        if (action === 'accept') {
          setOrders(prev => [...prev, pendingOrder!]);
          toast({
            title: "تم قبول الطلب",
            description: `الطلب رقم ${orderId} تم قبوله بنجاح`,
          });
        } else {
          toast({
            title: "تم رفض الطلب",
            description: `الطلب رقم ${orderId} تم رفضه`,
          });
        }

        await loadDriverStats();
      } else {
        toast({
          title: "خطأ",
          description: data.message || "فشل في تنفيذ العملية",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر تنفيذ العملية",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driverToken');
    setIsLoggedIn(false);
    setDriver(null);
    setOrders([]);
    setPendingOrder(null);
    setConnectionStatus('disconnected');
    
    if (wsRef.current) {
      wsRef.current.close();
    }

    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
  };

  // Enhanced initialization with user interaction handlers
  useEffect(() => {
    // Add click handler to enable audio on mobile (user interaction required)
    const enableAudioOnInteraction = () => {
      if (audioRef.current && (audioRef as any).current.play) {
        try {
          // Test audio by playing a very short, silent sound
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const testContext = new AudioContext();
            if (testContext.state === 'suspended') {
              testContext.resume();
            }
            testContext.close();
          }
          console.log('✅ Audio enabled after user interaction');
        } catch (e) {
          console.log('Audio enablement test failed:', e);
        }
      }
      
      // Remove the event listener after first interaction
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
    };
    
    document.addEventListener('click', enableAudioOnInteraction);
    document.addEventListener('touchstart', enableAudioOnInteraction);
    
    return () => {
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-cairo">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600 font-cairo">
              <Truck className="inline-block mr-2" size={28} />
              سائق PAKETY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="font-cairo">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="driver@pakety.com"
                  required
                  className="font-cairo"
                />
              </div>
              <div>
                <Label htmlFor="password" className="font-cairo">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="font-cairo"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full font-cairo" 
                disabled={loginLoading}
              >
                {loginLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Truck className="text-green-600 ml-2" size={28} />
              <h1 className="text-xl font-bold text-gray-900 font-cairo">لوحة السائق</h1>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Connection Status */}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ml-2 ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm font-cairo ${
                  connectionStatus === 'connected' ? 'text-green-600' : 
                  connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {connectionStatus === 'connected' ? 'متصل' : 
                   connectionStatus === 'connecting' ? 'جاري الاتصال' : 'غير متصل'}
                </span>
              </div>

              {/* Driver Info */}
              <div className="text-right font-cairo">
                <p className="text-sm font-medium text-gray-900">{driver?.fullName}</p>
                <p className="text-xs text-gray-500">{driver?.phone}</p>
              </div>

              {/* React Native Compatible Test Button */}
              <Button
                size="sm"
                onClick={() => {
                  console.log('🎵 Testing notification system...');
                  
                  // Check if running in React Native WebView
                  const isRN = (window as any).ReactNativeWebView !== undefined || 
                              (window as any).webkit?.messageHandlers?.ReactNativeWebView !== undefined ||
                              navigator.userAgent.includes('ReactNative');
                  
                  if (isRN) {
                    // Send test notification to React Native
                    const testNotificationData = {
                      type: 'TEST_NOTIFICATION',
                      payload: {
                        orderId: 999,
                        customerName: "اختبار العميل",
                        customerPhone: "07512345678",
                        totalAmount: "4,500",
                        address: "بغداد - الكرادة",
                        items: [{ id: 1, name: "خيار", quantity: 2, price: 1000, total: "2,000" }],
                        timestamp: Date.now()
                      }
                    };
                    
                    try {
                      if ((window as any).ReactNativeWebView) {
                        (window as any).ReactNativeWebView.postMessage(JSON.stringify(testNotificationData));
                        console.log('📱 Test notification sent to React Native');
                      }
                      
                      if ((window as any).webkit?.messageHandlers?.ReactNativeWebView) {
                        (window as any).webkit.messageHandlers.ReactNativeWebView.postMessage(testNotificationData);
                        console.log('📱 Test notification sent via WebKit');
                      }
                      
                      if ((window as any).ReactNativeWebViewBridge) {
                        (window as any).ReactNativeWebViewBridge.postMessage(JSON.stringify(testNotificationData));
                        console.log('📱 Test notification sent via custom bridge');
                      }
                    } catch (e) {
                      console.error('❌ Failed to send test notification to React Native:', e);
                    }
                  } else {
                    // Web browser test
                    if ('vibrate' in navigator) {
                      const result1 = navigator.vibrate([300, 100, 200, 100, 200]);
                      console.log('🎵 Web harmonic pattern 1:', result1);
                      
                      setTimeout(() => {
                        const result2 = navigator.vibrate([150, 50, 150]);
                        console.log('🎵 Web harmonic pattern 2:', result2);
                      }, 400);
                    }
                    
                    // Play web sound
                    if (audioRef.current && (audioRef as any).current.play) {
                      try {
                        (audioRef as any).current.play();
                        console.log('🎵 Web sound and vibration test');
                      } catch (e) {
                        console.error('Web sound test error:', e);
                      }
                    }
                  }
                }}
                className="font-cairo bg-green-600 hover:bg-green-700 text-white"
              >
                🎵 تجربة
              </Button>

              {/* Test Notification Button */}
              <Button
                size="sm"
                onClick={() => {
                  // Test notification with dummy order
                  const testOrder: Order = {
                    id: 999,
                    customerId: 1,
                    customerName: "اختبار العميل",
                    customerPhone: "07512345678",
                    customerAddress: "بغداد - الكرادة",
                    address: {
                      governorate: "بغداد",  
                      district: "الكرادة",
                      neighborhood: "الكرادة الداخلية",
                      notes: "بناية اختبار"
                    },
                    items: [
                      { id: 1, name: "خيار", quantity: 2, price: 1000, total: "2,000" }
                    ],
                    subtotal: 2000,
                    deliveryFee: 2500,
                    totalAmount: "4,500",
                    status: "pending",
                    createdAt: new Date().toISOString(),
                    notes: "اختبار الإشعارات"
                  };
                  showOrderNotification(testOrder);
                }}
                className="font-cairo bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Bell size={16} className="ml-1" />
                اختبار
              </Button>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="font-cairo"
              >
                <LogOut size={16} className="ml-1" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Order Notification Popup */}
      {pendingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg animate-pulse-scale animate-shake border-2 border-green-500 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white text-center">
              <CardTitle className="font-cairo text-xl">
                <BellRing className="inline-block ml-2 animate-pulse" />
                🔔 طلب جديد!
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 font-cairo">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-600">
                    💰 {typeof pendingOrder.totalAmount === 'string' 
                         ? parseFloat(pendingOrder.totalAmount.replace(/,/g, '')).toLocaleString() 
                         : pendingOrder.totalAmount.toLocaleString()} د.ع
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold">رقم الطلب:</span>
                  <span className="font-bold text-blue-600">#{pendingOrder.id}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-semibold">👤 العميل:</span>
                  <span className="font-medium">{pendingOrder.customerName}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-semibold">📱 الهاتف:</span>
                  <span className="font-mono font-medium">{pendingOrder.customerPhone}</span>
                </div>
                
                <div className="space-y-2">
                  <span className="font-semibold">📍 العنوان:</span>
                  <div className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                    <div className="font-medium">{pendingOrder.address?.governorate} - {pendingOrder.address?.district}</div>
                    <div className="text-gray-600">{pendingOrder.address?.neighborhood}</div>
                    {pendingOrder.address?.notes && (
                      <div className="text-gray-600 mt-1 bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                        📝 {pendingOrder.address.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="border-t pt-3">
                  <div className="font-semibold mb-2">📦 المنتجات:</div>
                  <div className="max-h-20 overflow-y-auto bg-gray-50 p-2 rounded">
                    {pendingOrder.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm py-1">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{parseFloat(item.total).toLocaleString()} د.ع</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                    <span>🚚 رسوم التوصيل:</span>
                    <span>2,500 د.ع</span>
                  </div>
                </div>

                <div className="flex space-x-4 space-x-reverse pt-4">
                  <Button
                    onClick={() => handleOrderAction(pendingOrder.id, 'accept')}
                    className="flex-1 bg-green-600 hover:bg-green-700 font-cairo font-bold text-lg py-3 animate-pulse shadow-lg transform hover:scale-105 transition-all"
                  >
                    <CheckCircle className="ml-2" size={20} />
                    ✅ قبول
                  </Button>
                  <Button
                    onClick={() => handleOrderAction(pendingOrder.id, 'decline', 'مشغول حالياً')}
                    variant="destructive"
                    className="flex-1 font-cairo font-bold text-lg py-3 shadow-lg transform hover:scale-105 transition-all"
                  >
                    <XCircle className="ml-2" size={20} />
                    ❌ رفض
                  </Button>
                </div>

                <div className="text-center mt-3">
                  <p className="text-xs text-gray-500">⏰ يرجى الرد بسرعة على هذا الطلب</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="mx-auto mb-2 text-blue-600" size={24} />
              <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
              <p className="text-sm text-gray-600 font-cairo">توصيلات اليوم</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="mx-auto mb-2 text-green-600" size={24} />
              <p className="text-2xl font-bold">{stats.todayEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-600 font-cairo">أرباح اليوم (د.ع)</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Truck className="mx-auto mb-2 text-purple-600" size={24} />
              <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
              <p className="text-sm text-gray-600 font-cairo">إجمالي التوصيلات</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="mx-auto mb-2 text-orange-600" size={24} />
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-gray-600 font-cairo">طلبات نشطة</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">الطلبات النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 font-cairo">
                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">في انتظار الطلبات...</p>
                <p className="text-sm">ستتلقى إشعار فوري عند وصول طلب جديد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold font-cairo">طلب #{order.id}</h3>
                        <p className="text-sm text-gray-600 font-cairo">{order.customerName}</p>
                      </div>
                      <Badge variant="secondary" className="font-cairo">
                        {order.status === 'accepted' ? 'مقبول' : order.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-cairo">
                      <div className="flex items-center">
                        <Phone size={16} className="ml-2 text-gray-400" />
                        {order.customerPhone}
                      </div>
                      <div className="flex items-center">
                        <MapPin size={16} className="ml-2 text-gray-400" />
                        {order.customerAddress}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <span className="font-semibold font-cairo">
                        المبلغ: {order.totalAmount.toLocaleString()} د.ع
                      </span>
                      <Button size="sm" className="font-cairo">تحديث الحالة</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}