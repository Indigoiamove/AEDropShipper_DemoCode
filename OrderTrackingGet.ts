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
const fetchData = async (url: string) => {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    } else if (error instanceof Error) {
      throw error.message;
    }
    throw new Error('Unknown error occurred');
  }
};

// 参数配置
const config = {
  appKey: "",
  secret: "",
  commonParams: {
    app_key: "",
    access_token: "",
    sign_method: "sha256" as const,
  },
  apiParams: {
    method: "aliexpress.ds.order.tracking.get" as const,
    ae_order_id: "1234567890",  
    language: "en_US"          
  }
};

// 构建请求
const buildRequest = () => {
  // 合并参数
  const params = {
    ...config.commonParams,
    ...config.apiParams,
    timestamp: generateTimestamp()
  };

  // 生成签名
  const signature = generateSignature(params, config.secret);

  // 构造URL
  const query = new URLSearchParams({ 
    ...params,
    sign: signature
  });
  
  return `https://api-sg.aliexpress.com/sync?${query}`;
};

// 执行流程（保持原样）
(async () => {
  try {
    const url = buildRequest();
    console.log('请求URL:', url);
    const response = await fetchData(url);
    console.log('物流跟踪信息:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('请求失败:', error instanceof Error ? error.message : error);
  }
})();
