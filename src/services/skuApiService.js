// src/services/skuApiService.js

const API_BASE_URL = 'https://vp.jfj.ai/JFJP/skus';
// const AUTH_API_BASE_URL = 'https://vp.jfj.ai/JFJP/auth'; // 注释掉：新增认证服务的根 URL
const AI_API_BASE_URL = 'https://vp.jfj.ai/JFJP';

// 辅助函数处理 API 响应
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // 如果 response.json() 失败，构建一个基础错误对象
      errorData = { detail: response.statusText || '发生未知错误' };
    }

    // 检查是否为 FastAPI 的 422 校验错误，并提取详细信息
    if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
      // 将详细的字段错误信息附加到Error对象上
      const err = new Error('校验失败，请检查表单字段。');
      err.fieldErrors = errorData.detail; // { loc: ["body", "field_name"], msg: "..." }
      err.status = response.status;
      console.error('API Validation Error:', err.fieldErrors, 'Status:', response.status);
      throw err;
    }

    const errorMessage = errorData.detail || (typeof errorData === 'string' ? errorData : 'API 请求失败');
    console.error('API Error:', errorMessage, 'Status:', response.status, 'Response:', errorData);
    const genericError = new Error(errorMessage);
    genericError.status = response.status; // 也为通用错误添加状态码
    throw genericError;
  }
  // 如果响应体为空 (例如 204 No Content), 返回一个成功的指示
  if (response.status === 204) {
      return { success: true, message: '操作成功完成，无内容返回。' };
  }
  return response.json();
};

// 获取所有 SKU 的 API 调用
export const getAllSkus = async () => {
  const response = await fetch(`${API_BASE_URL}/get-all-sku`);
  return handleResponse(response);
};

// 创建 SKU 的 API 调用
export const createSku = async (skuData) => {
  const response = await fetch(`${API_BASE_URL}/create-sku`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skuData),
  });
  return handleResponse(response);
};

// 更新 SKU 的 API 调用
export const updateSku = async (skuId, skuData) => {
  const response = await fetch(`${API_BASE_URL}/update/${skuId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skuData),
  });
  return handleResponse(response);
};

// 删除 SKU 的 API 调用
export const deleteSku = async (skuId) => {
  const response = await fetch(`${API_BASE_URL}/delete/${skuId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

// 上传 SKU CSV 的 API 调用
export const uploadSkuCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
};

// 调用 AI 生成描述的 API
export const generateAIDescription = async (data) => {
  const response = await fetch(`${AI_API_BASE_URL}/AI-generate-desc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// // 注释掉：新增: 用户注册 API 调用
// export const registerUser = async (email, password) => {
//   const response = await fetch(`${AUTH_API_BASE_URL}/register`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ email, password }),
//   });
//   return handleResponse(response);
// };

// // 注释掉：新增: 用户登录 API 调用
// export const loginUser = async (email, password) => {
//   const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ email, password }),
//   });
//   return handleResponse(response);
// };