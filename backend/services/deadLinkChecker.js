/**
 * Dead Link Checker Service
 * Checks for broken image URLs and marks submissions as inactive
 * Run this as a scheduled job (e.g., daily via cron)
 */

const supabase = require('../config/supabase');

async function checkDeadLinks() {
  console.log('Starting dead link check...');

  try {
    // Get all approved submissions
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('id, image_url')
      .eq('status', 'approved');

    if (error) {
      console.error('Failed to fetch submissions:', error);
      return;
    }

    console.log(`Checking ${submissions.length} submissions...`);

    let deadCount = 0;

    for (const sub of submissions) {
      const isAlive = await checkUrl(sub.image_url);

      if (!isAlive) {
        deadCount++;
        console.log(`Dead link found: ${sub.id} - ${sub.image_url}`);

        // Mark as rejected with reason
        await supabase
          .from('submissions')
          .update({
            status: 'rejected',
            rejection_reason: 'Image URL no longer accessible'
          })
          .eq('id', sub.id);
      }
    }

    console.log(`Dead link check complete. Found ${deadCount} dead links.`);
  } catch (err) {
    console.error('Dead link checker error:', err);
  }
}

async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 10000
    });

    return response.ok;
  } catch (err) {
    return false;
  }
}

module.exports = { checkDeadLinks, checkUrl };
