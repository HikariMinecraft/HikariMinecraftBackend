import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const re = await axios.get('https://api.ipify.org?format=json')
  return res.status(re.status).json({
    result:re.statusText,
    data:re.data
  })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch IP information.', data: error });
  }
}