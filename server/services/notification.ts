/**
 * Notification Service for Mahajan Garments Admin Alerts
 * Formats incoming orders into clean mobile WhatsApp / SMS messages
 * and dispatches them via Twilio / WhatsApp API (or console fallback logger).
 */

export interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    paymentMethod?: string;
  };
  items: Array<{
    productName: string;
    size: string;
    quantity: number;
    price: string;
  }>;
  subtotal: string;
  shipping: string;
  total: string;
}

/**
 * Build clean mobile-ready text for WhatsApp / SMS
 */
export function formatOrderAlertMessage(order: OrderNotificationData): string {
  const itemList = order.items
    .map((item) => `  • ${item.productName} (Size: ${item.size}) x${item.quantity} - ₹${item.price}`)
    .join("\n");

  const address = order.shippingAddress;
  const fullAddress = `${address.address}, ${address.city}, ${address.state} - ${address.zipCode}`;
  const payment = (address.paymentMethod || "COD").toUpperCase();

  return [
    `🛍️ *New Order Received! (#${order.orderNumber})*`,
    ``,
    `👤 *Customer:* ${order.customerName}`,
    `📞 *Phone:* ${order.customerPhone || "N/A"}`,
    `✉️ *Email:* ${order.customerEmail}`,
    `📍 *Address:* ${fullAddress}`,
    ``,
    `📦 *Items:*`,
    itemList,
    ``,
    `💰 *Total Amount:* ₹${order.total} (${payment} / Pending)`,
    `⏰ *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
  ].join("\n");
}

/**
 * Dispatch instant mobile phone alert to admin/store manager
 */
export async function sendAdminOrderNotification(order: OrderNotificationData): Promise<boolean> {
  const alertText = formatOrderAlertMessage(order);

  // Always log prominently to server console
  console.log("\n=======================================================");
  console.log("📲 [INSTANT ADMIN PHONE ALERT - MAHAJAN GARMENTS]");
  console.log("=======================================================");
  console.log(alertText);
  console.log("=======================================================\n");

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER;
  const adminPhone = process.env.ADMIN_PHONE_NUMBER || "+919876543210";

  // If Twilio credentials exist, attempt real SMS/WhatsApp transmission
  if (accountSid && authToken && fromPhone) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          },
          body: new URLSearchParams({
            To: adminPhone,
            From: fromPhone,
            Body: alertText,
          }),
        }
      );

      if (response.ok) {
        console.log(`✅ SMS/WhatsApp alert successfully sent to ${adminPhone}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error("⚠️ Failed to send SMS/WhatsApp via Twilio:", errorText);
      }
    } catch (err) {
      console.error("⚠️ Error sending admin notification:", err);
    }
  } else {
    console.log(`ℹ️ [INFO] Twilio credentials not configured in .env. Alert logged to console for phone: ${adminPhone}`);
  }

  return true;
}
