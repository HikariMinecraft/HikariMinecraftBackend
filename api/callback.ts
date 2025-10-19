import type { VercelRequest, VercelResponse } from '@vercel/node';
// 必須安裝：npm install tweetnacl @types/tweetnacl
import * as nacl from 'tweetnacl';

// 定義入參的結構類型
interface ValidationRequest {
    event_ts: string;
    plain_token: string;
}

// 定義頂層 Payload 的結構類型
interface Payload {
    data: ValidationRequest;
}

// --- 輔助函式：複製 Go 語言的確定性種子衍生邏輯 ---
/**
 * 複製 Go 程式碼中的邏輯：將 BOT_SECRET 重複、截斷，以生成 Ed25519 所需的 32 位元組種子 (Seed)。
 * @param secret 從環境變數中讀取的 BOT_SECRET 字串。
 * @returns 32 位元組的 Uint8Array 種子。
 */
function deriveSeed(secret: string): Uint8Array {
    let seedString = secret;
    const seedSize = 32; // Ed25519 需要 32 位元組的種子

    // 複製 Go 程式碼的 padding 邏輯：重複 secret 直到長度足夠
    while (seedString.length < seedSize) {
        seedString += secret;
    }

    // 截斷到 32 個字元（相當於 32 個位元組）
    const truncatedSeed = seedString.substring(0, seedSize);

    // 將截斷後的字串種子轉換為 Uint8Array (UTF-8 位元組)
    return new TextEncoder().encode(truncatedSeed);
}

// Vercel Serverless Function 的入口點
export default async function (request: VercelRequest, response: VercelResponse) {
    // 1. 從環境變數中讀取 BOT_SECRET。
    const botSecret = process.env.BOT_SECRET;
    if (!botSecret) {
        console.error("Error: BOT_SECRET 環境變數遺失。");
        response.status(500).json({ error: "內部伺服器錯誤：BOT_SECRET 未配置" });
        return;
    }

    // 確保是 POST 請求
    if (request.method !== 'POST') {
        response.status(405).send('不允許的方法');
        return;
    }

    const body = request.body as Payload;

    // 2. 驗證 Payload 結構 (對應 Go 的 Payload struct)
    // VercelRequest 會自動解析 JSON body，我們直接檢查結構
    if (!body || !body.data) {
        console.error("請求錯誤：Body 中缺少 'data' 欄位。", request.body);
        response.status(400).json({ error: "請求錯誤：缺少 'data' 欄位" });
        return;
    }

    // 3. 提取巢狀的驗證資料 (對應 Go 的 ValidationRequest struct)
    const validationPayload: ValidationRequest = body.data;
    const { event_ts, plain_token } = validationPayload;

    if (!event_ts || !plain_token) {
        console.error("請求錯誤：'data' 中缺少必要的欄位。", validationPayload);
        response.status(400).json({ error: "請求錯誤：缺少 event_ts 或 plain_token" });
        return;
    }

    try {
        // 4. 衍生種子和私鑰。
        const seed = deriveSeed(botSecret);
        // 從 32 位元組種子生成 Ed25519 密鑰對 (公鑰 32 bytes, 私鑰 64 bytes)
        const keyPair = nacl.sign.keyPair.fromSeed(seed);
        const privateKey = keyPair.secretKey;

        // 5. 構建要簽名的訊息 (event_ts + plain_token 串接)。
        const messageString = event_ts + plain_token;
        const messageBytes = new TextEncoder().encode(messageString);

        // 6. 簽名訊息。
        const signatureBytes = nacl.sign.detached(messageBytes, privateKey);

        // 7. 將簽名結果進行 Hex 編碼 (toString('hex') 對應 Go 的 hex.EncodeToString)。
        const signature = Buffer.from(signatureBytes).toString('hex');

        // 8. 構建並回傳 JSON 回應。
        response.status(200).json({
            plain_token: plain_token,
            signature: signature,
        });

    } catch (error) {
        console.error("簽名或處理失敗：", error);
        response.status(500).json({ error: "內部伺服器錯誤：簽名生成期間發生錯誤" });
    }
}
