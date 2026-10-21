// Install: npm install jose

import * as jose from 'jose';
import { assertDotEnv } from './Asserter';
import { logger_e } from './Logger';

export interface AppPayload {
    userId: string;
    alias: string;
    role: 'admin' | 'user';

}
if (!assertDotEnv()) {
    throw new Error('Environment variables not set properly');
}
const key = Buffer.from(process.env.JWT_ENC_KEY as string, 'hex');

export async function issueEncryptedJWT(payload: AppPayload) {
    try {
        const fulljwt = {
            ...payload,
        }
        // Create encrypted JWT (JWE)
        const jwt = await new jose.EncryptJWT(fulljwt)
            .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }) // Direct encryption with AES-256-GCM
            .setIssuedAt()
            .setIssuer('chronows')
            .setAudience('cronoapp')
            .encrypt(key); // Use a 256-bit key from env
        console.log('Encrypted JWT:', jwt);
        return jwt;
    } catch (error) {
        logger_e('Error issuing JWT:', error);
        return null;
    }
}

export async function verifyAndDecryptJWT(token: string) {
    try {
        // Decrypt and verify the JWT
        const { payload, protectedHeader } = await jose.jwtDecrypt(token, key, {
            issuer: 'chronows',
            audience: 'cronoapp'
        });

        return payload;
    } catch (error) {
        logger_e('Error verifying JWT:', error);
        return null;
    }
}

