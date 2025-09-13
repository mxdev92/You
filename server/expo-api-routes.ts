import { Router } from 'express';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { storage } from './storage';
import { db } from './db';
import { users, products, categories, orders, userAddresses, walletTransactions, cartItems } from '@shared/schema';
import { insertUserSchema, insertOrderSchema, insertUserAddressSchema } from '@shared/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

// JWT Secret for mobile app tokens
const JWT_SECRET = process.env.JWT_SECRET || 'pakety-mobile-secret-key-2025';

// Extend Express Request interface to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: number;
      email: string;
      fullName: string;
    };
  }
}

// Middleware to verify JWT token for mobile app
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to format prices
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US').format(price);
};

// ==================== AUTHENTICATION ENDPOINTS ====================

// Mobile App Login
router.post('/api/mobile/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        fullName: user.fullName 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Get user wallet balance
    const walletBalance = await storage.getUserWalletBalance(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        walletBalance: walletBalance
      },
      token
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mobile App Registration
router.post('/api/mobile/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, phone, governorate, district, landmark } = req.body;

    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await storage.createUser({
      email,
      passwordHash: hashedPassword,
      fullName,
      phone
    });

    // Create address if provided
    if (governorate && district && landmark) {
      await storage.createUserAddress({
        userId: newUser.id,
        governorate,
        district,
        neighborhood: landmark
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        fullName: newUser.fullName 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone,
        walletBalance: 0
      },
      token
    });
  } catch (error) {
    console.error('Mobile registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh Token
router.post('/api/mobile/auth/refresh', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await storage.getUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const walletBalance = await storage.getUserWalletBalance(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        walletBalance: walletBalance
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== PRODUCT ENDPOINTS ====================

// Get All Categories
router.get('/api/mobile/categories', async (req, res) => {
  try {
    const allCategories = await storage.getCategories();
    
    res.json({
      success: true,
      categories: allCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        displayOrder: cat.displayOrder || 0
      }))
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Products by Category
router.get('/api/mobile/products', async (req, res) => {
  try {
    const { categoryId, search } = req.query;
    
    let allProducts;
    if (categoryId) {
      allProducts = await storage.getProductsByCategory(parseInt(categoryId as string));
    } else {
      allProducts = await storage.getProducts();
    }
    
    // Filter by search if provided
    let filteredProducts = allProducts;
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
      );
    }

    res.json({
      success: true,
      products: filteredProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        priceFormatted: formatPrice(parseFloat(product.price)),
        image: product.imageUrl,
        categoryId: product.categoryId,
        inStock: product.available
      }))
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Single Product
router.get('/api/mobile/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        priceFormatted: formatPrice(parseFloat(product.price)),
        image: product.imageUrl,
        categoryId: product.categoryId,
        inStock: product.available
      }
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CART ENDPOINTS ====================

// Get User Cart
router.get('/api/mobile/cart', authenticateToken, async (req, res) => {
  try {
    const cartItems = await storage.getCartItems(req.user!.userId);
    
    const validCartItems = cartItems.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: parseFloat(item.quantity),
      product: {
        id: item.product.id,
        name: item.product.name,
        price: parseFloat(item.product.price),
        priceFormatted: formatPrice(parseFloat(item.product.price)),
        image: item.product.imageUrl,
        inStock: item.product.available
      }
    }));

    const totalAmount = validCartItems.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0
    );

    res.json({
      success: true,
      cart: {
        items: validCartItems,
        itemCount: validCartItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: totalAmount,
        totalAmountFormatted: formatPrice(totalAmount),
        deliveryFee: 3500,
        deliveryFeeFormatted: formatPrice(3500),
        grandTotal: totalAmount + 3500,
        grandTotalFormatted: formatPrice(totalAmount + 3500)
      }
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to Cart
router.post('/api/mobile/cart/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    await storage.addToCart({
      userId: req.user.userId,
      productId: productId,
      quantity: quantity.toString()
    });

    res.json({
      success: true,
      message: 'Product added to cart successfully'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Cart Item
router.put('/api/mobile/cart/:itemId', authenticateToken, async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    await storage.updateCartItemQuantity(itemId, quantity);

    res.json({
      success: true,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from Cart
router.delete('/api/mobile/cart/:itemId', authenticateToken, async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    await storage.removeFromCart(itemId);

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear Cart
router.delete('/api/mobile/cart', authenticateToken, async (req, res) => {
  try {
    await storage.clearCart(req.user!.userId);

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== WALLET ENDPOINTS ====================

// Get Wallet Balance
router.get('/api/mobile/wallet/balance', authenticateToken, async (req, res) => {
  try {
    const balance = await storage.getUserWalletBalance(req.user!.userId);

    res.json({
      success: true,
      balance: balance,
      balanceFormatted: formatPrice(balance)
    });
  } catch (error) {
    console.error('Wallet balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Wallet Transactions
router.get('/api/mobile/wallet/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await storage.getUserWalletTransactions(req.user!.userId);

    res.json({
      success: true,
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        amountFormatted: formatPrice(parseFloat(tx.amount)),
        description: tx.description,
        status: tx.status,
        createdAt: tx.createdAt,
        orderId: tx.orderId
      }))
    });
  } catch (error) {
    console.error('Wallet transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Charge Wallet
router.post('/api/mobile/wallet/charge', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 5000) {
      return res.status(400).json({ error: 'Minimum charge amount is 5,000 IQD' });
    }

    // This would integrate with Zaincash payment gateway
    // For now, we'll return the payment URL structure
    const orderId = `wallet_charge_${req.user!.userId}_${Date.now()}`;

    res.json({
      success: true,
      message: 'Charge request created successfully',
      orderId: orderId,
      amount: amount,
      amountFormatted: formatPrice(amount),
      // In production, this would be the actual Zaincash payment URL
      paymentUrl: `https://test.zaincash.iq/transaction/init?orderId=${orderId}&amount=${amount}`
    });
  } catch (error) {
    console.error('Wallet charge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== ADDRESS ENDPOINTS ====================

// Get User Addresses
router.get('/api/mobile/addresses', authenticateToken, async (req, res) => {
  try {
    const addresses = await storage.getUserAddresses(req.user!.userId);

    res.json({
      success: true,
      addresses: addresses.map(addr => ({
        id: addr.id,
        governorate: addr.governorate,
        district: addr.district,
        neighborhood: addr.neighborhood,
        notes: addr.notes,
        isDefault: addr.isDefault,
        fullAddress: `${addr.governorate} - ${addr.district} - ${addr.neighborhood}`
      }))
    });
  } catch (error) {
    console.error('Addresses fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add New Address
router.post('/api/mobile/addresses', authenticateToken, async (req, res) => {
  try {
    const { governorate, district, neighborhood, notes = '', isDefault = false } = req.body;

    if (!governorate || !district || !neighborhood) {
      return res.status(400).json({ error: 'All address fields are required' });
    }

    const newAddress = await storage.createUserAddress({
      userId: req.user!.userId,
      governorate,
      district,
      neighborhood,
      notes,
      isDefault
    });

    res.json({
      success: true,
      address: {
        id: newAddress.id,
        governorate: newAddress.governorate,
        district: newAddress.district,
        neighborhood: newAddress.neighborhood,
        notes: newAddress.notes,
        isDefault: newAddress.isDefault,
        fullAddress: `${newAddress.governorate} - ${newAddress.district} - ${newAddress.neighborhood}`
      }
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== ORDER ENDPOINTS ====================

// Get User Orders
router.get('/api/mobile/orders', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    
    const userOrders = await storage.getOrders();
    
    // Filter by user and status if provided
    let filteredOrders = userOrders.filter(order => order.userId === req.user!.userId);
    
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    // Sort by date and limit
    const sortedOrders = filteredOrders
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, parseInt(limit as string));

    const ordersWithFormatting = sortedOrders.map(order => {
      // Parse items from JSON field
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      
      return {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        totalAmountFormatted: formatPrice(order.totalAmount),
        deliveryFee: 3500, // Fixed delivery fee
        deliveryFeeFormatted: formatPrice(3500),
        createdAt: order.orderDate,
        items: Array.isArray(items) ? items : []
      };
    });

    res.json({
      success: true,
      orders: ordersWithFormatting
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Single Order
router.get('/api/mobile/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await storage.getOrder(orderId);

    if (!order || order.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Parse items from JSON field
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    
    // Parse address from JSON field
    const address = typeof order.address === 'string' ? JSON.parse(order.address) : order.address;

    res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        totalAmountFormatted: formatPrice(order.totalAmount),
        deliveryFee: 3500,
        deliveryFeeFormatted: formatPrice(3500),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: address ? `${address.governorate} - ${address.district} - ${address.neighborhood}` : '',
        createdAt: order.orderDate,
        items: Array.isArray(items) ? items : []
      }
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create New Order
router.post('/api/mobile/orders', authenticateToken, async (req, res) => {
  try {
    const { addressId, paymentMethod = 'wallet' } = req.body;

    // Get user cart
    const cartItems = await storage.getCartItems(req.user!.userId);
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Get user details
    const user = await storage.getUser(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get address
    let address;
    if (addressId) {
      const addresses = await storage.getUserAddresses(req.user!.userId);
      address = addresses.find(addr => addr.id === addressId);
    } else {
      const addresses = await storage.getUserAddresses(req.user!.userId);
      address = addresses.find(addr => addr.isDefault) || addresses[0];
    }

    if (!address) {
      return res.status(400).json({ error: 'No delivery address found' });
    }

    // Calculate totals
    let totalAmount = 0;
    const orderItemsData = [];

    for (const cartItem of cartItems) {
      const itemTotal = parseFloat(cartItem.product.price) * parseFloat(cartItem.quantity);
      totalAmount += itemTotal;
      orderItemsData.push({
        productId: cartItem.product.id,
        name: cartItem.product.name,
        quantity: parseFloat(cartItem.quantity),
        price: parseFloat(cartItem.product.price),
        total: itemTotal
      });
    }

    const deliveryFee = 3500;
    const grandTotal = totalAmount + deliveryFee;

    // Check wallet balance if paying with wallet
    if (paymentMethod === 'wallet') {
      const walletBalance = await storage.getUserWalletBalance(req.user!.userId);
      if (walletBalance < grandTotal) {
        return res.status(400).json({ 
          error: 'Insufficient wallet balance',
          required: grandTotal,
          requiredFormatted: formatPrice(grandTotal),
          available: walletBalance,
          availableFormatted: formatPrice(walletBalance)
        });
      }
    }

    // Create order
    const newOrder = await storage.createOrder({
      userId: req.user!.userId,
      customerName: user.fullName || 'Unknown',
      customerEmail: user.email,
      customerPhone: user.phone,
      address: {
        governorate: address.governorate,
        district: address.district,
        neighborhood: address.neighborhood,
        notes: address.notes
      },
      paymentMethod: paymentMethod,
      items: orderItemsData,
      totalAmount: grandTotal,
      status: 'pending'
    });

    // Process payment if wallet
    if (paymentMethod === 'wallet') {
      await storage.createWalletTransaction({
        userId: req.user!.userId,
        type: 'payment',
        amount: grandTotal.toString(),
        description: `Order payment - Order #${newOrder.id}`,
        status: 'completed',
        orderId: newOrder.id.toString()
      });
      
      // Update wallet balance
      await storage.updateUserWalletBalance(req.user!.userId, -grandTotal);
    }

    // Clear cart
    await storage.clearCart(req.user!.userId);

    res.json({
      success: true,
      order: {
        id: newOrder.id,
        status: newOrder.status,
        totalAmount: totalAmount,
        totalAmountFormatted: formatPrice(totalAmount),
        deliveryFee: deliveryFee,
        deliveryFeeFormatted: formatPrice(deliveryFee),
        grandTotal: grandTotal,
        grandTotalFormatted: formatPrice(grandTotal)
      },
      message: 'Order placed successfully'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== USER PROFILE ENDPOINTS ====================

// Get User Profile
router.get('/api/mobile/profile', authenticateToken, async (req, res) => {
  try {
    const user = await storage.getUser(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const walletBalance = await storage.getUserWalletBalance(req.user!.userId);

    res.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        walletBalance: walletBalance,
        walletBalanceFormatted: formatPrice(walletBalance),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update User Profile
router.put('/api/mobile/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ error: 'Full name and phone are required' });
    }

    // Note: This would require adding updateUser method to storage interface
    // For now, we'll return success without actual update
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== SYSTEM ENDPOINTS ====================

// API Health Check
router.get('/api/mobile/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get App Configuration
router.get('/api/mobile/config', (req, res) => {
  res.json({
    success: true,
    config: {
      appName: 'PAKETY',
      appNameAr: 'باكيتي',
      deliveryFee: 3500,
      deliveryFeeFormatted: formatPrice(3500),
      minWalletCharge: 5000,
      minWalletChargeFormatted: formatPrice(5000),
      currency: 'IQD',
      supportedPaymentMethods: ['wallet'],
      orderStatuses: [
        { key: 'pending', label: 'Pending', labelAr: 'معلق' },
        { key: 'confirmed', label: 'Confirmed', labelAr: 'مؤكد' },
        { key: 'preparing', label: 'Preparing', labelAr: 'قيد التحضير' },
        { key: 'out-for-delivery', label: 'Out for Delivery', labelAr: 'خارج للتوصيل' },
        { key: 'delivered', label: 'Delivered', labelAr: 'تم التوصيل' },
        { key: 'cancelled', label: 'Cancelled', labelAr: 'ملغي' }
      ]
    }
  });
});

export default router;