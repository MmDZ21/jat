// ============================================================================
// sms.ir Integration — Verify (Shared Pattern) Endpoint
// ============================================================================

const SMS_API_BASE = "https://api.sms.ir/v1";

interface SmsVerifyResponse {
  status: number;
  message: string;
}

/**
 * Send a verification code via sms.ir Shared Pattern (Verify) endpoint.
 * This bypasses promotional-text blocks and delivers instantly.
 */
export async function sendVerifySms(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SMS_API_KEY;
  const templateId = process.env.SMS_TEMPLATE_ID;

  if (!apiKey || !templateId) {
    console.error("SMS_API_KEY or SMS_TEMPLATE_ID not configured");
    return { success: false, error: "سرویس پیامک پیکربندی نشده است" };
  }

  try {
    const response = await fetch(`${SMS_API_BASE}/send/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        mobile: phoneNumber,
        templateId: Number(templateId),
        parameters: [
          { name: "Code", value: code },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("sms.ir API error:", response.status, text);
      return { success: false, error: "خطا در ارسال پیامک" };
    }

    const data: SmsVerifyResponse = await response.json();

    if (data.status !== 1) {
      console.error("sms.ir returned non-success status:", data);
      return { success: false, error: data.message || "خطا در ارسال پیامک" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: "خطا در ارسال پیامک. لطفاً دوباره تلاش کنید." };
  }
}
