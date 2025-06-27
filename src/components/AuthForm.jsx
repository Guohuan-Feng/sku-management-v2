// src/components/AuthForm.jsx
import React, { useState } from 'react';
import { Form, Input, Button, message, Alert, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { loginUser, registerUser } from '../services/skuApiService';

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
        const data = await registerUser(values.username, values.password);
        if (data && data.message) {
          message.success(t('registerSuccess'));
          setActiveTab('login'); // 注册成功后切换到登录页
        } else {
          message.error(t('registerFailed'));
        }
      } else { // Login
        // 假设 loginUser 返回 { message: "Authenticate pass.", data: { refresh_token, access_token, token_type, expires_in } }
        const response = await loginUser(values.username, values.password); // loginUser现在返回完整的response
        if (response && response.data && response.data.access_token) {
          const { access_token, refresh_token, expires_in } = response.data;
          
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token); // 存储 refresh_token
          
          // 如果后端提供了 access_token 的 expires_in (秒)，存储其过期时间戳（毫秒）
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
    {
      key: 'register',
      label: t('register'),
      children: (
        <Form
          name="register"
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

          <Form.Item
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: t('pleaseConfirmPassword') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('passwordsDoNotMatch')));
                },
              }),
            ]}
          >
            <Input.Password placeholder={t('confirmPassword')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('register')}
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