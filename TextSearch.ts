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
  textSearchParams: {
    method: "aliexpress.ds.text.search" as const,
    keyWord: "Gaming computer motherboard",
    local: "en_US",
    countryCode: "US",
    categoryId: "",
    sortBy: "",
    pageSize: 20,
    pageIndex: 1,
    currency: "USD",
    searchExtend: "",
    selectionName: ""
  }
};

// 参数预处理（数字转字符串）
const preprocessParams = (params: typeof config.textSearchParams) => {
  return {
    method: params.method,
    keyWord: params.keyWord,
    local: params.local,
    countryCode: params.countryCode,
    categoryId: params.categoryId.toString(),
    sortBy: params.sortBy,
    pageSize: params.pageSize.toString(),
    pageIndex: params.pageIndex.toString(),
    currency: params.currency,
    searchExtend: params.searchExtend,
    selectionName: params.selectionName,
    timestamp: generateTimestamp()
  };
};

// 请求构建
const buildRequest = () => {
  const baseParams = {
    ...config.commonParams,
    ...preprocessParams(config.textSearchParams)
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
    console.log('文本搜索结果:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('[错误]', error instanceof Error ? error.message : error);
  }
})();
