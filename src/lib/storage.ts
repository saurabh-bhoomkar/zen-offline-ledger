// Enhanced storage utilities with proper encryption handling
import { encryptData, decryptData } from './crypto';

export interface StorageOptions {
  encrypt?: boolean;
  pin?: string;
}

class SecureStorage {
  private static instance: SecureStorage;
  private currentPin: string | null = null;

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  setPin(pin: string) {
    this.currentPin = pin;
  }

  clearPin() {
    this.currentPin = null;
  }

  async setItem(key: string, value: any, options: StorageOptions = {}): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      // Skip encryption for settings or if explicitly disabled
      if (!options.encrypt || key === 'zenLedger_settings') {
        localStorage.setItem(key, serialized);
        return;
      }

      const pin = options.pin || this.currentPin;
      if (!pin) {
        console.warn(`No PIN available for encrypting ${key}, storing unencrypted`);
        localStorage.setItem(key, serialized);
        return;
      }

      const encrypted = await encryptData(serialized, pin);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
      throw new Error(`Storage failed for ${key}`);
    }
  }

  async getItem<T>(key: string, defaultValue: T, options: StorageOptions = {}): Promise<T> {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      // Skip decryption for settings or if explicitly disabled
      if (!options.encrypt || key === 'zenLedger_settings') {
        return JSON.parse(item);
      }

      const pin = options.pin || this.currentPin;
      if (!pin) {
        console.warn(`No PIN available for decrypting ${key}`);
        // Try to parse as unencrypted (legacy data)
        try {
          return JSON.parse(item);
        } catch {
          return defaultValue;
        }
      }

      try {
        // Try to decrypt first
        const decrypted = await decryptData(item, pin);
        return JSON.parse(decrypted);
      } catch {
        // If decryption fails, try parsing as unencrypted (legacy data)
        try {
          const parsed = JSON.parse(item);
          // Re-encrypt legacy data
          await this.setItem(key, parsed, options);
          return parsed;
        } catch {
          return defaultValue;
        }
      }
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return defaultValue;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

export const secureStorage = SecureStorage.getInstance();