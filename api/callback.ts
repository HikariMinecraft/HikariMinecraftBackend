import { VercelRequest, VercelResponse } from "@vercel/node";

const ed = require('@noble/ed25519');
const { Buffer } = require('buffer');

const ED25519_SEED_SIZE = 32;

const BOT_SECRET = process.env.BOT_SECRET; 

module.exports = async (req : VercelRequest, res : VercelResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    if (!BOT_SECRET) {
        console.error("BOT_SECRET environment variable is not set.");
        return res.status(500).json({ error: "Server configuration error." });
    }

    const validationPayload = req.body; 

    if (!validationPayload || typeof validationPayload.EventTs !== 'string' || typeof validationPayload.PlainToken !== 'string') {
        return res.status(400).json({ error: "Invalid payload: Missing EventTs or PlainToken." });
    }

    const { EventTs, PlainToken } = validationPayload;

    try {
        let seedStr = BOT_SECRET;
        while (seedStr.length < ED25519_SEED_SIZE) {
            seedStr = seedStr.repeat(2);
        }
        seedStr = seedStr.substring(0, ED25519_SEED_SIZE);
        
        const seedUint8Array = Buffer.from(seedStr, 'utf8');

        const privateKeyUint8Array = ed.getPrivateKeySync(seedUint8Array);

        const messageToSign = EventTs + PlainToken;
        const messageBuffer = Buffer.from(messageToSign, 'utf8');

        const signatureUint8Array = await ed.sign(messageBuffer, privateKeyUint8Array);
        
        const signature = Buffer.from(signatureUint8Array).toString('hex'); 

        const responsePayload = {
            PlainToken: PlainToken,
            Signature: signature,
        };
        
        return res.status(200).json(responsePayload);

    } catch (e) {
        console.error("Ed25519 processing failed:", e);
        return res.status(500).json({ error: "Internal signature error." });
    }
};