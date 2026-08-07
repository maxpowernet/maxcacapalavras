#!/usr/bin/env node
// Usage: node scripts/generateResetLink.js /path/to/serviceAccount.json user@example.com

const path = require('path');
const fs = require('fs');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/generateResetLink.js /path/to/serviceAccount.json user@example.com');
    process.exit(1);
  }

  const servicePath = path.resolve(args[0]);
  const email = args[1];

  if (!fs.existsSync(servicePath)) {
    console.error('Service account file not found:', servicePath);
    process.exit(1);
  }

  const admin = require('firebase-admin');

  try {
    const serviceAccount = require(servicePath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

    const link = await admin.auth().generatePasswordResetLink(email);
    console.log('Password reset link for', email, ':');
    console.log(link);
  } catch (err) {
    console.error('Error generating reset link:', err.message || err);
    process.exit(1);
  }
}

main();
