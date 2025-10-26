import { aesEncrypt } from "./aes.cjs"

export async function createRequest(url: string, method: string, headers: Record<string, string> = {}, body: any = null){
    const requestData = {
        method: method,
        headers: headers,
        data: body,
        target: url
    }

    const encData = aesEncrypt(JSON.stringify(requestData),process.env.HP_SECRET,process.env.HP_IV)

    const reply = await fetch(`${process.env.HP_URL}`,{
        method: 'POST',
        body: JSON.stringify({
            data:encData
        })
    })

    const replyData = await reply.json()

    return replyData
}