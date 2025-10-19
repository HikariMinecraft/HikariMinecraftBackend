import { VercelRequest, VercelResponse } from "@vercel/node";

import * as ed from '@noble/ed25519'
import { Buffer } from 'buffer'

const ED25519_SEED_SIZE = 32;

const BOT_SECRET = process.env.BOT_SECRET; 

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

    try {
        let seedStr = BOT_SECRET;
        while (seedStr.length < ED25519_SEED_SIZE) {
            seedStr = seedStr.repeat(2);
        }
        seedStr = seedStr.substring(0, ED25519_SEED_SIZE);
        
    // Create a 32-byte seed and use it as the private key for noble-ed25519.
    // Note: we ensure seedStr was trimmed/padded to 32 characters above. Using
    // utf8 here is safe if the BOT_SECRET is ASCII; if you expect arbitrary
    // bytes consider storing the secret as hex/base64 and decoding instead.
    const seedUint8Array = Buffer.from(seedStr, 'utf8');

    // noble-ed25519 accepts a 32-byte private key (Uint8Array). Use the seed
    // directly as the private key. If you need a derived keypair or different
    // handling, replace this with a proper KDF.
    const privateKeyUint8Array = seedUint8Array;

        const messageToSign = EventTs + PlainToken;
        const messageBuffer = Buffer.from(messageToSign, 'utf8');

        const signatureUint8Array = await ed.signAsync(messageBuffer, privateKeyUint8Array);
        
        const signature = Buffer.from(signatureUint8Array).toString('hex'); 

        const responsePayload = {
            plain_token: PlainToken,
            signature: signature,
        };
        
        return res.status(200).json(responsePayload);

    } catch (e) {
        console.error("Ed25519 processing failed:", e);
        return res.status(500).json({ error: "Internal signature error." });
    }
};