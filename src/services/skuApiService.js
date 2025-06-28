// src/services/skuApiService.js

const API_BASE_URL = 'https://vp.jfj.ai/JFJP/skus';
const AUTH_API_BASE_URL = 'https://vp.jfj.ai/JFJP/auth';
const AI_API_BASE_URL = 'https://vp.jfj.ai/JFJP';
const CUSTOM_SECRET_KEY = import.meta.env.VITE_CUSTOM_SECRET_KEY;

// 辅助函数：获取当前 access token, refresh token 和过期时间
const getAuthTokens = () => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token'); // 获取 refresh token
  const expiryTime = localStorage.getItem('token_expiry_time');
  return { accessToken, refreshToken, expiryTime: expiryTime ? parseInt(expiryTime, 10) : null };
};

// 辅助函数：设置 access token, refresh token 和过期时间
const setAuthTokens = (accessToken, refreshToken, expiresIn) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken); // 设置 refresh token
  if (expiresIn) {
    const expiryTime = Date.now() + expiresIn * 1000; // expiresIn 是秒，转换为毫秒时间戳
    localStorage.setItem('token_expiry_time', expiryTime.toString());
  } else {
    localStorage.removeItem('token_expiry_time');
  }

    // 在前端控制台打印认证信息
    console.log("认证信息已更新:");
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
    console.log("Token Type:", "bearer"); // token_type 通常是固定的 'bearer'
    console.log("Expires In (seconds):", expiresIn);
};

// 辅助函数：清除所有认证令牌
const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token'); // 清除 refresh token
  localStorage.removeItem('token_expiry_time');
};

// 全局变量，用于防止同时发起多个刷新请求
let isRefreshing = false;
let failedQueue = []; // 存储因令牌过期而失败的请求

// 处理队列中的请求
const processQueue = (error, accessToken = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(accessToken);
    }
  });
  failedQueue = [];
};

// 令牌刷新函数
const refreshToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const { refreshToken: currentRefreshToken } = getAuthTokens(); // 获取 refresh token
    if (!currentRefreshToken) {
      clearAuthTokens();
      throw new Error('No refresh token available. Please log in.');
    }

    const response = await fetch(`${AUTH_API_BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Secret': CUSTOM_SECRET_KEY,
        // The refresh token is sent in the body, not Authorization header typically
      },
      body: JSON.stringify({ refresh_token: currentRefreshToken }), // 在请求体中发送 refresh_token
    });

    if (!response.ok) {
      clearAuthTokens(); // 如果刷新失败，清除所有令牌
      throw new Error(`Refresh token failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.access_token) {
      // 假设刷新接口返回新的 access_token 和可能更新的 refresh_token 以及 expires_in
      setAuthTokens(data.access_token, data.refresh_token || currentRefreshToken, data.expires_in);
      processQueue(null, data.access_token); // 成功后处理队列
      return data.access_token;
    } else {
      clearAuthTokens();
      throw new Error('Refresh token response missing access_token');
    }
  } catch (error) {
    clearAuthTokens();
    processQueue(error); // 失败后处理队列
    throw error;
  } finally {
    isRefreshing = false;
  }
};

