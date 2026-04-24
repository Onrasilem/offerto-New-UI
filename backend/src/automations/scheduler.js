/**
 * Automation Scheduler
 * Runs background jobs for follow-ups and reminders
 */

import cron from 'node-cron';
import { processDueAutomations } from './service.js';

let cronJob = null;

/**
 * Start the automation scheduler
 * Runs every minute to check for due automations
 */
export function startScheduler() {
  if (cronJob) {
    console.log('⚠️  Scheduler already running');
    return;
  }

  // Run every minute
  cronJob = cron.schedule('* * * * *', async () => {
    try {
      console.log('⏰ Checking for due automations...');
      await processDueAutomations();
    } catch (error) {
      console.error('❌ Scheduler error:', error);
    }
  });

  console.log('✅ Automation scheduler started (runs every minute)');
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('🛑 Automation scheduler stopped');
  }
}

/**
 * Run scheduler once (for testing)
 */
export async function runOnce() {
  console.log('🧪 Running scheduler once...');
  await processDueAutomations();
}

// Legacy export for backwards compatibility
export async function runDueAutomations() {
  await processDueAutomations();
}
