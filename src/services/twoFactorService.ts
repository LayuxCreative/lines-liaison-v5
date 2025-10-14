import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  error?: string;
}

class TwoFactorService {
  /**
   * Generate a new 2FA secret and QR code for user setup
   */
  async generateSecret(userEmail: string, serviceName: string = 'Lines Liaison'): Promise<TwoFactorSetup> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: userEmail,
        issuer: serviceName,
        length: 32
      });

      // Generate QR code URL
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      return {
        secret: secret.base32!,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw new Error('Failed to generate 2FA setup');
    }
  }

  /**
   * Verify a TOTP token against a secret
   */
  verifyToken(token: string, secret: string, window: number = 1): TwoFactorVerification {
    try {
      // Remove any spaces or formatting from token
      const cleanToken = token.replace(/\s/g, '');

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: cleanToken,
        window // Allow for time drift
      });

      return {
        isValid: verified,
        error: verified ? undefined : 'Invalid authentication code'
      };
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      return {
        isValid: false,
        error: 'Failed to verify authentication code'
      };
    }
  }

  /**
   * Verify a backup code
   */
  verifyBackupCode(code: string, backupCodes: string[]): { isValid: boolean; remainingCodes: string[] } {
    const cleanCode = code.replace(/\s/g, '').toLowerCase();
    const codeIndex = backupCodes.findIndex(backupCode => 
      backupCode.toLowerCase() === cleanCode
    );

    if (codeIndex === -1) {
      return {
        isValid: false,
        remainingCodes: backupCodes
      };
    }

    // Remove used backup code
    const remainingCodes = backupCodes.filter((_, index) => index !== codeIndex);

    return {
      isValid: true,
      remainingCodes
    };
  }

  /**
   * Generate backup codes for 2FA recovery
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Generate new backup codes (for when user requests new ones)
   */
  regenerateBackupCodes(): string[] {
    return this.generateBackupCodes();
  }

  /**
   * Validate 2FA setup by verifying a token during setup
   */
  validateSetup(token: string, secret: string): boolean {
    const verification = this.verifyToken(token, secret);
    return verification.isValid;
  }
}

export const twoFactorService = new TwoFactorService();