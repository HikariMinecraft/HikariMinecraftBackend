import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as ed25519 from '@noble/ed25519';

/** 补齐 secret 为 32 字节种子 */
function generateSeed(secret: string): Uint8Array {
  let seed = secret;
  while (seed.length < 32) seed += seed;
  seed = seed.slice(0, 32);
  return new TextEncoder().encode(seed);
}

interface CallbackPayload {
  d: {
    plain_token: string;
    event_ts: string;
  };
  op: number;
}

interface CallbackResponse {
  plain_token: string;
  signature: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const body = req.body as CallbackPayload;
    if (!body?.d) return res.status(400).json({ error: 'invalid payload' });

    const { plain_token, event_ts } = body.d;
    const botSecret = process.env.BOT_SECRET;
    if (!botSecret) return res.status(500).json({ error: 'bot secret not configured' });

    // 32 字节私钥
    const privateKey = generateSeed(botSecret);
    const message = new TextEncoder().encode(event_ts + plain_token);
    const signatureBytes = await ed25519.sign(message, privateKey);
    const signature = Buffer.from(signatureBytes).toString('hex');

    const response: CallbackResponse = { plain_token, signature };
    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
}
