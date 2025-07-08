// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  getAllUsers,
  deleteUser,
  changeUserPassword,
  changeUserRole,
  getCurrentUserInfo,
  registerUser,
  sendUserWMSToken
} from '../services/skuApiService'; // 确保这些函数已在 skuApiService.js 中导出

const { Option } = Select;

const AdminPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'password' 或 'role'
  const [currentUser, setCurrentUser] = useState(null); // 当前操作的用户
  const [form] = Form.useForm();
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerForm] = Form.useForm();
  const [wmsTokenModalVisible, setWmsTokenModalVisible] = useState(false);
  const [wmsTokenUser, setWmsTokenUser] = useState(null);
  const [wmsTokenLoading, setWmsTokenLoading] = useState(false);
  const [wmsTokenForm] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      if (data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        message.error(t('failedToLoadUsers'));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      message.error(error.message || t('failedToLoadUsers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 处理删除用户
  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id);
      message.success(t('userDeletedSuccessfully', { id }));
      fetchUsers(); // 删除后刷新列表
    } catch (error) {
      console.error('Failed to delete user:', error);
      message.error(error.message || t('failedToDeleteUser'));
    }
  };

  // 打开修改密码/角色模态框
  const showModal = (type, user) => {
    setModalType(type);
    setCurrentUser(user);
    setIsModalVisible(true);
    // 如果是修改角色，设置表单的初始值为当前用户的角色
    if (type === 'role' && user) {
      form.setFieldsValue({ role: user.role });
    } else {
      form.resetFields(); // 重置表单字段
    }
  };

  // 提交模态框表单
  const handleModalSubmit = async (values) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      if (modalType === 'password') {
        await changeUserPassword(currentUser.id, values.newPassword);
        message.success(t('passwordChangedSuccessfully', { id: currentUser.id }));
      } else if (modalType === 'role') {
        await changeUserRole(currentUser.id, values.role);
        message.success(t('roleChangedSuccessfully', { id: currentUser.id }));
      }
      setIsModalVisible(false);
      fetchUsers(); // 刷新列表以显示更新
    } catch (error) {
      console.error(`Failed to change ${modalType} for user:`, error);
      message.error(error.message || t(`failedToChange${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // 注册新用户
  const handleRegister = async (values) => {
    setRegisterLoading(true);
    try {
      await registerUser(values.username, values.password, values.role);
      message.success('注册成功');
      setRegisterModalVisible(false);
      registerForm.resetFields();
      fetchUsers();
    } catch (error) {
      message.error(error.message || '注册失败');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleShowWmsTokenModal = (user) => {
    setWmsTokenUser(user);
    setWmsTokenModalVisible(true);
    wmsTokenForm.resetFields();
  };

  const handleWmsTokenSubmit = async (values) => {
    setWmsTokenLoading(true);
    try {
      await sendUserWMSToken({
        id: wmsTokenUser.id,
        api_key: values.api_key,
        api_token: values.api_token,
      });
      message.success(t('wmsTokenSaved'));
      setWmsTokenModalVisible(false);
    } catch (error) {
      message.error(error.message || t('wmsTokenSaveFailed'));
    } finally {
      setWmsTokenLoading(false);
    }
  };

  const columns = [
    {
      title: t('Email'), // 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'email' 翻译
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('Role'), // 已有
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: t('Actions'), // 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'actions' 翻译
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title={t('confirmDeleteUser')} // 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'confirmDeleteUser' 翻译
            onConfirm={() => handleDeleteUser(record.id)}
            okText={t('yes')} // 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'yes' 翻译
            cancelText={t('no')} // 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'no' 翻译
          >
            <Button danger>{t('Delete User')}</Button> {/* 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'deleteUser' 翻译 */}
          </Popconfirm>
          <Button onClick={() => showModal('password', record)}>{t('Change Password')}</Button> {/* 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'changePassword' 翻译 */}
          <Button onClick={() => showModal('role', record)}>{t('Change Role')}</Button> {/* 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'changeRole' 翻译 */}
          <Button onClick={() => handleShowWmsTokenModal(record)}>{t('manageWMSToken')}</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ color: 'black', margin: 0 }}>{t('Admin Panel')}</h1>
        <Button type="primary" onClick={() => setRegisterModalVisible(true)}>{t('Register') || '新增用户'}</Button>
      </div>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={modalType === 'password' ? t('changeUserPassword') : t('changeUserRole')}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null} // 不显示默认的 footer 按钮，使用 Form 中的 Button
      >
        <Form
          form={form}
          name="user_action"
          onFinish={handleModalSubmit}
          initialValues={modalType === 'role' && currentUser ? { role: currentUser.role } : {}}
        >
          <Form.Item label={t('userId') || '用户ID'}>
            <Input value={currentUser?.id} disabled />
          </Form.Item>

          {modalType === 'password' && (
            <>
              <Form.Item
                name="newPassword"
                label={t('newPassword')}
                rules={[{ required: true, message: t('pleaseInputNewPassword') }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirmNewPassword"
                label={t('confirmNewPassword')}
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: t('pleaseConfirmNewPassword') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('passwordsDoNotMatch')));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}

          {modalType === 'role' && (
            <Form.Item
              name="role"
              label={t('newRole')}
              rules={[{ required: true, message: t('pleaseSelectNewRole') }]}
            >
              <Select>
                <Option value="vendor">{t('vendor')}</Option>
                <Option value="admin">{t('admin')}</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('confirm')}
            </Button>
            <Button onClick={handleCancel} style={{ marginLeft: 8 }}>
              {t('cancel')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增用户弹窗 */}
      <Modal
        title={t('register') || '新增用户'}
        visible={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={null}
      >
        <Form
          form={registerForm}
          layout="vertical"
          onFinish={handleRegister}
        >
          <Form.Item
            name="username"
            label={t('username') || '用户名'}
            rules={[{ required: true, message: t('pleaseInputUsername') || '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('password') || '密码'}
            rules={[{ required: true, message: t('pleaseInputPassword') || '请输入密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirm"
            label={t('confirmPassword') || '确认密码'}
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: t('pleaseConfirmPassword') || '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('passwordsDoNotMatch') || '两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="role"
            label={t('role') || '角色'}
            rules={[{ required: true, message: t('pleaseSelectRole') || '请选择角色' }]}
            initialValue="vendor"
          >
            <Select>
              <Select.Option value="vendor">{t('vendor') || '供应商'}</Select.Option>
              <Select.Option value="admin">{t('admin') || '管理员'}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={registerLoading} block>
              {t('register') || '注册'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('manageWMSToken')}
        visible={wmsTokenModalVisible}
        onCancel={() => setWmsTokenModalVisible(false)}
        footer={null}
      >
        <Form
          form={wmsTokenForm}
          layout="vertical"
          onFinish={handleWmsTokenSubmit}
        >
          <Form.Item
            name="api_key"
            label={t('apiKey')}
            rules={[{ required: true, message: t('pleaseInputApiKey') }]}
          >
            <Input.Password autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="api_token"
            label={t('apiToken')}
            rules={[{ required: true, message: t('pleaseInputApiToken') }]}
          >
            <Input.Password autoComplete="off" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={wmsTokenLoading} block>
              {t('save')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPage;