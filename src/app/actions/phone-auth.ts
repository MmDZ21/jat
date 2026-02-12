"use server";

import { db } from "@/db";
import { phoneVerifications } from "@/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { sendVerifySms } from "@/lib/sms";
import { createCustomerSession, clearCustomerSession } from "@/lib/phone-auth";

// ============================================================================
// CONSTANTS
// ============================================================================

const OTP_EXPIRY_MINUTES = 3;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// ============================================================================
// NORMALIZE PHONE NUMBER
// ============================================================================

function normalizePhone(raw: string): string {
  // Remove all non-digit characters
  let phone = raw.replace(/\D/g, "");

  // Handle Iranian numbers:
  // 09xxxxxxxxx -> 09xxxxxxxxx (already 11 digits)
  // 9xxxxxxxxx  -> 09xxxxxxxxx (10 digits, add leading 0)
  // 989xxxxxxxxx -> 09xxxxxxxxx (12 digits with country code)
  // +989xxxxxxxxx same as above after stripping +

  if (phone.startsWith("98") && phone.length === 12) {
    phone = "0" + phone.slice(2);
  } else if (phone.startsWith("9") && phone.length === 10) {
    phone = "0" + phone;
  }

  return phone;
}

// ============================================================================
// GENERATE RANDOM 6-DIGIT CODE
// ============================================================================

function generateCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

// ============================================================================
// SEND OTP
// ============================================================================

export async function sendPhoneOtp(
  rawPhone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const phone = normalizePhone(rawPhone);

    // Validate Iranian mobile number format: 09xxxxxxxxx (11 digits)
    if (!/^09\d{9}$/.test(phone)) {
      return { success: false, error: "شماره موبایل نامعتبر است" };
    }

    // Check for recent OTP (rate limiting - prevent spam)
    const recentOtp = await db
      .select()
      .from(phoneVerifications)
      .where(
        and(
          eq(phoneVerifications.phone, phone),
          gt(phoneVerifications.createdAt, new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000))
        )
      )
      .orderBy(desc(phoneVerifications.createdAt))
      .limit(1);

    if (recentOtp.length > 0) {
      return { success: false, error: "لطفاً کمی صبر کنید و دوباره تلاش کنید" };
    }

    // Generate OTP code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store in DB
    await db.insert(phoneVerifications).values({
      phone,
      code,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    // Send via sms.ir
    const smsResult = await sendVerifySms(phone, code);
    if (!smsResult.success) {
      return { success: false, error: smsResult.error || "خطا در ارسال پیامک" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return { success: false, error: "خطایی رخ داد. لطفاً دوباره تلاش کنید." };
  }
}

// ============================================================================
// VERIFY OTP & CREATE SESSION
// ============================================================================

export async function verifyPhoneOtp(
  rawPhone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const phone = normalizePhone(rawPhone);

    if (!/^09\d{9}$/.test(phone)) {
      return { success: false, error: "شماره موبایل نامعتبر است" };
    }

    if (!/^\d{6}$/.test(code)) {
      return { success: false, error: "کد تأیید باید ۶ رقم باشد" };
    }

    // Find the latest unexpired, unverified OTP for this phone
    const otpRecord = await db
      .select()
      .from(phoneVerifications)
      .where(
        and(
          eq(phoneVerifications.phone, phone),
          eq(phoneVerifications.verified, false),
          gt(phoneVerifications.expiresAt, new Date())
        )
      )
      .orderBy(desc(phoneVerifications.createdAt))
      .limit(1);

    if (otpRecord.length === 0) {
      return { success: false, error: "کد تأیید منقضی شده است. لطفاً دوباره درخواست کنید." };
    }

    const record = otpRecord[0];

    // Check max attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      return { success: false, error: "تعداد تلاش‌ها بیش از حد مجاز است. لطفاً کد جدید درخواست کنید." };
    }

    // Increment attempts
    await db
      .update(phoneVerifications)
      .set({ attempts: record.attempts + 1 })
      .where(eq(phoneVerifications.id, record.id));

    // Verify code
    if (record.code !== code) {
      return { success: false, error: "کد وارد شده نادرست است" };
    }

    // Mark as verified
    await db
      .update(phoneVerifications)
      .set({ verified: true })
      .where(eq(phoneVerifications.id, record.id));

    // Create customer session (JWT cookie)
    await createCustomerSession(phone);

    return { success: true };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, error: "خطایی رخ داد. لطفاً دوباره تلاش کنید." };
  }
}

// ============================================================================
// LOGOUT
// ============================================================================

export async function logoutCustomer(): Promise<{ success: boolean }> {
  try {
    await clearCustomerSession();
    return { success: true };
  } catch {
    return { success: true }; // Always succeed — just clear cookie
  }
}
