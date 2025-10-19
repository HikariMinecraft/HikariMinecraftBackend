import { VercelRequest, VercelResponse } from "@vercel/node";

import * as ed from '@noble/ed25519'
import { Buffer } from 'buffer'

const ED25519_SEED_SIZE = 32;

const BOT_SECRET = process.env.BOT_SECRET; 

async function computeSignature(botSecret : string, eventTs : string, plainToken : string) {
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

export default async (req : VercelRequest, res : VercelResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    if (!BOT_SECRET) {
        console.error("BOT_SECRET environment variable is not set.");
        return res.status(500).json({ error: "Server configuration error." });
    }

    const validationPayload = req.body; 

    if (!validationPayload || typeof validationPayload['d']['event_ts'] !== 'string' || typeof validationPayload['d']['plain_token'] !== 'string') {
        return res.status(400).json({ error: "Invalid payload: Missing EventTs or PlainToken." });
    }

    const EventTs = validationPayload['d']['event_ts'];
    const PlainToken = validationPayload['d']['plain_token'];

    console.log(`${EventTs} - ${PlainToken} - ${BOT_SECRET}`);

    return res.status(200).json(await computeSignature(BOT_SECRET, EventTs, PlainToken));
};