// src/App.jsx
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Table, ConfigProvider, Button, message, Upload, Space, Popconfirm, Alert, Form, Input } from 'antd';
import * as XLSX from 'xlsx';
import { fieldsConfig, statusOptions, conditionOptions } from './components/fieldConfig';
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ExportOutlined, SaveOutlined, CloseOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import SkuFormModal from './components/SkuFormModal';
import EditableCell from './components/EditableCell';
import { getAllSkus, createSku, updateSku, deleteSku, uploadSkuCsv } from './services/skuApiService';
import AuthForm from './components/AuthForm';

// 导入 Ant Design 语言包
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

// 导入 useTranslation
import { useTranslation } from 'react-i18next';

// 假设图片中的 Logo 是一个本地图片，或者你可以替换为CDN链接
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

  // 新增登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Ant Design 语言包映射
  const antdLocales = {
    en: enUS,
    zh: zhCN,
  };

  // 检查本地存储中的 token，判断用户是否已登录
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
      fetchSkusWithHandling();
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
      setDataSource(data.map(item => ({ ...item, key: item.id })));
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

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    fetchSkusWithHandling();
    message.success(t('messages.loggedIn'));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
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
      // 初始化时将 null 或 undefined 的 URL 字段设置为空字符串
      if (field.type === 'url' && (initialValues[field.name] === null || initialValues[field.name] === undefined)) {
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
          // **修改**：如果 URL 字段为空字符串、undefined 或 null，将其设置为 null
          if (field.type === 'url') {
            if (updatedItem[field.name] === null || updatedItem[field.name] === undefined || String(updatedItem[field.name]).trim() === '') {
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
            if (field.defaultValue !== undefined) {
                selectDefault = field.defaultValue;
            } else if (field.options && field.options.length > 0) {
                selectDefault = field.options[0].value;
            }
            acc[field.name] = selectDefault;
        } else if (field.type === 'url') {
            acc[field.name] = ''; // URL字段默认显示为空字符串，而不是null
        } else {
            if (field.isMandatory) {
                acc[field.name] = '';
            } else {
                acc[field.name] = null;
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
        // **修改**：如果 URL 字段为空字符串、undefined 或 null，将其设置为 null
        if (field.type === 'url') {
          if (submissionValues[field.name] === null || submissionValues[field.name] === undefined || String(submissionValues[field.name]).trim() === '') {
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
      { header: t('field.vendor_sku'), dataKey: 'vendor_sku' },
      { header: t('field.UPC'), dataKey: 'UPC' },
      { header: t('field.product_en_name'), dataKey: 'product_en_name' },
      { header: t('field.product_cn_name'), dataKey: 'product_cn_name' },
      { header: t('field.status'), dataKey: 'status', type: 'status' },
      { header: t('field.ATS'), dataKey: 'ATS' },
      { header: t('field.dropship_price'), dataKey: 'dropship_price' },
      { header: t('field.MSRP'), dataKey: 'MSRP' },
      { header: t('field.HDL_for_shipping'), dataKey: 'HDL_for_shipping' },
      { header: t('field.HDL_for_receiving'), dataKey: 'HDL_for_receiving' },
      { header: t('field.HDL_for_returning'), dataKey: 'HDL_for_returning' },
      { header: t('field.storage_monthly'), dataKey: 'storage_monthly' },
      { header: t('field.allow_dropship_return'), dataKey: 'allow_dropship_return', type: 'booleanToLabel' },
      { header: t('field.shipping_lead_time'), dataKey: 'shipping_lead_time' },
      { header: t('field.division'), dataKey: 'division' },
      { header: t('field.department'), dataKey: 'department' },
      { header: t('field.category'), dataKey: 'category' },
      { header: t('field.sub_category'), dataKey: 'sub_category' },
      { header: t('field.product_class'), dataKey: 'product_class' },
      { header: t('field.group'), dataKey: 'group' },
      { header: t('field.subgroup'), dataKey: 'subgroup' },
      { header: t('field.style'), dataKey: 'style' },
      { header: t('field.sub_style'), dataKey: 'sub_style' },
      { header: t('field.brand'), dataKey: 'brand' },
      { header: t('field.model'), dataKey: 'model' },
      { header: t('field.color'), dataKey: 'color' },
      { header: t('field.size'), dataKey: 'size' },
      { header: t('field.option_1'), dataKey: 'option_1' },
      { header: t('field.option_2'), dataKey: 'option_2' },
      { header: t('field.option_3'), dataKey: 'option_3' },
      { header: t('field.option_4'), dataKey: 'option_4' },
      { header: t('field.option_5'), dataKey: 'option_5' },
      { header: t('field.gender'), dataKey: 'gender' },
      { header: t('field.age_group'), dataKey: 'age_group' },
      { header: t('field.country_of_region'), dataKey: 'country_of_region' },
      { header: t('field.color_code_NRF'), dataKey: 'color_code_NRF' },
      { header: t('field.color_desc'), dataKey: 'color_desc' },
      { header: t('field.size_code_NRF'), dataKey: 'size_code_NRF' },
      { header: t('field.size_desc'), dataKey: 'size_desc' },
      { header: t('field.manufacturer'), dataKey: 'manufacturer' },
      { header: t('field.OEM'), dataKey: 'OEM' },
      { header: t('field.product_year'), dataKey: 'product_year' },
      { header: t('field.condition'), dataKey: 'condition', type: 'condition' },
      { header: t('field.prepack_code'), dataKey: 'prepack_code' },
      { header: t('field.remark'), dataKey: 'remark' },
      { header: t('field.harmonized_code'), dataKey: 'harmonized_code' },
      { header: t('field.UOM'), dataKey: 'UOM' },
      { header: t('field.net_weight'), dataKey: 'net_weight' },
      { header: t('field.gross_weight'), dataKey: 'gross_weight' },
      { header: t('field.product_height'), dataKey: 'product_height' },
      { header: t('field.product_length'), dataKey: 'product_length' },
      { header: t('field.product_width'), dataKey: 'product_width' },
      { header: t('field.box_height'), dataKey: 'box_height' },
      { header: t('field.box_length'), dataKey: 'box_length' },
      { header: t('field.box_width'), dataKey: 'box_width' },
      { header: t('field.qty_case'), dataKey: 'qty_case' },
      { header: t('field.qty_box'), dataKey: 'qty_box' },
      { header: t('field.material_content'), dataKey: 'material_content' },
      { header: t('field.tag'), dataKey: 'tag' },
      { header: t('field.care_instructions'), dataKey: 'care_instructions' },
      { header: t('field.ship_from'), dataKey: 'ship_from' },
      { header: t('field.ship_to'), dataKey: 'ship_to' },
      { header: t('field.ship_carrier'), dataKey: 'ship_carrier' },
      { header: t('field.ship_desc'), dataKey: 'ship_desc' },
      { header: t('field.return_policy'), dataKey: 'return_policy' },
      { header: t('field.security_privacy'), dataKey: 'security_privacy' },
      { header: t('field.dropship_desc'), dataKey: 'dropship_desc' },
      { header: t('field.title'), dataKey: 'title' },
      { header: t('field.short_desc'), dataKey: 'short_desc' },
      { header: t('field.long_desc'), dataKey: 'long_desc' },
      { header: t('field.dropship_listing_title'), dataKey: 'dropship_listing_title' },
      { header: t('field.dropship_short_desc'), dataKey: 'dropship_short_desc' },
      { header: t('field.dropship_long_desc'), dataKey: 'dropship_long_desc' },
      { header: t('field.keywords'), dataKey: 'keywords' },
      { header: t('field.google_product_category'), dataKey: 'google_product_category' },
      { header: t('field.google_product_type'), dataKey: 'google_product_type' },
      { header: t('field.facebook_product_category'), dataKey: 'facebook_product_category' },
      { header: t('field.color_map'), dataKey: 'color_map' },
      { header: t('field.key_features_1'), dataKey: 'key_features_1' },
      { header: t('field.key_features_2'), dataKey: 'key_features_2' },
      { header: t('field.key_features_3'), dataKey: 'key_features_3' },
      { header: t('field.key_features_4'), dataKey: 'key_features_4' },
      { header: t('field.key_features_5'), dataKey: 'key_features_5' },
      { header: t('field.main_image'), dataKey: 'main_image' },
      { header: t('field.front_image'), dataKey: 'front_image' },
      { header: t('field.back_image'), dataKey: 'back_image' },
      { header: t('field.side_image'), dataKey: 'side_image' },
      { header: t('field.detail_image'), dataKey: 'detail_image' },
      { header: t('field.full_image'), dataKey: 'full_image' },
      { header: t('field.thumbnail_image'), dataKey: 'thumbnail_image' },
      { header: t('field.size_chart_image'), dataKey: 'size_chart_image' },
      { header: t('field.swatch_image'), dataKey: 'swatch_image' },
      { header: t('field.additional_image_1'), dataKey: 'additional_image_1' },
      { header: t('field.additional_image_2'), dataKey: 'additional_image_2' },
      { header: t('field.additional_image_3'), dataKey: 'additional_image_3' },
      { header: t('field.main_video'), dataKey: 'main_video' },
      { header: t('field.additional_video_1'), dataKey: 'additional_video_1' },
      { header: t('field.material_name_1'), dataKey: 'material_name_1' },
      { header: t('field.material_1_percentage'), dataKey: 'material_1_percentage' },
      { header: t('field.material_name_2'), dataKey: 'material_name_2' },
      { header: t('field.material_2_percentage'), dataKey: 'material_2_percentage' },
      { header: t('field.material_name_3'), dataKey: 'material_name_3' },
      { header: t('field.material_3_percentage'), dataKey: 'material_3_percentage' },
      { header: t('field.material_name_4'), dataKey: 'material_name_4' },
      { header: t('field.material_4_percentage'), dataKey: 'material_4_percentage' },
      { header: t('field.material_name_5'), dataKey: 'material_name_5' },
      { header: t('field.material_5_percentage'), dataKey: 'material_5_percentage' },
      { header: t('field.additional_color_1'), dataKey: 'additional_color_1' },
      { header: t('field.additional_color_2'), dataKey: 'additional_color_2' },
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

  const handleCsvUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setLoading(true);
    setErrorMessages([]);
    try {
      const response = await uploadSkuCsv(file);
      onSuccess(response, file);
      message.success(t('messages.csvUploadSuccess', { fileName: file.name }));
      fetchSkusWithHandling();
    } catch (error) {
      console.error("CSV Upload failed:", error);
      let errorMessage = `${t('messages.csvUploadFailed', { fileName: file.name })}`;
      if (error.fieldErrors) {
        const detailedErrors = error.fieldErrors.map(fe => {
          const fieldName = fe.loc && fe.loc.length > 1 ? fe.loc[fe.loc.length -1] : t('messages.unknownField');
          return `${fieldName}: ${fe.msg}`;
        }).join('; ');
        errorMessage += `${t('messages.validationErrors')}${detailedErrors}`;
         setErrorMessages(prev => [...prev, `${t('messages.validationErrorsInFile', { fileName: file.name })}: ${detailedErrors}`]);
      } else if (error.message) {
        errorMessage += error.message;
         setErrorMessages(prev => [...prev, `${t('messages.uploadError', { fileName: file.name })}: ${error.message}`]);
      } else {
        errorMessage += t('messages.unknownUploadError', { fileName: file.name });
        setErrorMessages(prev => [...prev, `${t('messages.unknownUploadError', { fileName: file.name })}`]);
      }
      onError(error);
      message.error(errorMessage, 10);
    } finally {
      setLoading(false);
      if (fileInputRef.current && fileInputRef.current.fileList) {
        fileInputRef.current.fileList = [];
      }
    }
  };

  // 过滤数据源以支持搜索功能
  const filteredDataSource = dataSource.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  if (!isLoggedIn) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <ConfigProvider locale={antdLocales[i18n.language]}>
      {/* 添加 classname 根据语言动态调整表格头部对齐 */}
      <div className={`App ${i18n.language === 'zh' ? 'lang-zh' : ''}`}>
        <div className="header-container">
            <div className="logo-title-container">
                <img src={JFJPLogo} alt="JFJP Logo" className="header-logo" />
                <h1 className={`header-title ${i18n.language === 'zh' ? 'zh' : ''}`}>{t('systemTitle')}</h1>
            </div>
            <div className="header-right">
                {/* 新增官网链接 */}
                <a
                    href="https://xuanzi2023.wixsite.com/jfjp"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginRight: '15px', color: '#666', textDecoration: 'none' }}
                >
                    {t('officialWebsite')}
                </a>
                {/* 语言切换按钮 */}
                <Space className="language-selector">
                    <Button
                        onClick={toggleLanguage}
                        size="small"
                    >
                        {i18n.language === 'en' ? '中文' : 'EN'}
                    </Button>
                </Space>
                <Button onClick={handleLogout} type="default">{t('logout')}</Button>
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
                    customRequest={handleCsvUpload}
                    showUploadList={false}
                    accept=".csv"
                >
                    <Button icon={<UploadOutlined />}>{t('uploadCsv')}</Button>
                </Upload>
                <Button icon={<ExportOutlined />} onClick={handleExport}>
                    {t('exportAll')}
                </Button>
                {/* 将搜索框放到这里 */}
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
                  {t('tableFooterAddInline')}
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
        {/* 现有版权信息 */}
        <footer style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          © {new Date().getFullYear()} by JFJP.
        </footer>
      </div>
    </ConfigProvider>
  );
};

export default App;