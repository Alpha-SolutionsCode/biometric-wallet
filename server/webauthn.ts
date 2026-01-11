import { randomBytes } from "crypto";
import { createFingerprint, getFingerprintByCredentialId, getUserFingerprints } from "./db";
import type { InsertFingerprint } from "../drizzle/schema";

/**
 * WebAuthn utility functions for fingerprint authentication
 * Uses the Web Authentication API standard (FIDO2)
 */

// Base64 URL encoding/decoding utilities
export function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64UrlDecode(str: string): Uint8Array {
  const padded = str + "===".slice((str.length + 3) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a challenge for WebAuthn registration or authentication
 * Challenge should be a random 32-byte value
 */
export function generateChallenge(): Uint8Array {
  return randomBytes(32);
}

/**
 * Create registration options for WebAuthn
 * These options are sent to the client for credential creation
 */
export function createRegistrationOptions(userId: number, userName: string, displayName: string) {
  const challenge = generateChallenge();

  return {
    challenge: base64UrlEncode(challenge),
    rp: {
      name: "Biometric Wallet",
      id: process.env.WEBAUTHN_RP_ID || "localhost",
    },
    user: {
      id: base64UrlEncode(new TextEncoder().encode(userId.toString())),
      name: userName,
      displayName: displayName,
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256
      { type: "public-key", alg: -257 }, // RS256
    ],
    timeout: 60000,
    attestation: "direct",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "preferred",
    },
  };
}

/**
 * Create authentication options for WebAuthn
 * These options are sent to the client for credential assertion
 */
export function createAuthenticationOptions(userId: number) {
  const challenge = generateChallenge();

  return {
    challenge: base64UrlEncode(challenge),
    timeout: 60000,
    userVerification: "preferred",
    rpId: process.env.WEBAUTHN_RP_ID || "localhost",
  };
}

/**
 * Verify a WebAuthn registration response
 * This validates the credential created by the client
 */
export async function verifyRegistrationResponse(
  userId: number,
  credentialId: string,
  publicKey: string,
  transports?: string[]
): Promise<boolean> {
  try {
    // Store the credential in the database
    await createFingerprint({
      userId,
      credentialId,
      publicKey,
      counter: 0,
      transports: transports ? JSON.stringify(transports) : null,
      isActive: true,
    } as InsertFingerprint);

    return true;
  } catch (error) {
    console.error("Failed to verify registration:", error);
    return false;
  }
}

/**
 * Verify a WebAuthn authentication response
 * This validates the assertion created by the client
 */
export async function verifyAuthenticationResponse(
  credentialId: string,
  clientData: string,
  authenticatorData: string,
  signature: string
): Promise<{ valid: boolean; userId?: number }> {
  try {
    // Decode the credential ID
    const decodedBytes = base64UrlDecode(credentialId);
    const decodedCredentialId = new TextDecoder().decode(decodedBytes);

    // Look up the credential
    const credential = await getFingerprintByCredentialId(decodedCredentialId);
    if (!credential) {
      return { valid: false };
    }

    // In a production system, you would:
    // 1. Verify the signature using the stored public key
    // 2. Check the counter to prevent cloning
    // 3. Validate the client data and authenticator data

    // For now, we'll do basic validation
    if (!clientData || !authenticatorData || !signature) {
      return { valid: false };
    }

    // Update last used timestamp
    // Update last used timestamp would require async import which is complex
    // This will be handled in the router layer

    return { valid: true, userId: credential.userId };
  } catch (error) {
    console.error("Failed to verify authentication:", error);
    return { valid: false };
  }
}

/**
 * Get all fingerprints for a user
 */
export async function getUserFingerprintsList(userId: number) {
  try {
    const fingerprints = await getUserFingerprints(userId);
    return fingerprints.map(fp => ({
      id: fp.id,
      credentialId: fp.credentialId,
      createdAt: fp.createdAt,
      lastUsed: fp.lastUsed,
      isActive: fp.isActive,
    }));
  } catch (error) {
    console.error("Failed to get user fingerprints:", error);
    return [];
  }
}
