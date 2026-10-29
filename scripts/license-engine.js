const crypto = require('crypto');

/**
 * BillBaaz Cryptographic Offline License Key System
 * "Billing Ka Baaz!"
 *
 * Uses HMAC-SHA256 signatures so license keys can be generated
 * by you (the software owner) and verified offline on the restaurant POS
 * without requiring internet connectivity.
 */

const MASTER_SIGNING_SECRET = process.env.BILLBAAZ_LICENSE_SECRET || "BILLBAAZ-MASTER-SIGNING-KEY-2026";

function generateLicenseKey(payload) {
  const jsonStr = JSON.stringify(payload);
  const dataB64 = Buffer.from(jsonStr, 'utf8').toString('base64url');
  const hmac = crypto.createHmac('sha256', MASTER_SIGNING_SECRET);
  hmac.update(dataB64);
  const sig = hmac.digest('base64url').slice(0, 16);
  // Format as readable block license key: BBZ.<PAYLOAD>.<SIG>
  return `BBZ.${dataB64}.${sig}`;
}

function verifyLicenseKey(licenseKey) {
  try {
    const parts = licenseKey.trim().split('.');
    if (parts.length !== 3 || parts[0] !== 'BBZ') {
      return { valid: false, error: 'Malformed BillBaaz license key format' };
    }
    const [_, dataB64, providedSig] = parts;
    const hmac = crypto.createHmac('sha256', MASTER_SIGNING_SECRET);
    hmac.update(dataB64);
    const expectedSig = hmac.digest('base64url').slice(0, 16);

    if (providedSig !== expectedSig) {
      return { valid: false, error: 'Invalid cryptographic signature or tampered license' };
    }

    const payload = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8'));

    if (payload.expiresAt !== 'PERPETUAL') {
      const expDate = new Date(payload.expiresAt);
      if (Date.now() > expDate.getTime()) {
        return { valid: false, payload, error: `License expired on ${payload.expiresAt}` };
      }
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: err.message || 'Failed to parse license key' };
  }
}

// CLI usage if run directly: node scripts/license-engine.js generate "Restaurant Name" "2027-12-31"
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0] || 'demo';

  if (action === 'generate') {
    const name = args[1] || 'Spice Garden Restro';
    const expires = args[2] || '2027-10-31';
    const key = generateLicenseKey({
      restaurantId: `REST-${Date.now().toString().slice(-6)}`,
      restaurantName: name,
      terminalLimit: 5,
      issuedAt: new Date().toISOString().slice(0, 10),
      expiresAt: expires,
      tier: 'LIFETIME_STANDALONE',
      features: ['SPLIT_TENDER', 'SOUNDBOX_VOICE', 'ZOMATO_SWIGGY_SYNC', 'UNLIMITED_KOT', 'OFFLINE_POS'],
    });
    console.log('\nGenerated BillBaaz Commercial License Key:');
    console.log('---------------------------------------------------------');
    console.log(key);
    console.log('---------------------------------------------------------');
  } else {
    // Generate sample perpetual demo key
    const demoKey = generateLicenseKey({
      restaurantId: 'REST-DEMO-001',
      restaurantName: 'BillBaaz Flagship Restaurant',
      terminalLimit: 10,
      issuedAt: new Date().toISOString().slice(0, 10),
      expiresAt: 'PERPETUAL',
      tier: 'LIFETIME_STANDALONE',
      features: ['SPLIT_TENDER', 'SOUNDBOX_VOICE', 'ZOMATO_SWIGGY_SYNC', 'UNLIMITED_KOT', 'OFFLINE_POS'],
    });
    console.log('\nSample Verified BillBaaz License:');
    console.log(demoKey);
    console.log('\nVerification Check:', verifyLicenseKey(demoKey));
  }
}

module.exports = { generateLicenseKey, verifyLicenseKey };
