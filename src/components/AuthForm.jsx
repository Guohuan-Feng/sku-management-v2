// src/components/AuthForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { registerUser, loginUser } from '../services/skuApiService';

const { Title } = Typography;

// 注释掉或移除 Base64 编码的常量，因为我们现在使用 CDN 链接
// const GOOGLE_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAAAA...";

// Google CDN 图标链接
const GOOGLE_LOGO_CDN_URL = "https://img.icons8.com/color/48/google-logo.png";

const AuthForm = ({ onAuthSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Google Identity Services 初始化占位符 (前端部分)
  useEffect(() => {
    console.log('Google Identity Services 初始化占位符...');
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let response;
      if (isRegisterMode) {
        response = await registerUser(values.email, values.password);
        message.success('注册成功！请登录。');
        setIsRegisterMode(false);
      } else {
        response = await loginUser(values.email, values.password);
        localStorage.setItem('access_token', response.access_token);
        message.success('登录成功！');
        onAuthSuccess();
      }
      form.resetFields();
    } catch (error) {
      console.error('认证失败:', error);
      message.error(`认证失败: ${error.message || '请检查邮箱和密码。'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    message.info('点击 Google 登录按钮。此功能需要后端集成 Google OAuth。');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card style={{ width: 400, padding: '20px' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
          {isRegisterMode ? '注册' : '登录'}
        </Title>
        <Form
          form={form}
          name="auth_form"
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入您的邮箱！' },
              { type: 'email', message: '请输入有效的邮箱地址！' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入您的密码！' },
              { min: 6, message: '密码至少需要6个字符！' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          {isRegisterMode && (
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认您的密码！' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致！'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {isRegisterMode ? '注册' : '登录'}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Button type="link" onClick={() => setIsRegisterMode(!isRegisterMode)}>
              {isRegisterMode ? '已有账号？去登录' : '没有账号？去注册'}
            </Button>
          </div>

          <Divider plain>或者</Divider>

          <Form.Item>
            <Button
              type="default"
              onClick={handleGoogleLogin}
              block
              // 自定义样式以匹配您提供的 Google 按钮的外观
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '40px',
                backgroundColor: '#fff',
                color: '#3c4043',
                borderColor: '#dadce0',
                boxShadow: '0 1px 1px 0 rgba(0,0,0,.04), 0 1px 3px 0 rgba(0,0,0,.08)',
                fontWeight: '500',
                fontSize: '14px',
                borderRadius: '4px',
              }}
            >
              <img
                src={GOOGLE_LOGO_CDN_URL} // 使用 CDN 链接作为 src
                alt="Google G Logo"
                style={{ width: '18px', height: '18px', marginRight: '8px' }} // 设置合适的尺寸
              />
              继续使用 Google 登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AuthForm;