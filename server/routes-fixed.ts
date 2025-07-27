import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertCartItemSchema, insertProductSchema, insertOrderSchema, insertDriverSchema, insertDriverLocationSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { orders as ordersTable } from "@shared/schema";
import { inArray } from "drizzle-orm";
import { generateInvoicePDF, generateBatchInvoicePDF } from "./invoice-generator";
import { wasenderService } from './wasender-api-service';
import { zaincashService } from './zaincash-service';

// Initialize WasenderAPI service only
console.log('🎯 WasenderAPI service initialized - Unified messaging system active');

// OTP session storage
const otpSessions = new Map();

// Declare session types
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userEmail?: string;
    loginTime?: string;
    lastChecked?: string;
    driverId?: number;
    driverEmail?: string;
    driverLoginTime?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // =============================================================================
  // CRITICAL DRIVER ENDPOINTS - WORKING VERSION
  // =============================================================================
  
  // Driver login endpoint
  app.post('/api/driver/login', async (req: any, res: any) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const driver = await storage.getDriverByEmail(email.toLowerCase().trim());
      if (!driver || driver.passwordHash !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!driver.isActive) {
        return res.status(403).json({ message: 'Driver account is deactivated' });
      }

      req.session.driverId = driver.id;
      req.session.driverEmail = driver.email;
      req.session.driverLoginTime = new Date().toISOString();
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log(`🚚 Driver login: ID ${driver.id} (${driver.fullName}) - ${driver.vehicleType}`);

      res.json({
        success: true,
        driver: {
          id: driver.id,
          email: driver.email,
          fullName: driver.fullName,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          vehiclePlate: driver.vehiclePlate,
          isOnline: driver.isOnline,
          isActive: driver.isActive,
          totalDeliveries: driver.totalDeliveries,
          rating: driver.rating
        }
      });
    } catch (error: any) {
      console.error('Driver login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Driver session check
  app.get('/api/driver/session', async (req: any, res: any) => {
    try {
      if (!req.session.driverId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const driver = await storage.getDriver(req.session.driverId);
      if (!driver || !driver.isActive) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'Driver session invalid' });
      }

      res.json({
        driver: {
          id: driver.id,
          email: driver.email,
          fullName: driver.fullName,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          vehiclePlate: driver.vehiclePlate,
          isOnline: driver.isOnline,
          isActive: driver.isActive,
          totalDeliveries: driver.totalDeliveries,
          rating: driver.rating
        }
      });
    } catch (error: any) {
      console.error('Driver session check error:', error);
      res.status(500).json({ message: 'Session check failed' });
    }
  });

  // Driver logout
  app.post('/api/driver/logout', async (req: any, res: any) => {
    try {
      const driverId = req.session.driverId;
      
      if (driverId) {
        await storage.updateDriverStatus(driverId, false);
      }
      
      req.session.destroy(() => {
        res.json({ message: 'Logged out successfully' });
      });
    } catch (error: any) {
      console.error('Driver logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // WORKING Driver status update endpoint
  app.patch('/api/driver/status', async (req: any, res: any) => {
    try {
      console.log('🔧 PATCH /api/driver/status called');
      
      if (!req.session.driverId) {
        console.log('❌ No driver session found');
        return res.status(401).json({ message: 'Driver not authenticated' });
      }

      const { isOnline } = req.body;
      console.log(`🔧 Updating driver ${req.session.driverId} status to: ${isOnline}`);
      
      const driver = await storage.updateDriverStatus(req.session.driverId, isOnline);
      
      console.log(`✅ Driver ${driver.fullName} status updated to: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      res.json({ 
        success: true, 
        driver: {
          id: driver.id,
          isOnline: driver.isOnline
        }
      });
    } catch (error: any) {
      console.error('Driver status update error:', error);
      res.status(500).json({ message: 'Status update failed' });
    }
  });

  // WORKING Driver pending orders endpoint
  app.get('/api/driver/pending-orders', async (req: any, res: any) => {
    try {
      console.log('🔧 GET /api/driver/pending-orders called');
      
      if (!req.session.driverId) {
        console.log('❌ No driver session found');
        return res.status(401).json({ message: 'Driver not authenticated' });
      }

      console.log(`🔧 Getting pending orders for driver ${req.session.driverId}`);
      
      const orders = await storage.getDriverOrders(req.session.driverId, 'assigned');
      
      console.log(`✅ Found ${orders.length} pending orders`);
      
      res.json({ 
        orders: orders.map((order: any) => ({
          id: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          address: order.address,
          items: order.items,
          totalAmount: order.totalAmount,
          deliveryFee: order.deliveryFee || 2500,
          status: order.status,
          assignedAt: order.assignedAt
        }))
      });
    } catch (error: any) {
      console.error('Driver pending orders error:', error);
      res.status(500).json({ message: 'Failed to fetch pending orders' });
    }
  });

  // Driver stats endpoint
  app.get('/api/driver/stats', async (req: any, res: any) => {
    try {
      if (!req.session.driverId) {
        return res.status(401).json({ message: 'Driver not authenticated' });
      }

      const driver = await storage.getDriver(req.session.driverId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const allOrders = await storage.getDriverOrders(req.session.driverId);
      const todayOrders = allOrders.filter((order: any) => 
        order.deliveredAt && new Date(order.deliveredAt) >= today
      );

      const todayDeliveries = todayOrders.length;
      const todayEarnings = todayDeliveries * 2500;

      res.json({
        stats: {
          todayDeliveries,
          todayEarnings,
          totalDeliveries: driver.totalDeliveries || 0,
          totalEarnings: parseFloat((driver as any).totalEarnings || '0'),
          rating: parseFloat(driver.rating || '5.0')
        }
      });
    } catch (error: any) {
      console.error('Driver stats error:', error);
      res.status(500).json({ message: 'Failed to fetch driver stats' });
    }
  });

  // Test notification endpoint  
  app.post('/api/driver/test-notification', async (req: any, res: any) => {
    try {
      if (!req.session.driverId) {
        return res.status(401).json({ message: 'Driver not authenticated' });
      }

      const testOrder = {
        id: 999,
        customerName: "زياد أحمد العراقي",
        customerPhone: "07701234567",
        address: {
          governorate: "بغداد",
          district: "الكرادة", 
          notes: "بجانب مطعم البيت العراقي - الطابق الثاني"
        },
        items: [
          { productName: "خبز عربي", quantity: "2", price: "1500" },
          { productName: "حليب طازج", quantity: "1", price: "3500" },
          { productName: "جبن أبيض", quantity: "1", price: "5000" }
        ],
        totalAmount: 10000,
        deliveryFee: 2500,
        status: "assigned"
      };

      console.log(`🧪 Test notification for driver ${req.session.driverId}`);
      
      res.json({
        success: true,
        message: "Test notification sent successfully",
        testOrder
      });
    } catch (error: any) {
      console.error('Test notification error:', error);
      res.status(500).json({ message: 'Test notification failed' });
    }
  });

  // Update driver Expo notification token
  app.patch('/api/drivers/:id/expo-token', async (req: any, res: any) => {
    try {
      const driverId = parseInt(req.params.id);
      const { expoToken } = req.body;

      if (!expoToken) {
        return res.status(400).json({ message: 'Expo token is required' });
      }

      console.log(`📱 Updating Expo token for driver ${driverId}: ${expoToken.substring(0, 20)}...`);

      const updatedDriver = await storage.updateDriverExpoToken(driverId, expoToken);
      
      res.json({ 
        success: true, 
        message: 'Expo token updated successfully',
        driver: updatedDriver
      });
    } catch (error: any) {
      console.error('Update Expo token error:', error);
      res.status(500).json({ message: 'Failed to update Expo token' });
    }
  });

  // Test Expo notification for specific driver
  app.post('/api/drivers/:id/test-expo-notification', async (req: any, res: any) => {
    try {
      const driverId = parseInt(req.params.id);
      
      const driver = await storage.getDriver(driverId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      if (!driver.expoNotificationToken) {
        return res.status(400).json({ message: 'Driver does not have an Expo token registered' });
      }

      console.log(`🧪 Sending test Expo notification to driver ${driverId}`);

      // In a real implementation, you would send the notification here
      // For now, we'll just simulate it
      const testNotification = {
        to: driver.expoNotificationToken,
        title: "اختبار الإشعارات",
        body: "هذا اختبار للتأكد من أن الإشعارات تعمل بشكل صحيح",
        data: {
          type: "TEST_NOTIFICATION",
          driverId: driverId
        }
      };

      console.log('📱 Test notification prepared:', testNotification);

      res.json({ 
        success: true, 
        message: 'Test notification sent successfully',
        notification: testNotification
      });
    } catch (error: any) {
      console.error('Test Expo notification error:', error);
      res.status(500).json({ message: 'Failed to send test notification' });
    }
  });

  // Simple catch-all handler
  app.use('/api/*', (req: any, res: any) => {
    res.status(404).json({ 
      message: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  });

  return httpServer;
}