const crypto = require('crypto');
const { securityConfig } = require('../config/security');

class EncryptionService {
  constructor() {
    this.algorithm = securityConfig.encryption.algorithm;
    this.keyLength = securityConfig.encryption.keyLength;
    this.ivLength = securityConfig.encryption.ivLength;
    this.tagLength = securityConfig.encryption.tagLength;
    
    // Get encryption key from environment
    this.encryptionKey = process.env.ENCRYPTION_KEY;
    
    // Generate a proper fallback key for development if none provided
    if (!this.encryptionKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY environment variable is required for production');
      }
      // Generate a proper hex key for development
      const crypto = require('crypto');
      this.encryptionKey = crypto.randomBytes(16).toString('hex');
      console.warn('⚠️ Generated development encryption key. Set ENCRYPTION_KEY environment variable for production.');
    }
    
    // Validate encryption key format
    this.validateEncryptionKey();
    
    // Convert hex key to buffer
    this.keyBuffer = Buffer.from(this.encryptionKey, 'hex');
  }

  // Validate encryption key format
  validateEncryptionKey() {
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY is required');
    }
    
    // Check if it's a valid hex string
    if (!/^[0-9a-fA-F]+$/.test(this.encryptionKey)) {
      throw new Error('ENCRYPTION_KEY must be a valid hexadecimal string');
    }
    
    // Check minimum length (32 characters = 16 bytes for AES-256)
    if (this.encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
    
    // Check if key length is even (hex strings should have even length)
    if (this.encryptionKey.length % 2 !== 0) {
      throw new Error('ENCRYPTION_KEY must have even length (hex string)');
    }
    
    console.log(`[EncryptionService] Using encryption key with length: ${this.encryptionKey.length} characters`);
  }

  // Encrypt sensitive data
  encrypt(text) {
    try {
      if (!text) return text;
      
      console.log('EncryptionService: Starting encryption process');
      console.log('EncryptionService: Key buffer length:', this.keyBuffer.length);
      console.log('EncryptionService: Algorithm:', this.algorithm);
      
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipherGCM(this.algorithm, this.keyBuffer, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      console.log('EncryptionService: Encryption completed successfully');
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      console.error('EncryptionService: Encryption error:', {
        error: error.message,
        stack: error.stack,
        keyLength: this.keyBuffer?.length,
        algorithm: this.algorithm
      });
      throw new Error(`Failed to encrypt data: ${error.message}`);
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData) {
    try {
      if (!encryptedData || typeof encryptedData === 'string') {
        return encryptedData;
      }
      
      const { encrypted, iv, tag } = encryptedData;
      if (!encrypted) {
        return encryptedData;
      }
      
      // Handle legacy data without tag (backward compatibility)
      if (!tag) {
        console.warn('Decrypting legacy data without authentication tag');
        const decipher = crypto.createDecipher(this.algorithm, this.keyBuffer);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }
      
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      const decipher = crypto.createDecipherGCM(this.algorithm, this.keyBuffer, ivBuffer);
      decipher.setAuthTag(tagBuffer);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Encrypt object fields
  encryptObject(obj, fieldsToEncrypt) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const encrypted = { ...obj };
    
    fieldsToEncrypt.forEach(field => {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    });
    
    return encrypted;
  }

  // Decrypt object fields
  decryptObject(obj, fieldsToDecrypt) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const decrypted = { ...obj };
    
    fieldsToDecrypt.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'object') {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    });
    
    return decrypted;
  }

  // Hash sensitive data (one-way)
  hash(text, salt = null) {
    try {
      if (!text) return text;
      
      const actualSalt = salt || crypto.randomBytes(16).toString('hex');
      const hash = crypto.createHash('sha256');
      hash.update(text + actualSalt);
      
      return {
        hash: hash.digest('hex'),
        salt: actualSalt
      };
    } catch (error) {
      console.error('Hashing error:', error);
      throw new Error('Failed to hash data');
    }
  }

  // Verify hashed data
  verifyHash(text, hashedData) {
    try {
      if (!text || !hashedData || !hashedData.hash || !hashedData.salt) {
        return false;
      }
      
      const hash = crypto.createHash('sha256');
      hash.update(text + hashedData.salt);
      const computedHash = hash.digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(hashedData.hash, 'hex')
      );
    } catch (error) {
      console.error('Hash verification error:', error);
      return false;
    }
  }

  // Generate secure random string
  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate secure random number
  generateSecureRandomNumber(min = 0, max = 1000000) {
    const range = max - min;
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0);
    return min + (randomValue % range);
  }

  // Encrypt file buffer
  encryptFile(buffer) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipherGCM(this.algorithm, this.keyBuffer, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(buffer),
        cipher.final()
      ]);
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv,
        tag
      };
    } catch (error) {
      console.error('File encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  // Decrypt file buffer
  decryptFile(encryptedData) {
    try {
      const { encrypted, iv, tag } = encryptedData;
      
      const decipher = crypto.createDecipherGCM(this.algorithm, this.keyBuffer, iv);
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted;
    } catch (error) {
      console.error('File decryption error:', error);
      throw new Error('Failed to decrypt file');
    }
  }

  // Create data signature
  createSignature(data, secret = null) {
    try {
      const secretKey = secret || this.encryptionKey;
      const hmac = crypto.createHmac('sha256', secretKey);
      hmac.update(JSON.stringify(data));
      return hmac.digest('hex');
    } catch (error) {
      console.error('Signature creation error:', error);
      throw new Error('Failed to create signature');
    }
  }

  // Verify data signature
  verifySignature(data, signature, secret = null) {
    try {
      const expectedSignature = this.createSignature(data, secret);
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Encrypt sensitive fields in user data
  encryptUserData(userData) {
    const fieldsToEncrypt = [
      'phone',
      'emergencyContacts',
      'medicalConditions',
      'bankAccountNumber',
      'ssn',
      'passportNumber'
    ];
    
    return this.encryptObject(userData, fieldsToEncrypt);
  }

  // Decrypt sensitive fields in user data
  decryptUserData(userData) {
    const fieldsToDecrypt = [
      'phone',
      'emergencyContacts',
      'medicalConditions',
      'bankAccountNumber',
      'ssn',
      'passportNumber'
    ];
    
    return this.decryptObject(userData, fieldsToDecrypt);
  }

  // Encrypt financial data
  encryptFinancialData(financialData) {
    const fieldsToEncrypt = [
      'accountNumber',
      'routingNumber',
      'cardNumber',
      'cvv',
      'bankName',
      'accountHolderName'
    ];
    
    return this.encryptObject(financialData, fieldsToEncrypt);
  }

  // Decrypt financial data
  decryptFinancialData(financialData) {
    const fieldsToDecrypt = [
      'accountNumber',
      'routingNumber',
      'cardNumber',
      'cvv',
      'bankName',
      'accountHolderName'
    ];
    
    return this.decryptObject(financialData, fieldsToDecrypt);
  }

  // Encrypt health data
  encryptHealthData(healthData) {
    const fieldsToEncrypt = [
      'medicalConditions',
      'medications',
      'allergies',
      'bloodType',
      'emergencyContact',
      'insuranceNumber'
    ];
    
    return this.encryptObject(healthData, fieldsToEncrypt);
  }

  // Decrypt health data
  decryptHealthData(healthData) {
    const fieldsToDecrypt = [
      'medicalConditions',
      'medications',
      'allergies',
      'bloodType',
      'emergencyContact',
      'insuranceNumber'
    ];
    
    return this.decryptObject(healthData, fieldsToDecrypt);
  }
}

module.exports = EncryptionService;
