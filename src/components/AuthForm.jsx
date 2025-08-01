// src/components/AuthForm.jsx
import React, { useState } from 'react';
import { Form, Input, Button, message, Alert, Tabs, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { loginUser, registerUser } from '../services/skuApiService';

const { Option } = Select;

const AuthForm = ({ onAuthSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'register') {
        // --- 修改点：在调用 registerUser 时传入 role ---
        // 添加这一行来打印 role 的值
        console.log("Attempting to register with role:", values.role); //

        const data = await registerUser(values.username, values.password, values.role); //
        // --- 结束修改点 ---
        if (data && data.message) {
          message.success(t('registerSuccess'));
          setActiveTab('login');
        } else {
          message.error(t('registerFailed'));
        }
      } else { // Login
        const response = await loginUser(values.username, values.password); //
        if (response && response.data && response.data.access_token) {
          const { access_token, refresh_token, expires_in } = response.data;
          
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          if (expires_in) {
            const expiryTime = Date.now() + expires_in * 1000; 
            localStorage.setItem('token_expiry_time', expiryTime.toString());
          }

          onAuthSuccess();
          message.success(t('loginSuccess'));
        } else {
          message.error(t('loginFailed'));
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || t('authFailed'));
      message.error(error.message || t('authFailed'));
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: 'login',
      label: t('login'),
      children: (
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('pleaseInputUsername') }]}
          >
            <Input placeholder={t('username')} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('pleaseInputPassword') }]}
          >
            <Input.Password placeholder={t('password')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('login')}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} centered />
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />}
    </div>
  );
};

export default AuthForm;