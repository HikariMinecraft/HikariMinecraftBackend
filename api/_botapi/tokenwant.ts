import { createRequest } from "../_chore/proxyrequesthelper.js";
import { getRedisClient } from "../_chore/redis.js";

export async function getAccessToken() {
    const redis = getRedisClient();

    const timeout_time : number = Number(await redis.get("_token_timeout_time"));
    if (timeout_time < Date.now()){
        return await redis.get("_access_token");
    }else{
        const reply = await createRequest('https://bots.qq.com/app/getAppAccessToken','POST',{'Content-Type':'application/json'},
            {
                appId: process.env.BOT_ID,
                clientSecret: process.env.BOT_SECRET
            }
        )
        console.log(reply)
        if(reply.status === 'succcess'){
            if(reply.data.status === 200){
                await redis.set("_access_token",reply.data.data['access_token'])
                await redis.set("_token_timeout_time", (Date.now() + (reply.data.data['expires_in'] ) * 1000).toString())
                return reply.data.data['access_token']
            }
        }
    }
    return '';
}