// 响应处理函数（保持不变，由 request 调用）
const handleResponse = async (response) => {
  if (response.headers.get('content-type')?.includes('application/json')) {
    const data = await response.json();

    if (!response.ok) {
      // 在这里打印完整的后端错误响应，以便调试
      console.error("Backend Error Response Data:", data);

      let errorMessage = response.statusText; // 默认使用状态文本

      if (data && typeof data === 'object') {
        if (data.detail) {
          // FastAPI 常见错误格式，例如 HTTPException
          if (Array.isArray(data.detail)) {
            // 如果 detail 是一个数组 (FastAPI 验证错误常见)
            errorMessage = data.detail.map(err => {
              const loc = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : 'unknown';
              return `${loc}: ${err.msg}`;
            }).join('; ');
          } else if (typeof data.detail === 'string') {
            // 如果 detail 是一个字符串
            errorMessage = data.detail;
          }
        } else if (data.errors && Array.isArray(data.errors)) {
          // 自定义错误格式，如果存在 errors 数组
          errorMessage = data.errors.map(err => `${err.loc.join('.')} ${err.msg}`).join('; ');
        } else if (data.message && typeof data.message === 'string') {
          // 某些情况下后端可能返回 message 字段
          errorMessage = data.message;
        } else {
          // 如果没有预期的字段，将整个对象转为字符串
          errorMessage = JSON.stringify(data);
        }
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data; // 附加原始的后端响应数据
      throw error;
    }
    return data;
  } else {
    // 处理非 JSON 响应（例如，没有 JSON 正文的成功上传）
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text(); // 返回非 JSON 成功的文本
  }
};


// 通用请求函数，包含认证和刷新逻辑
const request = async (url, options = {}) => {
  let { accessToken, expiryTime } = getAuthTokens();
  const now = Date.now();
  const REFRESH_THRESHOLD = 30 * 60 * 1000; // 在 access_token 过期前 5 分钟刷新

  // 检查 access_token 是否存在且是否即将过期
  if (accessToken && expiryTime && expiryTime < now + REFRESH_THRESHOLD) {
    try {
      accessToken = await refreshToken(); // 尝试刷新 access_token
    } catch (refreshError) {
      console.error('Failed to refresh access token before request:', refreshError);
      // 如果刷新失败，这意味着当前令牌可能已完全失效，需要用户重新登录
      clearAuthTokens();
      throw new Error('Authentication required: Token refresh failed.');
    }
  }

  // --- 修改开始 ---
  const defaultHeaders = {
    'X-Custom-Secret': CUSTOM_SECRET_KEY,
  };

  // 如果请求体不是 FormData，则设置 Content-Type 为 application/json
  // 否则，让浏览器自动设置 multipart/form-data
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const headers = {
    ...defaultHeaders,
    ...options.headers, // 允许覆盖或添加其他头
  };
  // --- 修改结束 ---

  // 如果有 access_token，添加到 Authorization 头
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // 如果收到 401 Unauthorized，清除令牌并抛出错误
    if (response.status === 401) {
      clearAuthTokens();
      throw new Error('Unauthorized: Please log in again.');
    }

    return await handleResponse(response);
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};


// 以下是所有导出 API 函数的修改，都将使用 `request` 函数

export const getAllSkus = async (page = 1, pageSize = 10, search = '') => {
  const url = new URL(`${API_BASE_URL}/get-all-sku`);
  url.searchParams.append('page', page);
  url.searchParams.append('page_size', pageSize);
  if (search) {
    url.searchParams.append('search', search);
  }
  return request(url.toString());
};

export const createSku = async (skuData) => {
  return request(`${API_BASE_URL}/create-sku`, {
    method: 'POST',
    body: JSON.stringify(skuData),
  });
};

export const updateSku = async (id, skuData) => {
  return request(`${API_BASE_URL}/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(skuData),
  });
};

export const deleteSku = async (id) => {
  return request(`${API_BASE_URL}/delete/${id}`, {
    method: 'DELETE',
  });
};

export const deleteMultipleSkus = async (ids) => {
  return request(`${API_BASE_URL}/batch`, {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
};

export const uploadSkuCsv = async (formData) => {
  return request(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    body: formData,
    // 移除了这里的 Content-Type: undefined，因为 request 函数现在会正确处理 FormData
  });
};

export const loginUser = async (email, password) => { // 将 username 改为 email
  const response = await request(`${AUTH_API_BASE_URL}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }), // 将 username 改为 email
    headers: {
      'Authorization': undefined,
    },
  });
  return response;
};

export const registerUser = async (email, password) => {
  // 注册请求不需要 Authorization 头
  return request(`${AUTH_API_BASE_URL}/register`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: {
      'Authorization': undefined, // 注册时明确不带 Authorization 头
    },
  });
};

export const generateAIDescription = async (skuDetails) => {
  return request(`${AI_API_BASE_URL}/AI-generate-desc`, {
    method: 'POST',
    body: JSON.stringify(skuDetails),
  });
};
