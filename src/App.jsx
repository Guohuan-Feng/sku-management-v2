// src/App.jsx
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Table, ConfigProvider, Button, message, Upload, Space, Popconfirm, Alert, Form, Input, Divider, Modal } from 'antd'; // 导入 Divider 和 Modal
import * as XLSX from 'xlsx';
import { fieldsConfig, statusOptions, conditionOptions } from './components/fieldConfig';
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ExportOutlined, SaveOutlined, CloseOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import SkuFormModal from './components/SkuFormModal';
import EditableCell from './components/EditableCell';
import AuthForm from './components/AuthForm'; // 添加这一行
import { getAllSkus, createSku, updateSku, deleteSku, uploadSkuCsv, getCurrentUserInfo } from './services/skuApiService';
import { Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import AccountPage from './pages/AccountPage';

// Import Ant Design language packs
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

// Import useTranslation
import { useTranslation } from 'react-i18next';

// Assume the Logo in the image is a local image, or you can replace it with a CDN link
import JFJPLogo from '/JFJP_logo.png';

const App = () => {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSku, setEditingSku] = useState(null);
  const fileInputRef = useRef(null);
  const [errorMessages, setErrorMessages] = useState([]);
  const [formApiFieldErrors, setFormApiFieldErrors] = useState([]);

  const [editingKey, setEditingKey] = useState('');
  const [editingRowData, setEditingRowData] = useState({});
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [viewingSku, setViewingSku] = useState(null);
  const [searchText, setSearchText] = useState('');

  // New login status
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // New user role
  const [userRole, setUserRole] = useState(null);

  // New user info
  const [userInfo, setUserInfo] = useState(null);

  // Ant Design language pack mapping
  const antdLocales = {
    en: enUS,
    zh: zhCN,
  };

    // 将获取用户信息和角色的逻辑封装成一个函数
    const fetchUserInfoAndRole = async () => {
      try {
        const user = await getCurrentUserInfo(); //
        setUserRole(user.role);
        setUserInfo(user);
        console.log("User info fetched:", user); // 添加日志，方便调试
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        setUserRole(null);
        setUserInfo(null);
        // 可以添加错误消息提示，例如：message.error(t('failedToLoadUserInfo'));
      }
    };

  // Check token in local storage to determine if the user is logged in
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
      fetchSkusWithHandling();
      fetchUserInfoAndRole(); // 在初始加载时调用
      getCurrentUserInfo().then(user => {
        setUserRole(user.role);
        setUserInfo(user);
      }).catch(() => {
        setUserRole(null);
        setUserInfo(null);
      });
    }
  }, []);

  const handleInlineFormValuesChange = (changedValues, allValues) => {
    setEditingRowData(prev => ({ ...prev, ...changedValues }));
  };

  const fetchSkusWithHandling = async () => {
    setLoading(true);
    setErrorMessages([]);
    try {
      const data = await getAllSkus();
      setDataSource(data.data.map(item => ({ ...item, key: item.id }))); // 访问 data.data
      message.success(t('messages.skuDataLoaded'));
    } catch (error) {
      console.error("Failed to fetch SKUs:", error);
      message.error(`${t('messages.failedToFetchSkus')}${error.message}`);
      setErrorMessages(prev => [...prev, `${t('messages.failedToFetchSkus')}${error.message}`]);
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async () => { // 修改为 async 函数
    setIsLoggedIn(true);
    fetchSkusWithHandling();
    await fetchUserInfoAndRole(); // 在登录成功后等待获取用户信息和角色
    message.success(t('messages.loggedIn'));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token'); // 确保也清除了 refresh token
    localStorage.removeItem('token_expiry_time'); // 确保也清除了 token expiry time
    setIsLoggedIn(false);
    setUserRole(null); // 登出时清除用户角色
    setUserInfo(null); // 登出时清除用户信息
    setDataSource([]);
    message.info(t('messages.loggedOut'));
  };

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    if (editingKey) {
      message.warning(t('tableOperations.saveOrCancelCurrentEdit'));
      return;
    }

    const initialValues = { ...record };
    fieldsConfig.forEach(field => {
      if (field.type === 'select') {
         if (initialValues[field.name] !== undefined && initialValues[field.name] !== null) {
             initialValues[field.name] = String(initialValues[field.name]);
         }
      } else if (field.type === 'number' && initialValues[field.name] !== undefined && initialValues[field.name] !== null) {
        const numValue = parseFloat(initialValues[field.name]);
        initialValues[field.name] = isNaN(numValue) ? null : numValue;
      } else if (field.name === 'allow_dropship_return' && initialValues[field.name] !== undefined && initialValues[field.name] !== null) {
        initialValues[field.name] = String(initialValues[field.name]);
      }
      // Initialize URL fields to empty string if null or undefined
      if (field.type === 'url' && (initialValues[field.name] === null || initialValues[field.name] === undefined)) {
        initialValues[field.name] = '';
      }
      // Initialize UOM field to empty string if null or undefined
      if (field.name === 'UOM' && (initialValues[field.name] === null || initialValues[field.name] === undefined)) {
        initialValues[field.name] = '';
      }
      // 将 null 转换为 ''，以便在输入框中显示为空
      const currentFieldConfig = fieldsConfig.find(f => f.name === field.name);
      if (currentFieldConfig && typeof initialValues[field.name] === 'object' && initialValues[field.name] === null) {
          initialValues[field.name] = '';
      }
    });

    form.setFieldsValue(initialValues);
    setEditingRowData(initialValues);
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
    setEditingRowData({});
    setFormApiFieldErrors([]);
  };

  const save = async (key) => {
    setLoading(true);
    setErrorMessages([]);
    setFormApiFieldErrors([]);

    try {
      const validatedFields = await form.validateFields();

      const updatedItem = { ...editingRowData, ...validatedFields };

      fieldsConfig.forEach(field => {
          if (field.type === 'number' && updatedItem[field.name] !== undefined && updatedItem[field.name] !== null) {
              const parsedValue = parseFloat(updatedItem[field.name]);
              if (!isNaN(parsedValue)) {
                  updatedItem[field.name] = field.isFee ? parseFloat(parsedValue.toFixed(2)) : parsedValue;
              } else {
                  updatedItem[field.name] = null;
              }
          }
          if (field.name === 'status' && updatedItem[field.name] !== undefined) {
              updatedItem[field.name] = parseInt(updatedItem[field.name], 10);
          }
          if (field.name === 'condition' && updatedItem[field.name] !== undefined) {
              updatedItem[field.name] = parseInt(updatedItem[field.name], 10);
          }
          if (field.name === 'allow_dropship_return' && updatedItem[field.name] !== undefined) {
              updatedItem[field.name] = updatedItem[field.name] === 'True' || updatedItem[field.name] === true;
          }
          // 新增逻辑：如果字段不是强制必填且其值为字符串且为空，则将其设为 null
          const currentFieldConfig = fieldsConfig.find(f => f.name === field.name);
          if (currentFieldConfig && !currentFieldConfig.isMandatory && typeof updatedItem[field.name] === 'string' && updatedItem[field.name].trim() === '') {
              updatedItem[field.name] = null;
          }
          // Convert empty string URL fields to null
          if (field.type === 'url') {
            if (updatedItem[field.name] === null || updatedItem[field.name] === undefined || String(updatedItem[field.name]).trim() === '') {
              updatedItem[field.name] = null;
            }
          }
          // Convert empty string UOM field to null
          if (field.name === 'UOM') {
            if (updatedItem[field.name] === '') {
              updatedItem[field.name] = null;
            }
          }
      });

      const { key: _, ...apiPayload } = updatedItem;

      if (String(key).startsWith('new-temp-id')) {
        await createSku(apiPayload);
        message.success(t('messages.skuCreated'));
      } else {
        await updateSku(apiPayload.id, apiPayload);
        message.success(t('messages.skuUpdated'));
      }

      fetchSkusWithHandling();
      setEditingKey('');
      setEditingRowData({});
    } catch (errInfo) {
      console.error('Validate Failed (Save Inline):', errInfo);
      if (errInfo.errorFields) {
        message.error(t('messages.validationFailed'));
      } else if (errInfo.fieldErrors && Array.isArray(errInfo.fieldErrors)) {
        setFormApiFieldErrors(errInfo.fieldErrors);
        const apiErrorsMsg = errInfo.fieldErrors.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join('; ');
        message.error(t('messages.apiError', { message: apiErrorsMsg }));
      } else {
        message.error(t('messages.failedToSaveSku', { message: errInfo.message || 'Unknown error' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const getTableColumns = () => {
    const orderedDisplayFields = [
      'vendor_sku', 'UPC', 'product_en_name', 'product_cn_name',
      'dropship_price', 'brand',
      'net_weight', 'gross_weight', 'product_height', 'product_length', 'product_width',
      'box_height', 'box_length', 'box_width', 'main_image', 'size_chart_image',
    ];

    const columnsToDisplay = orderedDisplayFields
      .map(fieldName => fieldsConfig.find(field => field.name === fieldName))
      .filter(Boolean);

    const generatedColumns = columnsToDisplay
      .map((field) => {
        if (field.name === 'id') return null;

        return {
          title: <div style={{ textAlign: 'center' }}>{t(field.label)}</div>,
          dataIndex: field.name,
          key: field.name,
          width: field.name === 'vendor_sku' ? 180 : (field.type === 'textarea' || field.name.toLowerCase().includes('desc') ? 250 : 150),
          fixed: field.name === 'vendor_sku' ? 'left' : undefined,
          ellipsis: true,
          render: (text, record) => {
            const editable = isEditing(record);
            return editable ? (
              <EditableCell
                editing={editable}
                dataIndex={field.name}
                inputType={field.type}
                record={record}
                title={t(field.label)}
              >
                {text}
              </EditableCell>
            ) : (
              text
            );
          },
          onCell: (record) => ({
            record,
            inputType: field.type,
            dataIndex: field.name,
            title: t(field.label),
            editing: isEditing(record),
            onClick: () => {
              if (!isEditing(record)) {
                edit(record);
              }
            },
          }),
        };
      }).filter(Boolean);

    generatedColumns.push({
      title: t('tableColumns.operation'),
      dataIndex: 'operation',
      key: 'operation',
      fixed: 'right',
      width: 180,
      render: (_, record) => {
        const editable = isEditing(record);

        return editable ? (
          <Space size="small">
            <Button type="link" icon={<SaveOutlined />} onClick={() => save(record.key)} loading={loading}>
              {t('tableOperations.save')}
            </Button>
            <Popconfirm title={t('tableOperations.cancel')} onConfirm={cancel}>
              <Button type="link" icon={<CloseOutlined />} danger>
                {t('tableOperations.cancel')}
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          <Space size="small">
            <Button icon={<EditOutlined />} onClick={() => edit(record)} type="link">{t('tableOperations.edit')}</Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setViewingSku(record);
                setIsViewAllModalOpen(true);
              }}
              type="link"
            >
              {t('tableOperations.showAll')}
            </Button>
            <Popconfirm
              title={t('tableOperations.deleteConfirmTitle')}
              onConfirm={() => handleDelete(record.key)}
              okText={t('modalButtons.update')}
              cancelText={t('modalButtons.cancel')}
            >
              <Button icon={<DeleteOutlined />} type="link" danger>{t('tableOperations.delete')}</Button>
            </Popconfirm>
          </Space>
        );
      },
    });

    return generatedColumns;
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleAddInline = () => {
    if (editingKey) {
      message.warning(t('tableOperations.saveOrCancelCurrentEdit'));
      return;
    }

    const newSku = {
      key: `new-temp-id-${Date.now()}`,
      id: 'new-temp-id',
      ...fieldsConfig.reduce((acc, field) => {
        if (field.defaultValue !== undefined) {
          acc[field.name] = field.defaultValue;
        } else if (field.type === 'number') {
            acc[field.name] = null;
        } else if (field.type === 'select') {
            let selectDefault = null;
            if (field.options && field.options.length > 0) {
                selectDefault = field.options[0].value;
            }
            acc[field.name] = selectDefault;
        } else if (field.type === 'url') {
            acc[field.name] = ''; // URL field displays as empty string by default, not null
        } else {
            if (field.isMandatory && field.name !== 'UOM') { // UOM is mandatory but can be null/empty
                acc[field.name] = '';
            } else {
                acc[field.name] = null; // Non-mandatory fields and UOM default to null
            }
        }
        return acc;
      }, {})
    };

    setDataSource([...dataSource, newSku]);
    edit(newSku);
  };

  const handleDelete = async (skuIdToDelete) => {
    setLoading(true);
    setErrorMessages([]);
    try {
      if (editingKey === skuIdToDelete && String(skuIdToDelete).startsWith('new-temp-id')) {
        setDataSource(dataSource.filter(item => item.key !== skuIdToDelete));
        setEditingKey('');
        setEditingRowData({});
        message.success(t('tableOperations.discardNewSku'));
      } else {
        const skuToDelete = dataSource.find(item => item.key === skuIdToDelete);
        if (!skuToDelete || String(skuToDelete.id).startsWith('new-temp-id')) {
            message.error(t('messages.skuIDNotFoundOrTemp'));
            setLoading(false);
            return;
        }
        await deleteSku(skuToDelete.id);
        message.success(t('tableOperations.deleteSuccess'));
        fetchSkusWithHandling();
      }
      setSelectedRowKeys(prevKeys => prevKeys.filter(k => k !== skuIdToDelete));
    } catch (error) {
      console.error('Failed to delete SKU:', error);
      message.error(`${t('tableOperations.deleteError')}${error.message}`);
      setErrorMessages(prev => [...prev, `${t('tableOperations.deleteError')}ID ${skuIdToDelete}: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('tableOperations.selectToDelete'));
      return;
    }
    setLoading(true);
    setErrorMessages([]);
    let successCount = 0;
    const currentErrors = [];
    const remainingSelectedKeys = [...selectedRowKeys];

    for (const skuKey of selectedRowKeys) {
      try {
        if (editingKey === skuKey && String(skuKey).startsWith('new-temp-id')) {
          setDataSource(prevDs => prevDs.filter(item => item.key !== skuKey));
          if (editingKey === skuKey) {
            setEditingKey('');
            setEditingRowData({});
          }
          successCount++;
          remainingSelectedKeys.splice(remainingSelectedKeys.indexOf(skuKey), 1);
        } else {
          const skuToDelete = dataSource.find(item => item.key === skuKey);
          if (skuToDelete && !String(skuToDelete.id).startsWith('new-temp-id')) {
            await deleteSku(skuToDelete.id);
            successCount++;
            remainingSelectedKeys.splice(remainingSelectedKeys.indexOf(skuKey), 1);
          } else {
             currentErrors.push(t('messages.skuIDNotFoundOrTemp', { key: skuKey }));
          }
        }
      } catch (error) {
        console.error(`Failed to delete SKU with key ${skuKey}:`, error);
        currentErrors.push(`${t('tableOperations.deleteError')} key ${skuKey}: ${error.message}`);
      }
    }

    setLoading(false);
    if (successCount > 0) {
      message.success(t('tableOperations.deleteSelectedSuccess', { count: successCount }));
    }
    if (currentErrors.length > 0) {
      setErrorMessages(prev => [...prev, ...currentErrors]);
      message.error(t('tableOperations.deleteSelectedError', { count: currentErrors.length }));
    }
    if (successCount > 0 || selectedRowKeys.some(key => String(key).startsWith('new-temp-id'))) {
         fetchSkusWithHandling();
    }
    setSelectedRowKeys(remainingSelectedKeys);
  };

  const handleModalSubmit = async (values, initialDataParam) => {
    setLoading(true);
    setFormApiFieldErrors([]);
    try {
      let success = false;
      const submissionValues = { ...values };

      if (initialDataParam && initialDataParam.id) {
        submissionValues.id = initialDataParam.id;
      }

      fieldsConfig.forEach(field => {
        if (field.type === 'number' && submissionValues[field.name] !== undefined && submissionValues[field.name] !== null) {
          const parsedValue = parseFloat(submissionValues[field.name]);
          if (!isNaN(parsedValue)) {
            submissionValues[field.name] = field.isFee ? parseFloat(parsedValue.toFixed(2)) : parsedValue;
          } else {
            submissionValues[field.name] = null;
          }
        }
        if (field.name === 'status' && submissionValues[field.name] !== undefined) {
          submissionValues[field.name] = parseInt(submissionValues[field.name], 10);
        }
        if (field.name === 'condition' && submissionValues[field.name] !== undefined) {
          submissionValues[field.name] = parseInt(submissionValues[field.name], 10);
        }
        if (field.name === 'allow_dropship_return' && submissionValues[field.name] !== undefined) {
          submissionValues[field.name] = submissionValues[field.name] === 'True' || submissionValues[field.name] === true;
        }
        // 新增逻辑：如果字段不是强制必填且其值为字符串且为空，则将其设为 null
        const currentFieldConfig = fieldsConfig.find(f => f.name === field.name);
        if (currentFieldConfig && !currentFieldConfig.isMandatory && typeof submissionValues[field.name] === 'string' && submissionValues[field.name].trim() === '') {
            submissionValues[field.name] = null;
        }
        // Convert empty string URL fields to null
        if (field.type === 'url') {
          if (submissionValues[field.name] === null || submissionValues[field.name] === undefined || String(submissionValues[field.name]).trim() === '') {
            submissionValues[field.name] = null;
          }
        }
        // Convert empty string UOM field to null
        if (field.name === 'UOM') {
          if (submissionValues[field.name] === '') {
            submissionValues[field.name] = null;
          }
        }
      });

      if (initialDataParam && initialDataParam.id && !String(initialDataParam.id).startsWith('new-temp-id')) {
        await updateSku(initialDataParam.id, submissionValues);
        message.success(t('messages.skuUpdated'));
        success = true;
      } else {
        const { id: tempId, ...payload } = submissionValues;
        await createSku(payload);
        message.success(t('messages.skuCreated'));
        success = true;
      }

      if (success) {
        fetchSkusWithHandling();
        if (initialDataParam === editingSku) {
            handleModalClose();
        } else if (initialDataParam === viewingSku) {
            handleViewAllModalClose();
        } else {
            handleModalClose();
        }
      }
      return success;
    } catch (error) {
      console.error('Modal submission failed:', error);
      if (error.fieldErrors) {
        setFormApiFieldErrors(error.fieldErrors);
        const apiErrorsMsg = error.fieldErrors.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join('; ');
        message.error(t('messages.apiError', { message: apiErrorsMsg }));
      } else {
        message.error(t('messages.failedToSaveSku', { message: error.message || 'Unknown error' }));
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => { setIsModalOpen(false); setEditingSku(null); setFormApiFieldErrors([]); };
  const handleViewAllModalClose = () => { setIsViewAllModalOpen(false); setViewingSku(null); setFormApiFieldErrors([]); };

  const handleExport = () => {
    const exportFieldsOrder = [
      { header: 'Vendor SKU', dataKey: 'vendor_sku' },
      { header: 'UPC', dataKey: 'UPC' },
      { header: 'Product CN Name', dataKey: 'product_cn_name' },
      { header: 'Product EN Name', dataKey: 'product_en_name' },
      { header: 'Status', dataKey: 'status', type: 'status' },
      { header: 'ATS', dataKey: 'ATS' },
      { header: 'Dropship Price', dataKey: 'dropship_price' },
      { header: 'MSRP$', dataKey: 'MSRP' },
      { header: '$ HDL for Shipping', dataKey: 'HDL_for_shipping' },
      { header: '$ HDL for Receiving', dataKey: 'HDL_for_receiving' },
      { header: '$ HDL for Returning', dataKey: 'HDL_for_returning' },
      { header: '$ Storage Monthly', dataKey: 'storage_monthly' },
      { header: 'Allow Dropship Return', dataKey: 'allow_dropship_return', type: 'booleanToLabel' },
      { header: 'Shipping Lead Time', dataKey: 'shipping_lead_time' },
      { header: 'Division', dataKey: 'division' },
      { header: 'Department', dataKey: 'department' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Subcategory', dataKey: 'sub_category' },
      { header: 'Class', dataKey: 'product_class' },
      { header: 'Group', dataKey: 'group' },
      { header: 'Subgroup', dataKey: 'subgroup' },
      { header: 'Style', dataKey: 'style' },
      { header: 'Substyle', dataKey: 'sub_style' },
      { header: 'Brand', dataKey: 'brand' },
      { header: 'Model', dataKey: 'model' },
      { header: 'Color', dataKey: 'color' },
      { header: 'Size', dataKey: 'size' },
      { header: 'OptionName1', dataKey: 'option_1' },
      { header: 'OptionName2', dataKey: 'option_2' },
      { header: 'OptionName3', dataKey: 'option_3' },
      { header: 'OptionName4', dataKey: 'option_4' },
      { header: 'OptionName5', dataKey: 'option_5' },
      { header: 'Gender', dataKey: 'gender' },
      { header: 'Age Group', dataKey: 'age_group' },
      { header: 'Country Of Origin', dataKey: 'country_of_region' },
      { header: 'Color Code NRF', dataKey: 'color_code_NRF' },
      { header: 'Color Desc', dataKey: 'color_desc' },
      { header: 'Size Code NRF', dataKey: 'size_code_NRF' },
      { header: 'Size Desc', dataKey: 'size_desc' },
      { header: 'Manufacturer', dataKey: 'manufacturer' },
      { header: 'OEM', dataKey: 'OEM' },
      { header: 'Product Year', dataKey: 'product_year' },
      { header: 'Condition', dataKey: 'condition', type: 'condition' },
      { header: 'Prepack #', dataKey: 'prepack_code' },
      { header: 'Remark', dataKey: 'remark' },
      { header: 'Harmonized #', dataKey: 'harmonized_code' },
      { header: 'UOM', dataKey: 'UOM' },
      { header: 'Net Weight', dataKey: 'net_weight' },
      { header: 'Gross Weight', dataKey: 'gross_weight' },
      { header: 'Product Height', dataKey: 'product_height' },
      { header: 'Product Length', dataKey: 'product_length' },
      { header: 'Product Width', dataKey: 'product_width' },
      { header: 'Box Height', dataKey: 'box_height' },
      { header: 'Box Length', dataKey: 'box_length' },
      { header: 'Box Width', dataKey: 'box_width' },
      { header: 'Qty/Case', dataKey: 'qty_case' },
      { header: 'Qty/Box', dataKey: 'qty_box' },
      { header: 'Material Content', dataKey: 'material_content' },
      { header: 'Tags', dataKey: 'tag' },
      { header: 'Care Instructions', dataKey: 'care_instructions' },
      { header: 'Ship From', dataKey: 'ship_from' },
      { header: 'Ship To', dataKey: 'ship_to' },
      { header: 'Ship Carrier', dataKey: 'ship_carrier' },
      { header: 'Shipping Description', dataKey: 'ship_desc' },
      { header: 'Return Policy', dataKey: 'return_policy' },
      { header: 'Security Privacy', dataKey: 'security_privacy' },
      { header: 'Dropship Description', dataKey: 'dropship_desc' },
      { header: 'Title', dataKey: 'title' },
      { header: 'Short Description', dataKey: 'short_desc' },
      { header: 'Long Description', dataKey: 'long_desc' },
      { header: 'Dropship Listing Title', dataKey: 'dropship_listing_title' },
      { header: 'Dropship Short Description', dataKey: 'dropship_short_desc' },
      { header: 'Dropship Long Description', dataKey: 'dropship_long_desc' },
      { header: 'Keywords', dataKey: 'keywords' },
      { header: 'Google Product Category', dataKey: 'google_product_category' },
      { header: 'Google Product Type', dataKey: 'google_product_type' },
      { header: 'Facebook Product Category', dataKey: 'facebook_product_category' },
      { header: 'Color Map', dataKey: 'color_map' },
      { header: 'Key Features 1', dataKey: 'key_features_1' },
      { header: 'Key Features 2', dataKey: 'key_features_2' },
      { header: 'Key Features 3', dataKey: 'key_features_3' },
      { header: 'Key Features 4', dataKey: 'key_features_4' },
      { header: 'Key Features 5', dataKey: 'key_features_5' },
      { header: 'Main Image', dataKey: 'main_image' },
      { header: 'Front Image', dataKey: 'front_image' },
      { header: 'Back Image', dataKey: 'back_image' },
      { header: 'Side Image', dataKey: 'side_image' },
      { header: 'Detail Image', dataKey: 'detail_image' },
      { header: 'Full Image', dataKey: 'full_image' },
      { header: 'Thumbnail Image', dataKey: 'thumbnail_image' },
      { header: 'Size Chart Image', dataKey: 'size_chart_image' },
      { header: 'Swatch Image', dataKey: 'swatch_image' },
      { header: 'Additional Image 1', dataKey: 'additional_image_1' },
      { header: 'Additional Image 2', dataKey: 'additional_image_2' },
      { header: 'Additional Image 3', dataKey: 'additional_image_3' },
      { header: 'Main Video', dataKey: 'main_video' },
      { header: 'Additional Video 1', dataKey: 'additional_video_1' },
      { header: 'Material 1 Name', dataKey: 'material_name_1' },
      { header: 'Material 1 Percentage', dataKey: 'material_1_percentage' },
      { header: 'Material 2 Name', dataKey: 'material_name_2' },
      { header: 'Material 2 Percentage', dataKey: 'material_2_percentage' },
      { header: 'Material 3 Name', dataKey: 'material_name_3' },
      { header: 'Material 3 Percentage', dataKey: 'material_3_percentage' },
      { header: 'Material 4 Name', dataKey: 'material_name_4' },
      { header: 'Material 4 Percentage', dataKey: 'material_4_percentage' },
      { header: 'Material 5 Name', dataKey: 'material_name_5' },
      { header: 'Material 5 Percentage', dataKey: 'material_5_percentage' },
      { header: 'Additional Color 1', dataKey: 'additional_color_1' },
      { header: 'Additional Color 2', dataKey: 'additional_color_2' },
    ];

    const dataToExport = selectedRowKeys.length > 0
      ? dataSource.filter(item => selectedRowKeys.includes(item.key))
      : dataSource;

    if (dataToExport.length === 0) {
      message.warning(t('messages.noDataToExport'));
      return;
    }

    const getLabel = (options, value) => {
      const stringValue = value !== undefined && value !== null ? String(value) : undefined;
      const option = options.find(opt => opt.value === stringValue);
      return option ? option.label : stringValue;
    };

    const sheetData = dataToExport.map(sku => {
      return exportFieldsOrder.map(field => {
        let value = sku[field.dataKey];
        if (field.type === 'status') {
          value = getLabel(statusOptions, value);
        } else if (field.type === 'condition') {
          value = getLabel(conditionOptions, value);
        } else if (field.type === 'booleanToLabel') {
          const valStr = String(sku[field.dataKey]).toLowerCase();
          if (valStr === 'true') {
              value = 'Yes';
          } else if (valStr === 'false') {
              value = 'No';
          } else {
              value = sku[field.dataKey];
          }
        }
        return value !== undefined && value !== null ? value : '';
      });
    });

    const headers = exportFieldsOrder.map(field => field.header);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sheetData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SKUs');

    const now = new Date();
    const timestamp = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    XLSX.writeFile(workbook, `skus_${timestamp}.xlsx`);
    message.success(t('messages.skuExported'));
  };

  // 新增的下载文本文件的辅助函数
  const downloadTxtFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // 清理 URL 对象
  };

  const handleExcelUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setLoading(true);
    setErrorMessages([]);
    try {
      // 创建 FormData 对象
      const formData = new FormData();

      console.log("File object received by handleExcelUpload:", file); //
      // 将文件添加到 FormData 中，字段名应与后端期望的一致，通常是 'file'
      // 根据 sku_api.py 中的定义：file: UploadFile = File(...)，后端期望的字段名是 'file'
      formData.append('file', file);
  
      const response = await uploadSkuCsv(formData); // 传递 FormData 对象
      onSuccess(response, file);
      message.success(t('messages.csvUploadSuccess', { fileName: file.name }));
      fetchSkusWithHandling();

      // 处理后端返回的数据并下载为TXT文件
      if (response) {
        const { success_count, failure_count, failures } = response; //
        let txtContent = `SKU Upload Result for ${file.name}:\n`;
        txtContent += `Success Count: ${success_count}\n`;
        txtContent += `Failure Count: ${failure_count}\n`;
        txtContent += `Failures:\n${JSON.stringify(failures, null, 2)}`; // 格式化 failures 数组

        const now = new Date();
        const timestamp = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        const txtFileName = `SKU_Upload_Result_${timestamp}.txt`;
        
        downloadTxtFile(txtContent, txtFileName); // 调用辅助函数下载文件
      }

    } catch (error) {
      console.error("Excel Upload failed:", error); //
      let errorMessage = `${t('messages.csvUploadFailed', { fileName: file.name })}`; //
      if (error.data && error.data.detail && Array.isArray(error.data.detail)) { //
        const detailedErrors = error.data.detail.map(fe => { //
          const fieldName = fe.loc && fe.loc.length > 1 ? fe.loc[fe.loc.length -1] : t('messages.unknownField'); //
          return `${fieldName}: ${fe.msg}`; //
        }).join('; '); //
        errorMessage += `${t('messages.validationErrors')}${detailedErrors}`; //
         setErrorMessages(prev => [...prev, `${t('messages.validationErrorsInFile', { fileName: file.name })}: ${detailedErrors}`]); //
      } else if (error.message) { //
        errorMessage += error.message; //
         setErrorMessages(prev => [...prev, `${t('messages.uploadError', { fileName: file.name })}: ${error.message}`]); //
      } else { //
        errorMessage += t('messages.unknownUploadError', { fileName: file.name }); //
        setErrorMessages(prev => [...prev, `${t('messages.unknownUploadError', { fileName: file.name })}`]); //
      }
      onError(error); //
      message.error(errorMessage, 10); //
    } finally {
      setLoading(false); //
      if (fileInputRef.current && fileInputRef.current.fileList) { //
        fileInputRef.current.fileList = []; //
      }
    }
  };

  // New function for downloading Vendor Portal Template
  const handleDownloadTemplate = () => {
    // This is the file name you want the downloaded file to have.
    const fileNameForDownload = 'Vendor_Portal_Template.xlsx'; 
    
    // IMPORTANT: You must place your actual XLSX template file in the `public` folder of your Vite project.
    // If your file is named 'Vendor Portal Template(2).xlsx - Sheet1.csv' as provided,
    // and you want to download it as an XLSX, you should ideally convert it to actual XLSX format
    // and rename it to 'Vendor_Portal_Template.xlsx' before placing it in the public folder.
    // Assuming it's in the public folder, its URL will be relative to your app's root.
    const fileUrl = `/${fileNameForDownload}`; 

    try {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', fileNameForDownload); // This attribute suggests a filename for the download
      
      // Append the link to the document body, programmatically click it, then remove it.
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(t('messages.templateDownloadStarted'));
    } catch (error) {
      console.error('Download template failed:', error);
      message.error(t('messages.failedToDownloadTemplate'));
    }
  };

  // Filter data source to support search function
  const filteredDataSource = dataSource.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  // 路由守卫组件
  function RequireAdmin({ children }) {
    const location = useLocation();
    if (!isLoggedIn) {
      return <Navigate to="/" replace state={{ from: location }} />;
    }
    if (userRole !== 'admin') {
      return <Navigate to="/" replace state={{ from: location, noPermission: true }} />;
    }
    return children;
  }

  if (!isLoggedIn) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <ConfigProvider locale={antdLocales[i18n.language] || zhCN}>
      <Routes>
        <Route path="/" element={
          isLoggedIn ? (
            <div className={`App ${i18n.language === 'zh' ? 'lang-zh' : ''}`}>
              <div className="header-container">
                  <div className="logo-title-container">
                      <img src={JFJPLogo} alt="JFJP Logo" className="header-logo" />
                      <h1 className={`header-title ${i18n.language === 'zh' ? 'zh' : ''}`}>{t('systemTitle')}</h1>
                  </div>
                  <div className="header-right">
                      {/* New official website link */}
                      <a
                          href="https://xuanzi2023.wixsite.com/jfjp"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginRight: '15px', color: '#666', textDecoration: 'none' }}
                      >
                          {t('officialWebsite')}
                      </a>
                      {/* 添加分割线 */}
                      <Divider type="vertical" style={{ height: '20px', borderColor: '#ccc' }} /> 
                      {/* Language toggle button */}
                      <Space className="language-selector">
                          <Button
                              onClick={toggleLanguage}
                              size="small"
                          >
                              {i18n.language === 'en' ? '中文' : 'EN'}
                          </Button>
                      </Space>
                      {userRole === 'admin' && (
                        <Link to="/admin" style={{ marginRight: 8 }}>
                          <Button>{t('Admin Panel') || '管理员界面'}</Button>
                        </Link>
                      )}
                      <Link to="/account" style={{ marginRight: 8 }}>
                        <Button>{t('My Account') || '我的账号'}</Button>
                      </Link>
                      <Button onClick={handleLogout} type="default">{t('Sign Out')}</Button>
                  </div>
              </div>

              {errorMessages.length > 0 && (
                <Alert
                  message={t('operationInfoErrors')}
                  description={
                    <ul style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {errorMessages.map((msg, index) => (
                        <li key={index}>{msg}</li>
                      ))}
                    </ul>
                  }
                  type="error"
                  closable
                  onClose={() => setErrorMessages([])}
                  style={{ marginBottom: 16 }}
                />
              )}
              <div className="table-actions-container">
                  <Space className="table-top-buttons">
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingSku(null); setIsModalOpen(true); }}>
                          {t('createSkuModal')}
                      </Button>
                      <Upload
                          ref={fileInputRef}
                          customRequest={handleExcelUpload} // 从 handleCsvUpload 更改为 handleExcelUpload
                          showUploadList={false}
                          accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // 修改 accept 属性以包含 .xls 和 .xlsx
                          name="file">
                          <Button icon={<UploadOutlined />}>{t('uploadCsv')}</Button> {/* 这里的文本会在i18n中修改 */}
                      </Upload>
                      {/* 新添加的"Vendor Portal Template"按钮 */}
                      <Button icon={<ExportOutlined />} onClick={handleDownloadTemplate}>
                          {t('vendorPortalTemplate')}
                      </Button>
                      <Button icon={<ExportOutlined />} onClick={handleExport}>
                          {t('exportAll')}
                      </Button>
                      {/* Place search bar here */}
                      <div className="search-bar-container">
                          <Input
                              prefix={<SearchOutlined />}
                              placeholder={t('searchPlaceholder')}
                              value={searchText}
                              onChange={e => setSearchText(e.target.value)}
                              style={{ width: 300 }}
                          />
                      </div>
                  </Space>
              </div>

              <Form form={form} component={false} onValuesChange={handleInlineFormValuesChange}>
                <Table
                  rowSelection={rowSelection}
                  components={{
                    body: {
                      cell: EditableCell,
                    },
                  }}
                  columns={getTableColumns()}
                  dataSource={filteredDataSource}
                  loading={loading}
                  scroll={{ x: 'max-content', y: '60vh' }}
                  bordered
                  rowKey="key"
                  pagination={{
                      onChange: cancel,
                      pageSizeOptions: ['15', '20', '50', '100', '200'],
                      showSizeChanger: true,
                      defaultPageSize: 15,
                      showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} ${t('common.records')}`,
                    }}
                  footer={() => (
                    <div style={{ textAlign: 'center' }}>
                      <Button type="default" icon={<PlusOutlined />} onClick={handleAddInline}>
                        {t('Table Footer Add Inline')}
                      </Button>
                    </div>
                  )}
                />
              </Form>
              <SkuFormModal
                visible={isModalOpen}
                onClose={handleModalClose}
                onSubmit={(values) => handleModalSubmit(values, editingSku)}
                initialData={editingSku}
                fieldsConfig={fieldsConfig}
                statusOptions={statusOptions}
                conditionOptions={conditionOptions}
                apiFieldErrors={formApiFieldErrors}
                showAllMode={true}
              />
              <SkuFormModal
                visible={isViewAllModalOpen}
                onClose={handleViewAllModalClose}
                onSubmit={(values) => handleModalSubmit(values, viewingSku)}
                initialData={viewingSku}
                fieldsConfig={fieldsConfig}
                statusOptions={statusOptions}
                conditionOptions={conditionOptions}
                apiFieldErrors={formApiFieldErrors}
                showAllMode={true}
              />
              {/* Existing copyright information */}
              <footer style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
                © {new Date().getFullYear()} by JFJP.
              </footer>
            </div>
          ) : (
            <AuthForm onAuthSuccess={handleAuthSuccess} />
          )
        } />
        <Route path="/admin" element={
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        } />
        <Route path="/account" element={<AccountPage userInfo={userInfo} t={t} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ConfigProvider>
  );
};

export default App;