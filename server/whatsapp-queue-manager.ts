// WhatsApp Queue Manager for handling messages during unstable connections
import EventEmitter from 'events';

export interface QueuedMessage {
  id: string;
  phoneNumber: string;
  message: string;
  type: 'otp' | 'invoice' | 'notification';
  retryCount: number;
  maxRetries: number;
  timestamp: number;
  fullName?: string;
  otp?: string;
}

export class WhatsAppQueueManager extends EventEmitter {
  private messageQueue: Map<string, QueuedMessage> = new Map();
  private processingQueue = false;
  private maxQueueSize = 100;
  private retryDelay = 3000; // 3 seconds between retries

  constructor() {
    super();
    this.startQueueProcessor();
  }

  // Add message to queue
  enqueueMessage(message: Omit<QueuedMessage, 'id' | 'timestamp' | 'retryCount'>): string {
    if (this.messageQueue.size >= this.maxQueueSize) {
      console.warn('⚠️ Queue is full, removing oldest messages');
      this.cleanupOldMessages();
    }

    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedMessage: QueuedMessage = {
      ...message,
      id,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.messageQueue.set(id, queuedMessage);
    console.log(`📝 Message queued: ${id} (type: ${message.type})`);
    
    this.emit('messageQueued', queuedMessage);
    return id;
  }

  // Remove message from queue
  dequeueMessage(id: string): boolean {
    const removed = this.messageQueue.delete(id);
    if (removed) {
      console.log(`✅ Message removed from queue: ${id}`);
    }
    return removed;
  }

  // Get queue status
  getQueueStatus() {
    return {
      totalMessages: this.messageQueue.size,
      processing: this.processingQueue,
      messages: Array.from(this.messageQueue.values()).map(msg => ({
        id: msg.id,
        type: msg.type,
        phoneNumber: msg.phoneNumber,
        retryCount: msg.retryCount,
        maxRetries: msg.maxRetries,
        timestamp: msg.timestamp
      }))
    };
  }

  // Process queue when connection is available
  async processQueue(whatsappService: any) {
    if (this.processingQueue || this.messageQueue.size === 0) {
      return;
    }

    this.processingQueue = true;
    console.log(`🔄 Processing queue with ${this.messageQueue.size} messages`);

    for (const [id, message] of this.messageQueue.entries()) {
      try {
        // Check if WhatsApp is connected
        if (!whatsappService.isConnected) {
          console.log('⚠️ WhatsApp disconnected, pausing queue processing');
          break;
        }

        console.log(`📤 Processing queued message: ${id} (attempt ${message.retryCount + 1})`);

        let success = false;
        
        if (message.type === 'otp') {
          // Send OTP message
          const result = await whatsappService.sendOTPDirect(message.phoneNumber, message.otp!, message.fullName!);
          success = result.success;
        } else {
          // Send regular message
          const formattedNumber = whatsappService.formatPhoneNumber(message.phoneNumber);
          await whatsappService.socket.sendMessage(formattedNumber, { text: message.message });
          success = true;
        }

        if (success) {
          console.log(`✅ Successfully sent queued message: ${id}`);
          this.dequeueMessage(id);
          this.emit('messageSent', message);
        } else {
          throw new Error('Failed to send message');
        }

      } catch (error) {
        console.error(`❌ Failed to send queued message ${id}:`, error);
        
        message.retryCount++;
        
        if (message.retryCount >= message.maxRetries) {
          console.log(`🚫 Max retries reached for message ${id}, removing from queue`);
          this.dequeueMessage(id);
          this.emit('messageFailed', message);
        } else {
          console.log(`🔄 Will retry message ${id} (${message.retryCount}/${message.maxRetries})`);
          // Wait before next retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    this.processingQueue = false;
    console.log(`✅ Queue processing completed`);
  }

  // Start automatic queue processor
  private startQueueProcessor() {
    setInterval(() => {
      if (this.messageQueue.size > 0) {
        this.emit('processQueue');
      }
    }, 5000); // Check every 5 seconds
  }

  // Clean up old messages
  private cleanupOldMessages() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [id, message] of this.messageQueue.entries()) {
      if (now - message.timestamp > maxAge) {
        console.log(`🧹 Removing old message from queue: ${id}`);
        this.dequeueMessage(id);
      }
    }
  }

  // Clear all messages
  clearQueue() {
    const count = this.messageQueue.size;
    this.messageQueue.clear();
    console.log(`🧹 Cleared ${count} messages from queue`);
  }
}