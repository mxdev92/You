# Expo React Native Notification Targeting Guide

## Overview
This guide explains how to implement **targeted notifications** in Expo React Native apps to ensure notifications are sent only to specific users/devices, not broadcast to all users.

## The Problem: Notification Broadcasting
Common mistakes that cause ALL users to receive notifications:
- Using broadcast functions instead of targeted sending
- Sending to multiple tokens in a loop without proper validation
- Missing token validation that allows invalid tokens to trigger broadcasts
- Using development/testing tokens that reach multiple devices

## Solution: Proper Notification Targeting

### 1. Server-Side Implementation

#### Correct Way: One Token, One Notification
```javascript
// ✅ CORRECT: Send to specific token only
async function sendTargetedNotification(userToken, title, body, data) {
  // Validate token format first
  if (!isValidExpoToken(userToken)) {
    return { success: false, message: 'Invalid token format' };
  }

  const notification = {
    to: userToken,  // Single specific token only
    title: title,
    body: body,
    data: data || {}
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notification)  // Single notification object
  });

  return await response.json();
}
```

#### Wrong Way: Broadcasting to All
```javascript
// ❌ WRONG: Never do this in production
async function sendToAllUsers(title, body) {
  const allTokens = await getAllUserTokens(); // Gets ALL user tokens
  
  // This sends to EVERYONE - very bad!
  for (const token of allTokens) {
    await sendNotification(token, title, body);
  }
}
```

### 2. Token Management Best Practices

#### Store Tokens Per User
```javascript
// Database schema
const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email"),
  notificationToken: varchar("notification_token"), // One token per user
  isActive: boolean("is_active").default(true)
});
```

#### Validate Tokens Before Sending
```javascript
function isValidExpoToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Valid Expo token formats
  return token.startsWith('ExponentPushToken[') || 
         token.startsWith('expo:') ||
         token.startsWith('ExpoPushToken[');
}
```

### 3. API Endpoint Implementation

#### Targeted Notification Endpoint
```javascript
// ✅ Send notification to specific user only
app.post('/api/users/:userId/send-notification', async (req, res) => {
  const userId = req.params.userId;
  const { title, body, data } = req.body;

  // Get ONLY this specific user's token
  const user = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.notificationToken) {
    return res.status(400).json({ 
      success: false, 
      message: 'User has no notification token' 
    });
  }

  // Send to ONLY this user's token
  const result = await sendTargetedNotification(
    user.notificationToken,
    title,
    body,
    data
  );

  res.json(result);
});
```

### 4. Frontend Implementation (React Native)

#### Register for Notifications
```javascript
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications() {
  // Get permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  // Get unique token for THIS device
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id'
  });

  // Send token to server for THIS user only
  await fetch('/api/users/me/notification-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token.data })
  });

  return token.data;
}
```

#### Handle Incoming Notifications
```javascript
// Listen for notifications
Notifications.addNotificationReceivedListener(notification => {
  console.log('Notification received:', notification);
  // This device received a targeted notification
});

Notifications.addNotificationResponseReceivedListener(response => {
  console.log('Notification tapped:', response.notification.request.content.data);
  // Handle notification tap
});
```

### 5. Testing Targeted Notifications

#### Test with Specific User ID
```javascript
// Admin panel test function
async function testUserNotification(userId) {
  const response = await fetch(`/api/users/${userId}/send-notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Notification',
      body: 'This should only go to one user',
      data: { test: true }
    })
  });

  const result = await response.json();
  console.log('Test result:', result);
}
```

### 6. Common Mistakes to Avoid

#### ❌ Don't Use Array of Tokens
```javascript
// Wrong - this might broadcast
const notification = {
  to: [token1, token2, token3], // Multiple tokens
  title: 'Test'
};
```

#### ❌ Don't Loop Without Validation
```javascript
// Wrong - sends to everyone
const allUsers = await getAllUsers();
for (const user of allUsers) {
  await sendNotification(user.token, title, body);
}
```

#### ❌ Don't Use Global Broadcast Functions
```javascript
// Wrong - broadcasts to all connected devices
function broadcastToAll(message) {
  websocketClients.forEach(client => {
    client.send(message); // Sends to ALL clients
  });
}
```

### 7. Debug and Verify Targeting

#### Add Logging
```javascript
console.log(`Sending notification to user ${userId} with token: ${token.substring(0, 20)}...`);
console.log(`Notification sent successfully to user ${userId}`);
```

#### Check Expo Push Receipt
```javascript
const receipt = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ids: [pushTicketId] })
});

console.log('Delivery receipt:', await receipt.json());
```

## Key Principles

1. **One Token = One User**: Each notification token should belong to exactly one user
2. **Validate Before Send**: Always check token format before sending
3. **Target Specific Users**: Never use broadcast or "send to all" functions
4. **Log Everything**: Add detailed logging to track notification targeting
5. **Test Thoroughly**: Verify only intended users receive notifications

## Security Notes

- Never store tokens in plain text logs
- Rotate tokens periodically for security
- Validate user permissions before sending notifications
- Rate limit notification endpoints to prevent spam

This guide ensures your Expo React Native app sends notifications only to intended recipients, preventing the broadcast issues we experienced.