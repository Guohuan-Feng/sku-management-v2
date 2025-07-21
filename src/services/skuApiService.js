// src/services/skuApiService.js

const API_BASE_URL = 'https://vp.jfj.ai/JFJP/skus';
const AUTH_API_BASE_URL = 'https://vp.jfj.ai/JFJP/auth';
const AI_API_BASE_URL = 'https://vp.jfj.ai/JFJP/AI';
// --- 新增用户管理API基础URL ---
const USER_API_BASE_URL = 'https://vp.jfj.ai/JFJP/user'; // 新增用户管理API基础URL
const CUSTOM_SECRET_KEY = import.meta.env.VITE_CUSTOM_SECRET_KEY;

// 辅助函数：获取当前 access token, refresh token 和过期时间
const getAuthTokens = () => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const expiryTime = localStorage.getItem('token_expiry_time');
  return { accessToken, refreshToken, expiryTime: expiryTime ? parseInt(expiryTime, 10) : null };
};

// 辅助函数：设置 access token, refresh token 和过期时间
const setAuthTokens = (accessToken, refreshToken, expiresIn) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  if (expiresIn) {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem('token_expiry_time', expiryTime.toString());
  } else {
    localStorage.removeItem('token_expiry_time');
  }

    console.log("认证信息已更新:");
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
    console.log("Token Type:", "bearer");
    console.log("Expires In (seconds):", expiresIn);
};

// 辅助函数：清除所有认证令牌
const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expiry_time');
};

let isRefreshing = false;
let failedQueue = [];

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

const refreshToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const { refreshToken: currentRefreshToken } = getAuthTokens();
    if (!currentRefreshToken) {
      clearAuthTokens();
      throw new Error('No refresh token available. Please log in.');
    }

    const response = await fetch(`${AUTH_API_BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Secret': CUSTOM_SECRET_KEY, // Ensure secret key is sent
      },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    });

    if (!response.ok) {
      clearAuthTokens();
      throw new Error(`Refresh token failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.access_token) {
      setAuthTokens(data.access_token, data.refresh_token || currentRefreshToken, data.expires_in);
      processQueue(null, data.access_token);
      return data.access_token;
    } else {
      clearAuthTokens();
      throw new Error('Refresh token response missing access_token');
    }
  } catch (error) {
    clearAuthTokens();
    processQueue(error);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

const handleResponse = async (response) => {
  // Check if the response is a blob/file type (e.g., for CSV downloads)
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('text/csv') || contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))) {
    if (!response.ok) {
      // If it's a file and not OK, try to parse as text for error message
      const errorText = await response.text();
      throw new Error(`File download failed: ${response.status} - ${errorText}`);
    }
    return response.blob(); // Return blob for file downloads
  }


  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();

    if (!response.ok) {
      console.error("Backend Error Response Data:", data);

      let errorMessage = response.statusText;

      if (data && typeof data === 'object') {
        if (data.error && typeof data.error === 'string') {
          const match = data.error.match(/'message': '([^']+)'/);
          if (match && match[1]) {
            errorMessage = match[1];
          } else {
            errorMessage = data.error;
          }
        }
        else if (data.detail) {
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => {
              const loc = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : 'unknown';
              return `${loc}: ${err.msg}`;
            }).join('; ');
          } else if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          }
        } else if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map(err => `${err.loc.join('.')}. ${err.msg}`).join('; '); // Corrected join for errors
        } else if (data.message && typeof data.message === 'string') {
          errorMessage = data.message;
        } else {
          errorMessage = JSON.stringify(data);
        }
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  } else {
    // For non-JSON responses (e.g., plain text feedback from tasks)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text(); // Return text for non-JSON responses
  }
};

const request = async (url, options = {}) => {
  let { accessToken, expiryTime } = getAuthTokens();
  const now = Date.now();
  const REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 分钟

  if (accessToken && expiryTime && expiryTime < now + REFRESH_THRESHOLD) {
    try {
      accessToken = await refreshToken();
    } catch (refreshError) {
      console.error('Failed to refresh access token before request:', refreshError);
      clearAuthTokens();
      throw new Error('Authentication required: Token refresh failed.');
    }
  }

  const defaultHeaders = {
    'X-Custom-Secret': CUSTOM_SECRET_KEY,
  };

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // If 401 occurs, try to refresh token once if it's not already refreshing
      if (!isRefreshing) {
        try {
          const newAccessToken = await refreshToken();
          // Retry the original request with the new token
          config.headers['Authorization'] = `Bearer ${newAccessToken}`;
          const retryResponse = await fetch(url, config);
          return await handleResponse(retryResponse);
        } catch (refreshError) {
          console.error('Failed to refresh token on 401:', refreshError);
          clearAuthTokens();
          throw new Error('Authentication required: Please log in again.');
        }
      } else {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve: (token) => {
            config.headers['Authorization'] = `Bearer ${token}`;
            fetch(url, config).then(handleResponse).then(resolve).catch(reject);
          }, reject });
        });
      }
    }

    return await handleResponse(response);
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};

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
  });
};

