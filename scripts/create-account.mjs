#!/usr/bin/env node
// Usage: node scripts/create-account.mjs <username> <password> [--remote|--local]
//
// Creates a new account row in the D1 database. Username is also used as the
// public booking slug (URL segment), so it must be lowercase letters, digits,
// or hyphens. Password is hashed with PBKDF2-SHA256 (200k iterations) — the
// same algorithm used by the Worker to verify logins.

import { spawnSync } from 'node:child_process';
import { webcrypto } from 'node:crypto';

// Cloudflare Workers' Web Crypto PBKDF2 caps iterations at 100k; using the
// same ceiling here so the hash can actually be verified at login.
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const USERNAME_RE = /^[a-z0-9-]{2,40}$/;
const DB_NAME = 'agenda';

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function b64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

async function hashPassword(password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await webcrypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    key, HASH_BYTES * 8,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

function parseArgs(argv) {
  const rest = [];
  let target = null;
  for (const a of argv) {
    if (a === '--remote') target = '--remote';
    else if (a === '--local') target = '--local';
    else rest.push(a);
  }
  return { username: rest[0], password: rest[1], target };
}

const { username, password, target } = parseArgs(process.argv.slice(2));

if (!username || !password) {
  die('Usage: node scripts/create-account.mjs <username> <password> [--remote|--local]');
}
if (!USERNAME_RE.test(username)) {
  die(`Invalid username "${username}" — must be 2–40 chars of [a-z0-9-].`);
}
if (password.length < 8) {
  die('Password must be at least 8 characters.');
}
if (!target) {
  die('Must specify --remote (prod D1) or --local (wrangler dev D1).');
}

const id = webcrypto.randomUUID().replace(/-/g, '');
const passwordHash = await hashPassword(password);
const createdAt = Math.floor(Date.now() / 1000);

// Values are safe to inline: id is hex, username is validated, hash is base64
// with no quote characters, createdAt is a number.
const sql = `INSERT INTO accounts (id, username, password_hash, slug, created_at) VALUES ('${id}', '${username}', '${passwordHash}', '${username}', ${createdAt});`;

const result = spawnSync(
  'npx',
  ['wrangler', 'd1', 'execute', DB_NAME, target, '--command', sql],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  die(`\nwrangler failed with exit code ${result.status}.`, result.status ?? 1);
}

console.log(`\n✓ Account "${username}" created. Booking URL: /book/${username}`);
