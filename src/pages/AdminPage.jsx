// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  getAllUsers,
  deleteUser,
  changeUserPassword,
  changeUserRole,
  getCurrentUserInfo // 用于获取当前用户角色，尽管这里只是组件示例，实际权限控制可能在路由层
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

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      if (data && Array.isArray(data)) {
        setUsers(data);
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
  const handleDeleteUser = async (email) => {
    try {
      await deleteUser(email);
      message.success(t('userDeletedSuccessfully', { email }));
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
        await changeUserPassword(currentUser.email, values.newPassword);
        message.success(t('passwordChangedSuccessfully', { email: currentUser.email }));
      } else if (modalType === 'role') {
        await changeUserRole(currentUser.email, values.role);
        message.success(t('roleChangedSuccessfully', { email: currentUser.email }));
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

  const columns = [
    {
      title: t('email'), // 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'email' 翻译
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('role'), // 已有
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: t('actions'), // 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'actions' 翻译
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title={t('confirmDeleteUser')} // 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'confirmDeleteUser' 翻译
            onConfirm={() => handleDeleteUser(record.email)}
            okText={t('yes')} // 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'yes' 翻译
            cancelText={t('no')} // 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'no' 翻译
          >
            <Button danger>{t('deleteUser')}</Button> {/* 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'deleteUser' 翻译 */}
          </Popconfirm>
          <Button onClick={() => showModal('password', record)}>{t('changePassword')}</Button> {/* 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'changePassword' 翻译 */}
          <Button onClick={() => showModal('role', record)}>{t('changeRole')}</Button> {/* 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'changeRole' 翻译 */}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>{t('adminPanel')}</h1> {/* 您需要在 i18n/zh.json 和 i18n/en.json 中添加 'adminPanel' 翻译 */}
      <Table
        columns={columns}
        dataSource={users}
        rowKey="email"
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
          <Form.Item label={t('userEmail')}>
            <Input value={currentUser?.email} disabled />
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
    </div>
  );
};

export default AdminPage;