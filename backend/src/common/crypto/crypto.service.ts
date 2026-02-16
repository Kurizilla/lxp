import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Configuration for encryption
 */
export interface CryptoConfig {
  /** Encryption key (should be 32 bytes for AES-256) */
  encryptionKey: string;
}

/**
 * Service for encrypting and decrypting sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16; // 128 bits for GCM
  private readonly authTagLength = 16; // 128 bits
  private readonly keyLength = 32; // 256 bits
  private readonly encryptionKey: Buffer;

  constructor() {
    // Get encryption key from environment or generate a default one for development
    const keyEnv = process.env.ENCRYPTION_KEY || process.env.DOTENV_VAULT_KEY;
    
    if (keyEnv) {
      // Use provided key (should be 32 bytes or a hex string of 64 chars)
      if (keyEnv.length === 64) {
        // Hex-encoded 32-byte key
        this.encryptionKey = Buffer.from(keyEnv, 'hex');
      } else if (keyEnv.length >= 32) {
        // Use first 32 characters
        this.encryptionKey = Buffer.from(keyEnv.slice(0, 32), 'utf8');
      } else {
        // Pad or hash shorter keys
        this.encryptionKey = crypto
          .createHash('sha256')
          .update(keyEnv)
          .digest();
      }
    } else {
      // Generate a deterministic key for development (NOT secure for production)
      // In production, ENCRYPTION_KEY must be set
      this.encryptionKey = crypto
        .createHash('sha256')
        .update('dev-encryption-key-change-in-production')
        .digest();
    }
  }

  /**
   * Encrypt a plaintext string
   * Returns a base64-encoded string containing IV + ciphertext + auth tag
   * 
   * @param plaintext - The string to encrypt
   * @returns Base64-encoded encrypted string
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      return '';
    }

    // Generate a random IV for each encryption
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
      { authTagLength: this.authTagLength },
    );

    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV + encrypted data + auth tag
    const combined = Buffer.concat([iv, encrypted, authTag]);

    // Return as base64
    return combined.toString('base64');
  }

  /**
   * Decrypt an encrypted string
   * Expects a base64-encoded string containing IV + ciphertext + auth tag
   * 
   * @param encryptedData - Base64-encoded encrypted string
   * @returns Decrypted plaintext string
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) {
      return '';
    }

    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const iv = combined.subarray(0, this.ivLength);
      const authTag = combined.subarray(combined.length - this.authTagLength);
      const encrypted = combined.subarray(
        this.ivLength,
        combined.length - this.authTagLength,
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
        { authTagLength: this.authTagLength },
      );

      // Set the auth tag for verification
      decipher.setAuthTag(authTag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      // Log error for debugging but don't expose details
      console.error('Decryption failed:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate a new random encryption key (for setup purposes)
   * Returns a hex-encoded 32-byte key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a value using SHA-256 (for non-reversible storage like comparing credentials)
   * 
   * @param value - The value to hash
   * @returns Hex-encoded hash
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}
