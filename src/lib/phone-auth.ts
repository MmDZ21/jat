// ============================================================================
// Phone-based Customer Authentication (JWT + HttpOnly Cookie)
// ============================================================================

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "customer_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET || "jat-customer-secret-change-in-production"
);
const SESSION_DURATION_DAYS = 30;

interface CustomerPayload {
  phone: string;
  iat: number;
  exp: number;
}

/**
 * Create a signed JWT and set it as an HttpOnly cookie.
 */
export async function createCustomerSession(phone: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ phone })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60, // 30 days in seconds
  });
}

/**
 * Read + verify the customer session cookie.
 * Returns the phone number or null.
 */
export async function getCustomerPhone(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const data = payload as unknown as CustomerPayload;
    return data.phone || null;
  } catch {
    return null;
  }
}

/**
 * Clear the customer session cookie.
 */
export async function clearCustomerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Read the customer session token from a raw cookie header string.
 * This is used in middleware where the `cookies()` API isn't available.
 */
export async function verifyCustomerToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const data = payload as unknown as CustomerPayload;
    return data.phone || null;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