// 新机制：上传任务接口
export const uploadSkuTask = async (formData, onUploadProgress) => {
  // fetch/request 不支持 onUploadProgress，这里只是参数兼容
  return request('https://vp.jfj.ai/JFJP/tasks/upload-task', {
    method: 'POST',
    body: formData,
  });
};

// 新机制：查询任务状态
export const getUploadTaskStatus = async (taskId) => {
  return request(`https://vp.jfj.ai/JFJP/tasks/task-status/${taskId}`, {
    method: 'GET',
  });
};

export const loginUser = async (email, password) => {
  const response = await request(`${AUTH_API_BASE_URL}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: {
      'Authorization': undefined, // Explicitly ensure no auth header for login
    },
  });
  return response;
};

// --- 修改 registerUser 函数，使其支持 role 参数 ---
export const registerUser = async (email, password, role) => {
  return request(`${AUTH_API_BASE_URL}/register`, {
    method: 'POST',
    body: JSON.stringify({ email, password, role }), // 添加 role 到请求体
    headers: {
      'Authorization': undefined, // Explicitly ensure no auth header for register
    },
  });
};

export const generateAIDescription = async (skuDetails) => {
  return request(`${AI_API_BASE_URL}/AI-generate-desc`, {
    method: 'POST',
    body: JSON.stringify(skuDetails),
  });
};

export const translateProductName = async (productCnName) => {
  return request(`${AI_API_BASE_URL}/AI-generate-tran`, {
    method: 'POST',
    body: JSON.stringify({ product_cn_name: productCnName }),
  });
};

// --- 新增用户管理API函数 ---

/**
 * 获取当前登录用户的信息
 * GET /JFJP/auth/me
 */
export const getCurrentUserInfo = async () => {
  return request(`${AUTH_API_BASE_URL}/me`);
};

/**
 * 获取所有用户列表
 * GET /JFJP/user/get-all-users
 */
export const getAllUsers = async () => {
  return request(`${USER_API_BASE_URL}/get-all-users`);
};

/**
 * 删除指定用户
 * DELETE /JFJP/user/delete/{email}
 */
export const deleteUser = async (id) => {
  return request(`${USER_API_BASE_URL}/delete`, { // <--- 关键修改：URL 中移除了 ${id} --->
    method: 'DELETE',
    body: JSON.stringify({ id: id }), // 继续在请求体中发送 id
  });
};

/**
 * 更改指定用户的密码
 * POST /JFJP/user/change-password
 */
// <--- 这里是 changeUserPassword 函数的修改 --->
export const changeUserPassword = async (id, newPassword) => {
  return request(`${USER_API_BASE_URL}/change-password`, {
    method: 'POST',
    body: JSON.stringify({ id: id, new_password: newPassword }), // <--- 关键修改：字段名改为 id --->
  });
};
// <--- 修改结束 --->
// <--- 修改结束 --->
/**
 * 更改指定用户的角色
 * POST /JFJP/user/change-role
 */
// <--- 这里是 changeUserRole 函数的修改 --->
// 请注意，后端仍使用 ChangePasswordRequest，这里我们只能适应前端发送的字段名
export const changeUserRole = async (id, role) => {
  return request(`${USER_API_BASE_URL}/change-role`, {
    method: 'POST',
    body: JSON.stringify({ id: id, role: role }), // <--- 关键修改：字段名改为 id --->
  });
};
// <--- 修改结束 --->

export const sendSelectedSkuIdsToBackend = async (ids) => {
  return request(`${API_BASE_URL}/wms-create-update`, {
    method: 'POST',
    body: JSON.stringify({ sku_ids: ids }),
  });
};

export const sendUserWMSToken = async ({ id, api_key, api_token }) => {
  return request(`${USER_API_BASE_URL}/wms-token`, {
    method: 'POST',
    body: JSON.stringify({ id, api_key, api_token }),
  });
};

// 图片上传相关API
export const uploadImage = async (file, fieldName, skuId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('field_name', fieldName);
  if (skuId) {
    formData.append('sku_id', skuId);
  }

  return request('https://vp.jfj.ai/JFJP/image/upload-image', {
    method: 'POST',
    body: formData,
  });
};

export const setImageProductId = async (imageIds, productId) => {
  return request('https://vp.jfj.ai/JFJP/image/upload-image/set-image-product-id', {
    method: 'POST',
    body: JSON.stringify({
      image_ids: imageIds,
      product_id: productId,
    }),
  });
};
