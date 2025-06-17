// src/components/AuthForm.jsx
// import React, { useState, useEffect } from 'react';
// import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
// import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
// import { registerUser, loginUser } from '../services/skuApiService';
// import { useTranslation } from 'react-i18next'; // 引入 useTranslation

// const { Title } = Typography;

// const GOOGLE_LOGO_CDN_URL = "https://img.icons8.com/color/48/google-logo.png";

// const AuthForm = ({ onAuthSuccess }) => {
//   const { t } = useTranslation(); // 使用 useTranslation 钩子
//   const [isRegisterMode, setIsRegisterMode] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [form] = Form.useForm();

//   useEffect(() => {
//     console.log('Google Identity Services 初始化占位符...');
//   }, []);

//   const handleSubmit = async (values) => {
//     setLoading(true);
//     try {
//       let response;
//       if (isRegisterMode) {
//         response = await registerUser(values.email, values.password);
//         message.success(t('authForm.registerSuccess')); // 翻译
//         setIsRegisterMode(false);
//       } else {
//         response = await loginUser(values.email, values.password);
//         localStorage.setItem('access_token', response.access_token);
//         message.success(t('authForm.loginSuccess')); // 翻译
//         onAuthSuccess();
//       }
//       form.resetFields();
//     } catch (error) {
//       console.error('认证失败:', error);
//       message.error(`${t('authForm.authFailed')}${error.message || t('authForm.checkEmailPassword')}`); // 翻译
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoogleLogin = () => {
//     message.info(t('authForm.googleLoginInfo')); // 翻译
//   };

//   return (
//     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
//       <Card style={{ width: 400, padding: '20px' }}>
//         <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
//           {isRegisterMode ? t('authForm.register') : t('authForm.login')} {/* 翻译 */}
//         </Title>
//         <Form
//           form={form}
//           name="auth_form"
//           initialValues={{ remember: true }}
//           onFinish={handleSubmit}
//           autoComplete="off"
//         >
//           <Form.Item
//             name="email"
//             rules={[
//               { required: true, message: t('authForm.emailRequired') }, // 翻译
//               { type: 'email', message: t('authForm.emailInvalid') }, // 翻译
//             ]}
//           >
//             <Input prefix={<MailOutlined />} placeholder={t('authForm.email')} /> {/* 翻译 */}
//           </Form.Item>

//           <Form.Item
//             name="password"
//             rules={[
//               { required: true, message: t('authForm.passwordRequired') }, // 翻译
//               { min: 6, message: t('authForm.passwordMinLength') }, // 翻译
//             ]}
//           >
//             <Input.Password prefix={<LockOutlined />} placeholder={t('authForm.password')} /> {/* 翻译 */}
//           </Form.Item>

//           {isRegisterMode && (
//             <Form.Item
//               name="confirmPassword"
//               dependencies={['password']}
//               hasFeedback
//               rules={[
//                 { required: true, message: t('authForm.confirmPasswordRequired') }, // 翻译
//                 ({ getFieldValue }) => ({
//                   validator(_, value) {
//                     if (!value || getFieldValue('password') === value) {
//                       return Promise.resolve();
//                     }
//                     return Promise.reject(new Error(t('authForm.passwordsMismatch'))); // 翻译
//                   },
//                 }),
//               ]}
//             >
//               <Input.Password prefix={<LockOutlined />} placeholder={t('authForm.confirmPassword')} /> {/* 翻译 */}
//             </Form.Item>
//           )}

//           <Form.Item>
//             <Button type="primary" htmlType="submit" loading={loading} block>
//               {isRegisterMode ? t('authForm.register') : t('authForm.login')} {/* 翻译 */}
//             </Button>
//           </Form.Item>

//           <div style={{ textAlign: 'center', marginBottom: '16px' }}>
//             <Button type="link" onClick={() => setIsRegisterMode(!isRegisterMode)}>
//               {isRegisterMode ? t('authForm.alreadyHaveAccount') : t('authForm.noAccountYet')} {/* 翻译 */}
//             </Button>
//           </div>

//           <Divider plain>{t('authForm.or')}</Divider> {/* 翻译 */}

//           <Form.Item style={{ display: 'none' }}>
//             <Button
//               type="default"
//               onClick={handleGoogleLogin}
//               block
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 height: '40px',
//                 backgroundColor: '#fff',
//                 color: '#3c4043',
//                 borderColor: '#dadce0',
//                 boxShadow: '0 1px 1px 0 rgba(0,0,0,.04), 0 1px 3px 0 rgba(0,0,0,.08)',
//                 fontWeight: '500',
//                 fontSize: '14px',
//                 borderRadius: '4px',
//               }}
//             >
//               <img
//                 src={GOOGLE_LOGO_CDN_URL}
//                 alt="Google G Logo"
//                 style={{ width: '18px', height: '18px', marginRight: '8px' }}
//               />
//               {t('authForm.continueWithGoogle')} {/* 翻译 */}
//             </Button>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// };

// export default AuthForm;