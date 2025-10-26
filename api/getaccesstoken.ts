import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAccessToken } from './_botapi/tokenwant.js'

export default async (req: VercelRequest, res: VercelResponse) => {
    const token : string = await getAccessToken()
    res.status(200).json({ message: token.length === 0 ? 'error' : token.substring(0,token.length/2) })
}