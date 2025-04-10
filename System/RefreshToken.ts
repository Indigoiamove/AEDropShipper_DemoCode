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

// Refresh Token请求URL生成
function generateRefreshTokenRequest(
    appKey: string,
    refreshToken: string,
    sign_method: 'sha256',
    appSecret: string
): string {
    const apiPath = '/auth/token/refresh';
    const timestamp = generateCurrentTimestamp();

    const params = {
        app_key: appKey,
        timestamp,
        sign_method,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    };

    const signature = generateSignature(apiPath, params, appSecret);
    const queryParams = new URLSearchParams({
        ...params,
        sign: signature,
    });

    return `https://api-sg.aliexpress.com/rest${apiPath}?${queryParams}`;
}

async function fetchRefreshResponse(
    appKey: string,
    refreshToken: string,
    sign_method: 'sha256',
    appSecret: string
): Promise<any> {
    const url = generateRefreshTokenRequest(appKey, refreshToken, sign_method, appSecret);
    try {
        const response = await axios.post(url);
        return response.data;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown error occurred';
        throw new Error(`刷新令牌请求失败: ${errorMessage}`);
    }
}

// 示例用法
const appKey = '';
const refresh_token = ''; // 替换实际refresh_token
const sign_method = 'sha256';
const appSecret = '';

// 生成刷新令牌请求URL
const refreshRequestUrl = generateRefreshTokenRequest(appKey, refresh_token, sign_method, appSecret);
console.log('刷新令牌请求URL:', refreshRequestUrl);

// 发送刷新令牌请求
fetchRefreshResponse(appKey, refresh_token, sign_method, appSecret)
    .then((responseData) => {
        console.log('刷新令牌响应:', responseData);
        // 通常响应会包含新的access_token和refresh_token
        const newRefreshToken = responseData.refresh_token;
        console.log('新的Refresh Token:', newRefreshToken);
    })
    .catch((error) => {
        console.error('刷新令牌错误:', error.message);
    });
