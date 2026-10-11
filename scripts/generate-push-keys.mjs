import fs from 'node:fs';
import crypto from 'node:crypto';
import webpush from 'web-push';
const path = '.env.local';
const existing = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';
if (/^VAPID_PRIVATE_KEY=.+/m.test(existing)) {
  console.log('VAPID keys already exist; keeping them so subscriptions stay valid.');
} else {
  const keys = webpush.generateVAPIDKeys();
  const clean = existing.replace(/^VAPID_(PUBLIC|PRIVATE)_KEY=.*\n?/gm, '').replace(/^PUSH_DISPATCH_SECRET=.*\n?/gm, '');
  fs.writeFileSync(path, `${clean}\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\nPUSH_DISPATCH_SECRET=${crypto.randomBytes(32).toString('hex')}\n`, {mode:0o600});
  console.log('Push keys saved to .env.local. Set VAPID_SUBJECT and SUPABASE_SECRET_KEY locally, then restart the server.');
}
