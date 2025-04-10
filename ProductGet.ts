import * as crypto from 'crypto';
import axios, { AxiosError } from 'axios';

// 时间戳生成
const generateTimestamp = () => Date.now().toString();

// 签名生成
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
  productParams: {
    ship_to_country: "US" as const,
    product_id: 1005004148162870,
    target_currency: "USD" as const,
    remove_personal_benefit: true,
    target_language: "en" as const,
    method: "aliexpress.ds.product.get" as const
  }
};

// 构建请求
const buildRequest = () => {
  // 合并并转换参数
  const params = {
    ...config.commonParams,
    ...{
      ...config.productParams,
      product_id: config.productParams.product_id.toString(),
      remove_personal_benefit: config.productParams.remove_personal_benefit.toString()
    },
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

// 执行流程
(async () => {
  try {
    const url = buildRequest();
    console.log('请求URL:', url);
    const response = await fetchData(url);
    console.log('服务器返回数据:',JSON.stringify( response));
  } catch (error) {
    console.error('请求失败:', error instanceof Error ? error.message : error);
  }
})();
