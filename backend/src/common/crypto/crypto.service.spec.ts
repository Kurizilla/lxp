import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    service = new CryptoService();
  });

  describe('encrypt', () => {
    it('should encrypt a plaintext string', () => {
      const plaintext = 'my-secret-access-key';
      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      // Base64 encoded string should be different from plaintext
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should return empty string for empty input', () => {
      expect(service.encrypt('')).toBe('');
    });

    it('should generate different ciphertexts for same plaintext (random IV)', () => {
      const plaintext = 'test-secret';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      // Different IVs should produce different ciphertexts
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string back to original', () => {
      const plaintext = 'my-super-secret-key-12345';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should return empty string for empty input', () => {
      expect(service.decrypt('')).toBe('');
    });

    it('should handle special characters', () => {
      const plaintext = 'key!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'clave-secreta-español-中文-🔐';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => service.decrypt('invalid-base64-data!')).toThrow('Failed to decrypt data');
    });

    it('should throw error for tampered data', () => {
      const plaintext = 'test-secret';
      const encrypted = service.encrypt(plaintext);
      
      // Tamper with the encrypted data
      const tamperedBuffer = Buffer.from(encrypted, 'base64');
      tamperedBuffer[tamperedBuffer.length - 5] ^= 0xff; // Flip some bits
      const tampered = tamperedBuffer.toString('base64');

      expect(() => service.decrypt(tampered)).toThrow('Failed to decrypt data');
    });
  });

  describe('hash', () => {
    it('should hash a value using SHA-256', () => {
      const value = 'test-value';
      const hash = service.hash(value);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it('should produce same hash for same input', () => {
      const value = 'consistent-value';
      const hash1 = service.hash(value);
      const hash2 = service.hash(value);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = service.hash('value1');
      const hash2 = service.hash('value2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateKey', () => {
    it('should generate a 64-character hex key', () => {
      const key = CryptoService.generateKey();

      expect(key).toBeDefined();
      expect(key.length).toBe(64);
      expect(/^[0-9a-f]+$/i.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = CryptoService.generateKey();
      const key2 = CryptoService.generateKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('round-trip encryption', () => {
    it('should handle long strings', () => {
      const plaintext = 'x'.repeat(10000);
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle AWS-style secret keys', () => {
      const accessKey = 'AKIAIOSFODNN7EXAMPLE';
      const secretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

      const encryptedAccess = service.encrypt(accessKey);
      const encryptedSecret = service.encrypt(secretKey);

      expect(service.decrypt(encryptedAccess)).toBe(accessKey);
      expect(service.decrypt(encryptedSecret)).toBe(secretKey);
    });
  });
});
