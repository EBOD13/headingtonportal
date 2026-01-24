// backend/jobs/clerkExpiryJob.js
const cron = require('node-cron');
const Clerk = require('../models/clerkModel');
const { logActivity } = require('../utils/activityLogger');

/**
 * Deactivate clerks whose password reset invitation has expired
 * and they haven't set their password yet.
 */
async function deactivateExpiredClerks() {
  console.log(`[${new Date().toISOString()}] Running clerk expiry check...`);

  try {
    // Find clerks who:
    // 1. Have a passwordResetExpires date that has passed
    // 2. Still need to reset their password (needsPasswordReset = true OR have a passwordResetToken)
    // 3. Are currently active
    const expiredClerks = await Clerk.find({
      isActive: true,
      passwordResetExpires: { $lt: new Date() },
      $or: [
        { needsPasswordReset: true },
        { passwordResetToken: { $exists: true, $ne: null } },
      ],
    });

    if (expiredClerks.length === 0) {
      console.log(`[${new Date().toISOString()}] No expired clerk invitations found.`);
      return { deactivatedCount: 0 };
    }

    console.log(`[${new Date().toISOString()}] Found ${expiredClerks.length} expired clerk invitation(s).`);

    let deactivatedCount = 0;

    for (const clerk of expiredClerks) {
      try {
        clerk.isActive = false;
        clerk.needsPasswordReset = true;
        await clerk.save();

        // Log the automatic deactivation
        await logActivity({
          actorId: null, // System action
          action: 'clerk_auto_deactivated',
          targetType: 'clerk',
          targetId: clerk._id,
          description: `Clerk ${clerk.email} auto-deactivated due to expired invitation`,
          metadata: {
            clerkID: clerk.clerkID,
            email: clerk.email,
            expiredAt: clerk.passwordResetExpires,
          },
        });

        deactivatedCount++;
        console.log(`[${new Date().toISOString()}] Deactivated: ${clerk.email} (expired: ${clerk.passwordResetExpires})`);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Failed to deactivate clerk ${clerk.email}:`, err.message);
      }
    }

    console.log(`[${new Date().toISOString()}] Clerk expiry check complete. Deactivated: ${deactivatedCount}`);
    return { deactivatedCount };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Clerk expiry job error:`, error.message);
    throw error;
  }
}

/**
 * ClerkExpiryJob - Scheduled job to deactivate expired clerk invitations
 */
class ClerkExpiryJob {
  constructor() {
    this.job = null;
  }

  /**
   * Start the cron job
   * Default: Runs every day at 2:00 AM
   * Cron format: minute hour day-of-month month day-of-week
   */
  start(cronExpression = '0 2 * * *') {
    if (this.job) {
      console.log('ClerkExpiryJob is already running.');
      return;
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      console.error(`Invalid cron expression: ${cronExpression}`);
      return;
    }

    this.job = cron.schedule(cronExpression, async () => {
      await deactivateExpiredClerks();
    });

    console.log(`ClerkExpiryJob started. Schedule: ${cronExpression}`);
    console.log('Next run: Daily at 2:00 AM (server time)');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log('ClerkExpiryJob stopped.');
    }
  }

  /**
   * Run the job manually (useful for testing)
   */
  async runNow() {
    console.log('Running ClerkExpiryJob manually...');
    return await deactivateExpiredClerks();
  }
}

module.exports = ClerkExpiryJob;