// Encryption utilities for secure data storage
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

// Derive encryption key from PIN
async function deriveKey(pin: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);
  const saltBuffer = encoder.encode(salt);
  
  // Import PIN as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with PIN-derived key
export async function encryptData(data: string, pin: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Derive key from PIN and salt
    const key = await deriveKey(pin, Array.from(salt).map(b => String.fromCharCode(b)).join(''));
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      dataBuffer
    );
    
    // Combine salt + iv + encrypted data
    const combinedBuffer = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
    combinedBuffer.set(salt, 0);
    combinedBuffer.set(iv, salt.length);
    combinedBuffer.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combinedBuffer));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data with PIN-derived key
export async function decryptData(encryptedData: string, pin: string): Promise<string> {
  try {
    // Convert from base64
    const combinedBuffer = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract salt, IV, and encrypted data
    const salt = combinedBuffer.slice(0, 16);
    const iv = combinedBuffer.slice(16, 16 + IV_LENGTH);
    const encryptedBuffer = combinedBuffer.slice(16 + IV_LENGTH);
    
    // Derive key from PIN and salt
    const key = await deriveKey(pin, Array.from(salt).map(b => String.fromCharCode(b)).join(''));
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedBuffer
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - incorrect PIN or corrupted data');
  }
}

// Get current user PIN from settings
export function getCurrentPin(): string | null {
  try {
    const settings = localStorage.getItem('zenLedger_settings');
    if (!settings) return null;
    
    const parsed = JSON.parse(settings);
    return parsed.pinHash || null;
  } catch {
    return null;
  }
}