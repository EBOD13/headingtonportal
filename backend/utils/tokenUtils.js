// backend/utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Clerk = require('../models/clerkModel');

class TokenManager {
    // Generate access token
    static generateAccessToken(clerkId) {
        return jwt.sign(
            { 
                id: clerkId,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
                issuer: 'headington-portal',
                audience: 'web-client'
            }
        );
    }

    // Generate refresh token
    static generateRefreshToken(clerkId, device = 'unknown', ipAddress = 'unknown') {
        const refreshToken = crypto.randomBytes(40).toString('hex');
        
        const tokenData = {
            token: refreshToken,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            device,
            ipAddress
        };

        return { refreshToken: tokenData.token, tokenData };
    }

    // Verify and rotate tokens
    static async verifyAndRotateTokens(accessToken, refreshToken, ipAddress) {
        try {
            // Try to verify access token first
            let decoded;
            try {
                decoded = jwt.verify(accessToken, process.env.JWT_SECRET, {
                    ignoreExpiration: true // We'll check expiration ourselves
                });
            } catch (error) {
                if (error.name !== 'TokenExpiredError') {
                    throw error;
                }
                // Token is expired, we'll use refresh token
            }

            // If token is valid and not expired, return it
            if (decoded && decoded.exp * 1000 > Date.now()) {
                return { 
                    accessToken, 
                    refreshToken: null,
                    shouldRotate: false 
                };
            }

            // Token is expired, verify refresh token
            if (!refreshToken) {
                throw new Error('Refresh token required');
            }

            // Find clerk with this refresh token
            const clerk = await Clerk.findOne({
                'refreshTokens.token': refreshToken,
                'refreshTokens.expires': { $gt: new Date() }
            });

            if (!clerk) {
                throw new Error('Invalid or expired refresh token');
            }

            // Remove the used refresh token
            await Clerk.findByIdAndUpdate(clerk._id, {
                $pull: { 
                    refreshTokens: { token: refreshToken } 
                }
            });

            // Generate new tokens
            const newAccessToken = this.generateAccessToken(clerk._id);
            const newRefreshToken = this.generateRefreshToken(
                clerk._id, 
                'rotated', 
                ipAddress
            );

            // Store new refresh token
            await Clerk.findByIdAndUpdate(clerk._id, {
                $push: { 
                    refreshTokens: newRefreshToken.tokenData 
                }
            });

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken.refreshToken,
                shouldRotate: true
            };

        } catch (error) {
            throw error;
        }
    }

    // Revoke all tokens for a clerk
    static async revokeAllTokens(clerkId) {
        await Clerk.findByIdAndUpdate(clerkId, {
            $set: { refreshTokens: [] }
        });
    }

    // Get active sessions
    static async getActiveSessions(clerkId) {
        const clerk = await Clerk.findById(clerkId).select('refreshTokens');
        if (!clerk) return [];

        return clerk.refreshTokens.map(token => ({
            device: token.device,
            ipAddress: token.ipAddress,
            lastUsed: token.lastUsed,
            expires: token.expires
        }));
    }

    // Revoke specific session
    static async revokeSession(clerkId, token) {
        await Clerk.findByIdAndUpdate(clerkId, {
            $pull: { refreshTokens: { token } }
        });
    }
}

module.exports = TokenManager;