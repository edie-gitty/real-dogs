/**
 * Real Dogs — Diagnostic Test
 * Tests end-to-end story submission flow
 */

const WORKER_URL = 'https://real-dogs-worker.edithc.workers.dev';
const ADMIN_PASSWORD = 'RealDogs1';

async function test() {
  console.log('🔍 Starting diagnostic test...\n');

  // Test 1: Check worker health
  console.log('Test 1: Worker health check');
  try {
    const res = await fetch(`${WORKER_URL}/`);
    if (res.ok) {
      const text = await res.text();
      console.log(`✅ Worker is running: "${text}"\n`);
    } else {
      console.log(`❌ Worker returned status ${res.status}\n`);
      return;
    }
  } catch (e) {
    console.log(`❌ Failed to reach worker: ${e.message}\n`);
    return;
  }

  // Test 2: Submit a test story
  console.log('Test 2: Submitting test story');
  const testPayload = {
    dogName: 'Lexie',
    story: 'This is a test story about Lexie submitted on ' + new Date().toISOString(),
    storyStyle: 'adventure_log',
    email: 'test@example.com',
    phone: '0412345678',
    instagram: 'testdog',
    photos: [],
    personality: ['playful', 'loyal'],
    activities: ['fetch', 'swimming'],
    treats: ['chicken']
  };

  let submittedSlug = null;
  try {
    const res = await fetch(`${WORKER_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    const data = await res.json();
    if (!res.ok) {
      console.log(`❌ Submit failed with status ${res.status}: ${data.error || JSON.stringify(data)}\n`);
      return;
    }

    submittedSlug = data.slug || data.id;
    console.log(`✅ Story submitted successfully`);
    console.log(`   Slug: ${submittedSlug}\n`);
  } catch (e) {
    console.log(`❌ Submit request failed: ${e.message}\n`);
    return;
  }

  // Test 3: Retrieve all stories from admin (requires auth)
  console.log('Test 3: Fetching all stories from admin interface');
  try {
    const res = await fetch(`${WORKER_URL}/admin/stories`, {
      headers: { Authorization: `Bearer ${ADMIN_PASSWORD}` }
    });

    if (res.status === 401) {
      console.log(`❌ Authentication failed. Admin password may be incorrect.\n`);
      return;
    }

    if (!res.ok) {
      console.log(`❌ Request failed with status ${res.status}\n`);
      return;
    }

    const data = await res.json();
    const stories = data.stories || [];
    console.log(`✅ Retrieved ${stories.length} total stories from admin interface`);

    // Check if our test story is there
    if (submittedSlug) {
      const found = stories.find(s => s.slug === submittedSlug);
      if (found) {
        console.log(`✅ Test story IS visible in admin interface`);
        console.log(`   Status: ${found.status}`);
        console.log(`   Dog name: ${found.dogName}\n`);
      } else {
        console.log(`❌ Test story NOT found in admin interface!`);
        console.log(`   Expected slug: ${submittedSlug}\n`);
      }
    }

    // Test 4: Look for Lexie stories specifically
    console.log('Test 4: Searching for Lexie stories');
    const lexieStories = stories.filter(s => s.dogName.toLowerCase().includes('lexie'));
    if (lexieStories.length > 0) {
      console.log(`✅ Found ${lexieStories.length} Lexie story(ies):`);
      lexieStories.forEach(s => {
        console.log(`   - ${s.slug}: status="${s.status}", created="${s.createdAt}"`);
      });
      console.log();
    } else {
      console.log(`⚠️  No Lexie stories found in admin interface\n`);
    }

    // Test 5: Check breakdown by status
    console.log('Test 5: Breakdown by status');
    const byStatus = { pending: 0, approved: 0, rejected: 0 };
    stories.forEach(s => {
      if (s.status in byStatus) byStatus[s.status]++;
    });
    console.log(`   Pending: ${byStatus.pending}`);
    console.log(`   Approved: ${byStatus.approved}`);
    console.log(`   Rejected: ${byStatus.rejected}`);
    console.log();

  } catch (e) {
    console.log(`❌ Admin fetch failed: ${e.message}\n`);
  }

  console.log('🏁 Diagnostic complete');
}

test();
