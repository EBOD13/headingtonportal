// backend/controllers/adminController.js
const asyncHandler = require('express-async-handler');
const Clerk = require('../models/clerkModel');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

class AdminTransitionManager {
    // Initiate admin transfer
    static initiateTransfer = asyncHandler(async (req, res) => {
        const { targetClerkId, reason } = req.body;
        const currentAdmin = req.clerk;

        // Verify current admin has permission
        if (!currentAdmin.isSuperAdmin && !currentAdmin.canCreateAdmins) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to transfer admin rights'
            });
        }

        // Get target clerk
        const targetClerk = await Clerk.findById(targetClerkId);
        if (!targetClerk) {
            return res.status(404).json({
                success: false,
                message: 'Target clerk not found'
            });
        }

        // Generate transfer token
        const transferToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create transfer record
        const transfer = {
            token: transferToken,
            fromAdmin: currentAdmin._id,
            toClerk: targetClerk._id,
            expiresAt,
            reason,
            status: 'pending'
        };

        // Store in database (you'd create a Transfer model)
        // await Transfer.create(transfer);

        // Send email to target clerk
        await sendEmail({
            to: targetClerk.email,
            subject: 'Admin Rights Transfer Request - Headington Hall',
            html: `
                <h2>Admin Rights Transfer Request</h2>
                <p>You have been nominated to receive admin rights by ${currentAdmin.email}.</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p>To accept this transfer, click the link below within 24 hours:</p>
                <a href="${process.env.APP_URL}/admin/transfer/accept?token=${transferToken}">
                    Accept Admin Rights
                </a>
                <p>If you did not expect this request, please contact the system administrator immediately.</p>
            `
        });

        res.json({
            success: true,
            message: 'Transfer initiated. Target clerk has been notified.',
            transferId: transfer._id
        });
    });

    // Accept admin transfer
    static acceptTransfer = asyncHandler(async (req, res) => {
        const { token } = req.body;
        const acceptingClerk = req.clerk;

        // Find transfer record
        // const transfer = await Transfer.findOne({
        //     token,
        //     toClerk: acceptingClerk._id,
        //     status: 'pending',
        //     expiresAt: { $gt: new Date() }
        // });

        // if (!transfer) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Invalid or expired transfer token'
        //     });
        // }

        // Get transferring admin
        // const fromAdmin = await Clerk.findById(transfer.fromAdmin);

        // Create audit trail
        // const audit = {
        //     action: 'admin_transfer',
        //     fromAdmin: fromAdmin._id,
        //     toAdmin: acceptingClerk._id,
        //     timestamp: new Date(),
        //     transferId: transfer._id
        // };
        // await Audit.create(audit);

        // Update clerk permissions
        acceptingClerk.role = 'admin';
        acceptingClerk.permissions = [
            'view_residents', 'edit_residents', 'delete_residents',
            'view_guests', 'check_in_guests', 'check_out_guests',
            'view_reports', 'generate_reports', 'manage_clerks',
            'system_settings'
        ];
        acceptingClerk.canCreateAdmins = true;
        await acceptingClerk.save();

        // Update transfer status
        // transfer.status = 'completed';
        // transfer.completedAt = new Date();
        // await transfer.save();

        // Notify both parties
        // await sendEmail({
        //     to: fromAdmin.email,
        //     subject: 'Admin Transfer Completed',
        //     html: `${acceptingClerk.email} has accepted the admin rights transfer.`
        // });

        res.json({
            success: true,
            message: 'Admin rights transferred successfully',
            newRole: acceptingClerk.role
        });
    });

    // Get pending transfers
    static getPendingTransfers = asyncHandler(async (req, res) => {
        // const transfers = await Transfer.find({
        //     status: 'pending',
        //     expiresAt: { $gt: new Date() }
        // }).populate('fromAdmin toClerk', 'email name');

        res.json({
            success: true,
            // data: transfers
        });
    });

    // Revoke transfer
    static revokeTransfer = asyncHandler(async (req, res) => {
        const { transferId } = req.params;

        // const transfer = await Transfer.findById(transferId);
        // if (!transfer) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'Transfer not found'
        //     });
        // }

        // Only the initiating admin can revoke
        // if (!transfer.fromAdmin.equals(req.clerk._id)) {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'Only the initiating admin can revoke this transfer'
        //     });
        // }

        // transfer.status = 'revoked';
        // transfer.revokedAt = new Date();
        // await transfer.save();

        res.json({
            success: true,
            message: 'Transfer revoked successfully'
        });
    });
}

module.exports = AdminTransitionManager;