// Simple test script to verify Meta WhatsApp API setup
const ACCESS_TOKEN = "EAAW1nntqY4IBPIDncncD2BUs71vfgXzL83x22wKglYEZBjEsJ27MzsZByVCmmjSmQ5Ymx5154RLEAF94DYmCyRQcevxNZAQXzLcjVZC0OYziIbLZAu8fJCXMbrA9cOSbSaIXx8UBKozITgZBvlK9pMYU0rvpZBZA7TlM6PmW0UxjvOA4CCSblTVdGR2U2zsE2z7PdeFGUKBZA3HDVNaYcpQdxTZBKv4LHmmfaxZB7kZBfTOXZAidg";
const PHONE_NUMBER_ID = "675759472293180";

async function testMetaAPI() {
  console.log("Testing Meta WhatsApp API setup...");
  
  // Test 1: Check phone number access
  console.log("1. Testing phone number access...");
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Phone number access: SUCCESS");
      console.log("Phone number info:", result);
    } else {
      console.log("❌ Phone number access: FAILED");
      console.log("Error:", result.error);
    }
  } catch (error) {
    console.log("❌ Phone number access: ERROR");
    console.log("Error:", error.message);
  }
  
  // Test 2: Try sending a test message
  console.log("\n2. Testing message sending...");
  try {
    const messageData = {
      messaging_product: 'whatsapp',
      to: '15556672190', // Test number from Meta console
      type: 'text',
      text: {
        body: 'Test message from PAKETY app'
      }
    };
    
    const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Message sending: SUCCESS");
      console.log("Message ID:", result.messages[0].id);
    } else {
      console.log("❌ Message sending: FAILED");
      console.log("Error:", result.error);
    }
  } catch (error) {
    console.log("❌ Message sending: ERROR");
    console.log("Error:", error.message);
  }
}

testMetaAPI();