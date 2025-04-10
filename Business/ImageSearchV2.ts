import * as crypto from 'crypto';
import axios, { AxiosError } from 'axios';

// 时间戳生成
const generateTimestamp = () => Date.now().toString();

// 签名算法
const generateSignature = (params: Record<string, string>, secret: string) => {
  const sorted = Object.keys(params).sort();
  const str = sorted.map(k => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', secret)
    .update(str)
    .digest('hex')
    .toUpperCase();
};

// 请求执行函数
const fetchData = async (url: string, data: URLSearchParams) => {
  try {
    const { data: responseData } = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return responseData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    } else if (error instanceof Error) {
      throw error.message;
    }
    throw new Error('未知错误');
  }
};

// 配置参数
const config = {
  appKey: "",
  secret: "",
  commonParams: {
    app_key: "",
    access_token: "",
    sign_method: "sha256" as const,
  },
  imageSearchParams: {
    method: "aliexpress.ds.image.searchV2" as const,
    param0: {
      search_type: "",
      image_base64: "",
      currency: "USD",
      lang: "en",
      sort_type: "",
      sort_order: "",
      ship_to: "US"
    }
  }
};

// 参数预处理
const preprocessParams = (params: typeof config.imageSearchParams) => {
  return {
    method: params.method,
    param0: JSON.stringify(params.param0),
    timestamp: generateTimestamp()
  };
};

// 请求构建
const buildRequest = () => {
  const baseParams = {
    ...config.commonParams,
    ...preprocessParams(config.imageSearchParams)
  };

  const signature = generateSignature(baseParams, config.secret);

  const data = new URLSearchParams({
    ...baseParams,
    sign: signature
  });
  
  return {
    url: 'https://api-sg.aliexpress.com/sync',
    data: data
  };
};

// 执行流程
(async () => {
  try {
    const { url, data } = buildRequest();
    console.log('请求地址:', url);
    
    const response = await fetchData(url, data);
    console.log('图片搜索结果:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('[错误]', error instanceof Error ? error.message : error);
  }
})();
