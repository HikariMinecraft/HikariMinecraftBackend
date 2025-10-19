import * as ed from '@noble/ed25519';
import { Buffer } from 'buffer';

async function computeSignature(botSecret, eventTs, plainToken) {
  const ED25519_SEED_SIZE = 32;
  let seedStr = botSecret;
  while (seedStr.length < ED25519_SEED_SIZE) {
    seedStr = seedStr.repeat(2);
  }
  seedStr = seedStr.substring(0, ED25519_SEED_SIZE);

  const seedUint8Array = Buffer.from(seedStr, 'utf8');
  const { secretKey } = await ed.keygenAsync(seedUint8Array);

  const messageToSign = eventTs + plainToken;
  const messageBuffer = Buffer.from(messageToSign, 'utf8');
  const signatureUint8Array = await ed.signAsync(messageBuffer, secretKey);
  const signature = Buffer.from(signatureUint8Array).toString('hex');

  return {
    plain_token: plainToken,
    signature,
  };
}

// Example values provided by you
const BOT_SECRET = 'DG5g3B4j9X2KOErG';
const EventTs = '1725442341';
const PlainToken = 'Arq0D5A61EgUu4OxUvOp';

(async () => {
  try {
    const out = await computeSignature(BOT_SECRET, EventTs, PlainToken);
    console.log(JSON.stringify(out));
  } catch (e) {
    console.error('error', e);
  }
})();
