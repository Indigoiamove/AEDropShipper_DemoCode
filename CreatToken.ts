import crypto from 'crypto';
import axios from 'axios';

// 时间戳生成逻辑
function generateCurrentTimestamp(): string {
    const now = new Date();
    return now.getTime().toString();
}

// 签名生成算法
function generateSignature(
    apiPath: string,
    params: Record<string, any>,
    appSecret: string
): string {
    const sortedKeys = Object.keys(params).sort();
    const concatenatedString = sortedKeys
        .map((key) => `${key}${params[key]}`)
        .join('');

    const stringToSign = apiPath + concatenatedString;
    const bytes = crypto
        .createHmac('sha256', appSecret)
        .update(stringToSign, 'utf8')
        .digest();

    return bytes.toString('hex').toUpperCase();
}


function generateAuthTokenRequest(
    appKey: string,
    code: string,
    sign_method: 'sha256',
    appSecret: string
): string {
    const apiPath = '/auth/token/create';
    const timestamp = generateCurrentTimestamp();

    const params = {
        app_key: appKey,
        timestamp,
        sign_method,  
        code,
    };

    const signature = generateSignature(apiPath, params, appSecret);
    const queryParams = new URLSearchParams({
        ...params,
        sign: signature,
    });

    return `https://api-sg.aliexpress.com/rest${apiPath}?${queryParams}`;
}


async function fetchAuthResponse(
    appKey: string,
    code: string,
    sign_method: 'sha256',
    appSecret: string
): Promise<any> {
    const url = generateAuthTokenRequest(appKey, code, sign_method, appSecret);
    try {
        const response = await axios.post(url);
        return response.data;
    } catch (error: unknown) {  
    
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown error occurred';
        throw new Error(`API请求失败: ${errorMessage}`);
    }
}


const appKey = '';
const code = '';
const signMethod = 'sha256';
const appSecret = '';
//授权URL拼贴方式:  https://api-sg.aliexpress.com/oauth/authorize?response_type=code&force_auth=true&client_id=Your-APPKEY
const requestUrl = generateAuthTokenRequest(appKey, code, signMethod, appSecret);
console.log('生成的请求URL:', requestUrl);

fetchAuthResponse(appKey, code, signMethod, appSecret)
    .then((responseData) => {
        console.log('API返回的请求体:',JSON.stringify (responseData));
    })
    .catch((error) => {
        console.error('错误:', error.message);  // 保持原有错误输出
    });
