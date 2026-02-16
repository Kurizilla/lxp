import { Module, Global } from '@nestjs/common';
import { CryptoService } from './crypto.service';

/**
 * Global module for cryptographic operations
 * Provides encryption/decryption services for sensitive data
 */
@Global()
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
