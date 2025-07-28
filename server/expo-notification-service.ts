// Using built-in fetch (Node.js 18+)

interface NotificationPayload {
  to: string;
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
}

export class ExpoNotificationService {
  private static readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  static async sendNotification(payload: NotificationPayload): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Validate Expo push token format
      if (!this.isValidExpoToken(payload.to)) {
        return {
          success: false,
          message: 'Invalid Expo push token format'
        };
      }

      const notification = {
        to: payload.to,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        sound: payload.sound || 'default',
        badge: payload.badge || 1,
        channelId: 'default',
        priority: 'high'
      };

      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      });

      const result = await response.json() as any;

      if (response.ok && result.data && result.data.status === 'ok') {
        return {
          success: true,
          message: 'Notification sent successfully',
          data: result.data
        };
      } else {
        console.error('Expo notification error:', result);
        return {
          success: false,
          message: result.data?.details?.error || 'Failed to send notification'
        };
      }
    } catch (error) {
      console.error('Expo notification service error:', error);
      return {
        success: false,
        message: 'Network error sending notification'
      };
    }
  }

  static async sendOrderNotification(
    driverToken: string, 
    orderName: string, 
    orderAddress: string,
    orderId?: number
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const title = 'طلب جديد - PAKETY';
    const body = `${orderName}\nالعنوان: ${orderAddress}`;
    
    const data = {
      type: 'new_order',
      orderName,
      orderAddress,
      orderId: orderId || null,
      actions: ['accept', 'reject'],
      timestamp: new Date().toISOString()
    };

    return this.sendNotification({
      to: driverToken,
      title,
      body,
      data,
      sound: 'default',
      badge: 1
    });
  }

  private static isValidExpoToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Check for valid Expo token formats
    return token.startsWith('ExponentPushToken[') || 
           token.startsWith('expo:') ||
           token.startsWith('ExpoPushToken[');
  }
}

// Helper function to send notifications to all drivers
export async function sendPushNotificationToAllDrivers(notificationData: {
  title: string;
  body: string;
  data?: any;
}): Promise<{ success: boolean; message: string; results: any[] }> {
  try {
    // Import db and drivers table
    const { db } = await import('./db');
    const { drivers } = await import('../shared/schema');
    
    // Get all active drivers with notification tokens
    const { eq } = await import('drizzle-orm');
    const activeDrivers = await db
      .select()
      .from(drivers)
      .where(eq(drivers.isActive, true));

    const validDrivers = activeDrivers.filter(driver => 
      driver.notificationToken && 
      isValidExpoTokenHelper(driver.notificationToken)
    );

    if (validDrivers.length === 0) {
      return {
        success: false,
        message: 'No active drivers with valid notification tokens found',
        results: []
      };
    }

    console.log(`📱 Sending notifications to ${validDrivers.length} active drivers`);

    // Send notifications to all valid drivers
    const notificationPromises = validDrivers.map(async (driver) => {
      try {
        const result = await ExpoNotificationService.sendNotification({
          to: driver.notificationToken!,
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: 'default',
          badge: 1
        });

        return {
          driverId: driver.id,
          driverName: driver.fullName,
          success: result.success,
          message: result.message
        };
      } catch (error: any) {
        return {
          driverId: driver.id,
          driverName: driver.fullName,
          success: false,
          message: error.message || 'Failed to send notification'
        };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      message: `Sent ${successCount}/${validDrivers.length} notifications successfully`,
      results
    };

  } catch (error: any) {
    console.error('Error sending notifications to all drivers:', error);
    return {
      success: false,
      message: 'Failed to send notifications to drivers',
      results: []
    };
  }
}

// Helper function for token validation (accessible outside the class)
function isValidExpoTokenHelper(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check for valid Expo token formats
  return token.startsWith('ExponentPushToken[') || 
         token.startsWith('expo:') ||
         token.startsWith('ExpoPushToken[');
}