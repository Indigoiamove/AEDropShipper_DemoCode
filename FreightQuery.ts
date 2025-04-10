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
  freightParams: {
    method: "aliexpress.ds.freight.query" as const,
    queryDeliveryReq: {
      productId: 1005008605533433,
      selectedSkuId: "12000045920804712",
      quantity: 1,
      shipToCountry: "US",
      provinceCode: "",
      cityCode: "",
      source: "",
      currency: "USD",
      language: "en_US",
      locale: ""
    }
  }
};

// 参数预处理
const preprocessParams = (params: typeof config.freightParams) => {
  return {
    method: params.method,
    queryDeliveryReq: JSON.stringify(params.queryDeliveryReq),
    timestamp: generateTimestamp()
  };
};

// 请求构建
const buildRequest = () => {
  const baseParams = {
    ...config.commonParams,
    ...preprocessParams(config.freightParams)
  };

  const signature = generateSignature(baseParams, config.secret);

  const query = new URLSearchParams({
    ...baseParams,
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
    console.log('运费查询结果:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('[错误]', error instanceof Error ? error.message : error);
  }
})();
