import { VercelRequest, VercelResponse } from "@vercel/node";
import { handle as handle13 } from './opcodes/validation_13.js'

export default async (req : VercelRequest, res : VercelResponse) => {

  const payload = req.body;

  console.log("Callback received:", payload);

  switch (payload.op) {
    case 13:
      return handle13(req, res);
    default:
      return res.status(400).json({ error: "Unsupported opcode." });
  }
};