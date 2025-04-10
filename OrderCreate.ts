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
const fetchData = async (url: string, params: Record<string, string>) => {
  try {
    const { data } = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
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

// 完整参数配置
const config = {
  appKey: "",
  secret: "",
  commonParams: {
    app_key: "",
    access_token: "",
    sign_method: "sha256" as const,
  },
  orderCreateParams: {
    method: "aliexpress.ds.order.create" as const,
    ds_extend_request: {
      payment: {
        pay_currency: "USD",
        try_to_pay:""

      },
      promotion: {
        promotion_code: "",
        promotion_channel_info:""
      },
      trade_extra_param:{
        business_model:""
      }
    },
    param_place_order_request4_open_api_d_t_o: {
      out_order_id: "",
      logistics_address: {
        address: "WWEPerformance Center,",
        address2: "STE 100",
        birthday: "",
        city: "Orlando",
        contact_person: "person name",
        country: "US",
        cpf: "",
        fax_area: "",
        fax_country: "",
        fax_number: "",
        full_name: "full_name",
        locale: "local",
        mobile_no: "11231231231",
        passport_no: "",
        passport_no_date: "",
        passport_organization: "",
        phone_area: "",
        phone_country: "+",
        phone_number: "11231231231",
        province: "Florida",
        tax_number: "",
        zip: "32807",
        rut_no: "",
        foreigner_passport_no: "",
        is_foreigner: false,
        vat_no: "",
        tax_company: "",
        location_tree_address_id: ""
      },
      product_items: [
        {
          product_id: 1005002704149141,
          product_count: 1,
          sku_attr: "14:175;5:200003528#Length -26cm",
          logistics_service_name: "CAINIAO_FULFILLMENT_STD"
        }
      ]
    }
  }
};

// 参数预处理
const preprocessParams = (params: typeof config.orderCreateParams) => {
  // 转换数值类型并序列化
  const processedOrderRequest = {
    ...params.param_place_order_request4_open_api_d_t_o,
    logistics_address: {
      ...params.param_place_order_request4_open_api_d_t_o.logistics_address,
      is_foreigner: params.param_place_order_request4_open_api_d_t_o.logistics_address.is_foreigner.toString()
    },
    product_items: params.param_place_order_request4_open_api_d_t_o.product_items.map(item => ({
      ...item,
      product_id: item.product_id.toString(),
      product_count: item.product_count.toString()
    }))
  };

  return {
    method: params.method,
    ds_extend_request: JSON.stringify(params.ds_extend_request),
    param_place_order_request4_open_api_d_t_o: JSON.stringify(processedOrderRequest),
    timestamp: generateTimestamp()
  };
};

// 请求构建
const buildRequest = () => {
  const baseParams = {
    ...config.commonParams,
    ...preprocessParams(config.orderCreateParams)
  };

  // 生成签名
  const signature = generateSignature(baseParams, config.secret);

  return {
    url: "https://api-sg.aliexpress.com/sync",
    params: {
      ...baseParams,
      sign: signature
    }
  };
};

// 执行流程
(async () => {
  try {
    const { url, params } = buildRequest();
    
    console.log('完整请求参数:');
    console.dir(params, { depth: null, colors: true });
    
    const response = await fetchData(url, params);
    
    console.log('\n完整响应结果:');
    console.log(JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('\n错误详情:');
    if (error instanceof Error) {
      console.error('错误信息:', error.message);
      if (axios.isAxiosError(error)) {
        console.error('响应状态:', error.response?.status);
        console.error('响应数据:', error.response?.data);
      }
    } else {
      console.error('未知错误类型:', error);
    }
  }
})();
