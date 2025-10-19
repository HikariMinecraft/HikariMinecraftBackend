import { VercelRequest, VercelResponse } from "@vercel/node";
import { handle as handle13 } from './_opcodes/validation_13.js'
import { handle as handle0 } from "./_opcodes/callback_0.js";

export default async (req : VercelRequest, res : VercelResponse) => {

  const payload = req.body;

  console.log("Callback received:", payload);

  switch (payload.op) {
    case 13:
      return handle13(req, res);
    case 0:
      return handle0(req, res);
    default:
      return res.status(400).json({ error: "Unsupported opcode." });
  }
};