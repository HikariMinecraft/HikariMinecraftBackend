import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async (req: VercelRequest, res: VercelResponse) => {
  const re = await axios.get('https://api.ipify.org?format=json')
  return res.status(re.status).json({
    result:re.statusText,
    data:re.data
  })
}