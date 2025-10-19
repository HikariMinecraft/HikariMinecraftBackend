import { VercelRequest } from "@vercel/node";
import { VercelResponse } from "@vercel/node";

export async function handle(req : VercelRequest, res : VercelResponse) {
  return res.status(200).json({});
}