// frontend/src/hooks/useEncryptedData.js
import { useState, useCallback } from 'react';
import axios from 'axios';

const useEncryptedData = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    // Fetch encrypted data and decrypt client-side
    const fetchAndDecrypt = useCallback(async (endpoint, token) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success && response.data.encrypted) {
                // Client-side decryption (for sensitive fields)
                const decryptedData = await decryptClientSide(
                    response.data.encrypted,
                    response.data.iv,
                    response.data.authTag
                );
                
                setData({
                    ...response.data,
                    decrypted: decryptedData
                });
            } else {
                setData(response.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Client-side decryption (using Web Crypto API)
    const decryptClientSide = async (encrypted, iv, authTag) => {
        if (typeof window === 'undefined' || !window.crypto) {
            throw new Error('Web Crypto API not available');
        }

        try {
            // Get encryption key from secure storage
            const key = await getEncryptionKey();
            
            // Import key
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                key,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            // Decrypt
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: new Uint8Array(Buffer.from(iv, 'hex')),
                    additionalData: new Uint8Array(),
                    tagLength: 128
                },
                cryptoKey,
                new Uint8Array(Buffer.from(encrypted, 'hex'))
            );

            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (err) {
            console.error('Client-side decryption failed:', err);
            throw new Error('Failed to decrypt data');
        }
    };

    // Get encryption key from secure storage
    const getEncryptionKey = async () => {
        // Try to get from IndexedDB or localStorage
        let key = localStorage.getItem('encryption_key');
        
        if (!key) {
            // Generate new key
            const array = new Uint8Array(32);
            window.crypto.getRandomValues(array);
            key = Buffer.from(array).toString('hex');
            
            // Store securely
            localStorage.setItem('encryption_key', key);
        }
        
        return Buffer.from(key, 'hex');
    };

    return { data, loading, error, fetchAndDecrypt };
};

export default useEncryptedData;