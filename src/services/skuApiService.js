const API_BASE_URL = 'https://ebay-oauth.onrender.com/JFJP/skus'; // 从您提供的URL更新

// 辅助函数处理 API 响应
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: response.statusText || '发生未知错误' };
    }
    const errorMessage = errorData.detail || (typeof errorData === 'string' ? errorData : 'API 请求失败');
    console.error('API Error:', errorMessage, 'Status:', response.status, 'Response:', errorData);
    throw new Error(errorMessage);
  }
  // 如果响应体为空 (例如 204 No Content), 返回一个成功的指示
  if (response.status === 204) {
      return { success: true, message: '操作成功完成，无内容返回。' };
  }
  return response.json();
};

export const getAllSkus = async () => {
  const response = await fetch(`${API_BASE_URL}/get-all-sku`);
  return handleResponse(response);
};

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

export const deleteSku = async (skuId) => {
  const response = await fetch(`${API_BASE_URL}/delete/${skuId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

export const uploadSkuCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    body: formData,
    // 注意: 使用 FormData 时, Content-Type header 会由浏览器自动设置, 通常不需要手动指定
  });
  return handleResponse(response);
};