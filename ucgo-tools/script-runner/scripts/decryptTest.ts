import Blowfish from 'blowfish-node';

import crypto from 'crypto';

const key = 'chrTCPPassword';
const bf = new Blowfish(key, Blowfish.MODE.ECB, Blowfish.PADDING.NULL);

// Known ciphertext blocks from captures
// testuser + ZZZZZZZZ -> repeating block
const ct_ZZZZZZZZ = Buffer.from([0x4F, 0x1F, 0xBE, 0x62, 0x9A, 0x9D, 0x91, 0xC0]);
// testuser + a (and aa - same ciphertext)
const ct_a = Buffer.from([0xF1, 0x72, 0x3D, 0x76, 0xFD, 0xC3, 0x3C, 0x4A]);
// testuser + password first block
const ct_password_b1 = Buffer.from([0x13, 0x77, 0x98, 0xC4, 0x1D, 0x8E, 0xD6, 0xE0]);

const candidates = [
  // raw password padded
  Buffer.from('ZZZZZZZZ', 'ascii'),
  // md5 of password
  crypto.createHash('md5').update('ZZZZZZZZ').digest(),
  // md5 of username
  crypto.createHash('md5').update('testuser').digest(),
  // md5 of username+password
  crypto.createHash('md5').update('testusrZZZZZZZZ').digest(),
  // md5 of password+username  
  crypto.createHash('md5').update('ZZZZZZZZtestuser').digest(),
  // sha1
  crypto.createHash('sha1').update('ZZZZZZZZ').digest(),
];

// Encrypt each candidate and compare to known ciphertext
for (const candidate of candidates) {
  // try first 8 bytes as a block
  const block = candidate.slice(0, 8);
  const encrypted = bf.encode(block);
  const match = Buffer.from(encrypted).toString('hex') === ct_ZZZZZZZZ.toString('hex');
  console.log(
    candidate.toString('hex').slice(0, 16),
    '->',
    Buffer.from(encrypted).toString('hex'),
    match ? '✓ MATCH' : ''
  );
}

// Decrypt the full newaccount payload
// from packet: 10 A9 90 9D 72 FD 8A 71 D4 8A 44 5E F6 E2 A9 A4 CA 5F DB
const newaccount_payload = Buffer.from([
  0x10, 0xA9, 0x90, 0x9D, 0x72, 0xFD, 0x8A, 0x71,
  0xD4, 0x8A, 0x44, 0x5E, 0xF6, 0xE2, 0xA9, 0xA4,
  0xCA, 0x5F, 0xDB
]);

// pad to 8-byte boundary
const padded = Buffer.alloc(Math.ceil(newaccount_payload.length / 8) * 8);
newaccount_payload.copy(padded);

const decrypted = bf.decode(padded, Blowfish.TYPE.UINT8_ARRAY);
console.log('newaccount decrypted:', Buffer.from(decrypted).toString('hex'));
console.log('contains token?', Buffer.from(decrypted).toString('hex').includes('0145d7c2'));