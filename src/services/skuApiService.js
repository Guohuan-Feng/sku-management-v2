// src/services/skuApiService.js

const API_BASE_URL = 'https://vp.jfj.ai/JFJP/skus';
const AUTH_API_BASE_URL = 'https://vp.jfj.ai/JFJP/auth';
const AI_API_BASE_URL = 'https://vp.jfj.ai/JFJP';

// 从环境变量中获取自定义密钥
// 假设你的环境变量名为 VITE_CUSTOM_SECRET_KEY
// 请确保你在 .env 文件中定义了 VITE_CUSTOM_SECRET_KEY=D5AbZ2aUBJ0NSJP2Gm!Bk02
const CUSTOM_SECRET_VALUE = import.meta.env.VITE_CUSTOM_SECRET_KEY;

// 辅助函数处理 API 响应
const handleResponse = async (response) => {
  let responseData = null; // 用于存储解析后的 JSON 数据
  let rawResponseText = null; // 用于存储原始响应文本，以防 JSON 解析失败

  try {
    // 克隆响应，以便可以读取两次（一次尝试JSON，一次尝试文本）
    const clonedResponse = response.clone();

    // 对于 204 No Content，通常没有响应体，直接返回预定义成功信息
    if (response.status === 204) {
      responseData = { success: true, message: '操作成功完成，无内容返回。' };
    } else {
      try {
        // 尝试将响应解析为 JSON
        responseData = await response.json();
      } catch (jsonParseError) {
        // 如果 JSON 解析失败 (例如后端返回纯文本错误)，则读取原始文本
        rawResponseText = await clonedResponse.text();
        // 打印前端警告和原始文本到控制台
        console.warn(`[前端警告] API Response JSON Parsing Failed (Status: ${response.status}). Raw Text:`, rawResponseText);
        // 如果无法解析 JSON，但响应是成功的（例如，意外的 200 OK 但返回了非 JSON），
        // 我们可以将原始文本视为数据返回，或者根据业务需求进行更严格的错误处理。
        // 这里为了确保后续错误处理能继续，我们不直接抛出 jsonParseError，而是依赖 response.ok
      }
    }
  } catch (e) {
    // 捕获读取响应体时发生的任何其他错误（例如网络中断）
    console.error('[前端错误] API Response Handling Error during content read:', e);
    // 使用原始状态文本或通用错误消息来抛出，确保有错误信息
    const errorMsg = rawResponseText || response.statusText || '发生未知错误，响应无法读取。';
    const genericError = new Error(errorMsg);
    genericError.status = response.status;
    throw genericError;
  }

  // 无论成功与否，如果成功解析了 JSON 或获取了原始文本，都在控制台打印
  // 这会显示后端返回的原始数据结构或原始文本
  if (responseData) {
    console.log(`[前端日志] 后端原始 JSON 响应 (HTTP Status: ${response.status}):`, responseData);
  } else if (rawResponseText) {
    // 如果 JSON 未能解析，但获取到了原始文本，则打印原始文本
    console.log(`[前端日志] 后端原始非 JSON 响应 (HTTP Status: ${response.status}):`, rawResponseText);
  }

  if (!response.ok) {
    // 如果响应状态码表示失败 (response.ok 为 false)
    // 检查是否为 FastAPI 的 422 校验错误，并提取详细信息
    if (response.status === 422 && responseData && responseData.detail && Array.isArray(responseData.detail)) {
      const err = new Error('校验失败，请检查表单字段。');
      err.fieldErrors = responseData.detail; // { loc: ["body", "field_name"], msg: "..." }
      err.status = response.status;
      console.error('[前端错误] API 校验错误 (来自后端):', err.fieldErrors, '状态码:', response.status);
      throw err;
    }

    // 处理其他非 2xx 状态码的错误
    // 优先使用后端返回的 detail 字段，其次是原始文本，最后是状态文本
    const errorMessage = (responseData && responseData.detail) || (responseData && (typeof responseData === 'string' ? responseData : JSON.stringify(responseData))) || rawResponseText || response.statusText || 'API 请求失败';
    console.error('[前端错误] API 请求失败 (来自后端):', errorMessage, '状态码:', response.status, '完整响应内容:', responseData || rawResponseText);
    const genericError = new Error(errorMessage);
    genericError.status = response.status; // 也为通用错误添加状态码
    throw genericError;
  }

  // 如果响应成功 (response.ok 为 true)，返回解析后的数据
  // 如果是 204 或 JSON 解析失败但状态码是 2xx (理论上不应该，但以防万一)，这里会返回相应的值
  return responseData;
};

// 辅助函数，用于获取包含通用 header 的 fetch 选项
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (CUSTOM_SECRET_VALUE) {
    headers['X-Custom-Secret'] = CUSTOM_SECRET_VALUE; // header 名称保持为 "X-Custom-Secret"
  }
  return headers;
};


// 获取所有 SKU 的 API 调用
export const getAllSkus = async () => {
  const response = await fetch(`${API_BASE_URL}/get-all-sku`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// 创建 SKU 的 API 调用
export const createSku = async (skuData) => {
  const response = await fetch(`${API_BASE_URL}/create-sku`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(skuData),
  });
  return handleResponse(response);
};

// 更新 SKU 的 API 调用
export const updateSku = async (skuId, skuData) => {
  const response = await fetch(`${API_BASE_URL}/update/${skuId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(skuData),
  });
  return handleResponse(response);
};

// 删除 SKU 的 API 调用
export const deleteSku = async (skuId) => {
  const response = await fetch(`${API_BASE_URL}/delete/${skuId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// 上传 SKU CSV 的 API 调用
export const uploadSkuCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  // 对于 FormData，Content-Type 通常由浏览器自动设置，不需要手动设置 'application/json'
  // 因此，这里的 headers 只需要包含自定义密钥
  const headers = {};
  if (CUSTOM_SECRET_VALUE) {
      headers['X-Custom-Secret'] = CUSTOM_SECRET_VALUE; // header 名称保持为 "X-Custom-Secret"
  }

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    headers: headers, // 传递手动创建的 headers
    body: formData,
  });
  return handleResponse(response);
};

// 调用 AI 生成描述的 API
export const generateAIDescription = async (data) => {
  const response = await fetch(`${AI_API_BASE_URL}/AI-generate-desc`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// 新增: 用户注册 API 调用
export const registerUser = async (email, password) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

// 新增: 用户登录 API 调用
export const loginUser = async (email, password) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};