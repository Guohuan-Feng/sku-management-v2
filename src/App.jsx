// src/App.jsx
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Table, ConfigProvider, Button, message, Upload, Space, Popconfirm, Alert, Form, Input } from 'antd'; // 引入 Input 用于搜索框
import zhCN from 'antd/locale/zh_CN';
import * as XLSX from 'xlsx';
import { fieldsConfig, statusOptions, conditionOptions } from './components/fieldConfig';
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ExportOutlined, SaveOutlined, CloseOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons'; // 引入 SearchOutlined
import SkuFormModal from './components/SkuFormModal';
import EditableCell from './components/EditableCell';
import { getAllSkus, createSku, updateSku, deleteSku, uploadSkuCsv } from './services/skuApiService';
import AuthForm from './components/AuthForm';

// 假设图片中的 Logo 是一个本地图片，或者你可以替换为CDN链接
import JFJPLogo from '/JFJP_logo.png'; // 假设你有一个 JFJP_logo.png 在 public 目录下

const App = () => {
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
  const [searchText, setSearchText] = useState(''); // 新增搜索文本状态

  // 新增登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查本地存储中的 token，判断用户是否已登录
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
      fetchSkusWithHandling(); // 如果已登录，则加载 SKU 数据
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
      message.success('SKU data loaded successfully!');
    } catch (error) {
      console.error("Failed to fetch SKUs:", error);
      message.error(`Failed to fetch SKUs: ${error.message}`);
      setErrorMessages(prev => [...prev, `Failed to fetch SKUs: ${error.message}`]);
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    fetchSkusWithHandling(); // 登录成功后加载数据
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    setDataSource([]); // 清空数据
    message.info('您已退出登录。');
  };

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    if (editingKey && editingKey !== record.key) {
      message.warning('Please save or cancel the current editing row before editing another!');
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
      });

      const { key: _, ...apiPayload } = updatedItem;

      if (String(key).startsWith('new-temp-id')) {
        await createSku(apiPayload);
        message.success('SKU created successfully!');
      } else {
        await updateSku(apiPayload.id, apiPayload);
        message.success('SKU updated successfully!');
      }

      fetchSkusWithHandling();
      setEditingKey('');
      setEditingRowData({});
    } catch (errInfo) {
      console.error('Validate Failed (Save Inline):', errInfo);
      if (errInfo.errorFields) {
        message.error('Please fix validation errors in the form.');
      } else if (errInfo.fieldErrors && Array.isArray(errInfo.fieldErrors)) {
        setFormApiFieldErrors(errInfo.fieldErrors);
        const apiErrorsMsg = errInfo.fieldErrors.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join('; ');
        message.error(`API Error: ${apiErrorsMsg}`);
      } else {
        message.error(`Failed to save SKU: ${errInfo.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTableColumns = () => {
    // 调整显示字段以匹配图片，并确保所有 mandatoryFieldsFromCSV 中的字段都在这里
    // 优先使用图片中的顺序，然后补充其他重要字段
    const orderedDisplayFields = [
      'vendor_sku', 'UPC', 'product_en_name', 'product_cn_name',
      'dropship_price', 'brand',
      // 以下字段在图片中未直接显示，但为了完整性，通常表格会包含
      // 如果你希望表格更精简，可以移除这些
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
          title: field.label,
          dataIndex: field.name,
          key: field.name,
          width: field.name === 'vendor_sku' ? 180 : (field.type === 'textarea' || field.name.toLowerCase().includes('desc') ? 250 : 150),
          fixed: field.name === 'vendor_sku' ? 'left' : undefined,
          ellipsis: true,
          render: (text, record) => { // 添加 render 方法来处理可编辑单元格的显示
            const editable = isEditing(record);
            return editable ? (
              <EditableCell
                editing={editable}
                dataIndex={field.name}
                inputType={field.type}
                record={record}
                title={field.label}
              >
                {text}
              </EditableCell>
            ) : (
              text
            );
          },
          onCell: (record) => ({ // onCell 用于传递 props 给 EditableCell
            record,
            inputType: field.type,
            dataIndex: field.name,
            title: field.label,
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
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      fixed: 'right',
      width: 180,
      render: (_, record) => {
        const editable = isEditing(record);

        return editable ? (
          <Space size="small">
            <Button type="link" icon={<SaveOutlined />} onClick={() => save(record.key)} loading={loading}>
              Save
            </Button>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <Button type="link" icon={<CloseOutlined />} danger>
                Cancel
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          <Space size="small">
            <Button icon={<EditOutlined />} onClick={() => edit(record)} type="link">Edit</Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setViewingSku(record);
                setIsViewAllModalOpen(true);
              }}
              type="link"
            >
              Show All
            </Button>
            <Popconfirm
              title="Are you sure to delete this SKU?"
              onConfirm={() => handleDelete(record.key)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} type="link" danger>Delete</Button>
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
      message.warning('Please save or cancel the current editing row first!');
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
            acc[field.name] = null;
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
        message.success('New SKU discarded!');
      } else {
        const skuToDelete = dataSource.find(item => item.key === skuIdToDelete);
        if (!skuToDelete || String(skuToDelete.id).startsWith('new-temp-id')) {
            message.error('Cannot delete. SKU ID not found or is a temporary ID.');
            setLoading(false);
            return;
        }
        await deleteSku(skuToDelete.id);
        message.success('SKU deleted successfully!');
        fetchSkusWithHandling();
      }
      setSelectedRowKeys(prevKeys => prevKeys.filter(k => k !== skuIdToDelete));
    } catch (error) {
      console.error('Failed to delete SKU:', error);
      message.error(`Failed to delete SKU: ${error.message}`);
      setErrorMessages(prev => [...prev, `Failed to delete SKU ID ${skuIdToDelete}: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select SKUs to delete first!');
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
             currentErrors.push(`SKU with key ${skuKey} not found or is an unsaved new item.`);
          }
        }
      } catch (error) {
        console.error(`Failed to delete SKU with key ${skuKey}:`, error);
        currentErrors.push(`Failed to delete SKU with key ${skuKey}: ${error.message}`);
      }
    }

    setLoading(false);
    if (successCount > 0) {
      message.success(`Successfully deleted ${successCount} SKUs!`);
    }
    if (currentErrors.length > 0) {
      setErrorMessages(prev => [...prev, ...currentErrors]);
      message.error(`There were ${currentErrors.length} SKUs that failed to delete or were already removed. Please check prompts.`);
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
      });

      if (initialDataParam && initialDataParam.id && !String(initialDataParam.id).startsWith('new-temp-id')) {
        await updateSku(initialDataParam.id, submissionValues);
        message.success('SKU updated successfully!');
        success = true;
      } else {
        const { id: tempId, ...payload } = submissionValues;
        await createSku(payload);
        message.success('SKU created successfully!');
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
        message.error(`API Error: ${apiErrorsMsg}`);
      } else {
        message.error(`Failed to save SKU: ${error.message || 'Unknown error'}`);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => { setIsModalOpen(false); setEditingSku(null); setFormApiFieldErrors([]); };
  const handleViewAllModalClose = () => { setIsViewAllModalOpen(false); setViewingSku(null); setFormApiFieldErrors([]); };

  const handleExport = () => {
    // These fields and their order are derived from your src/components/108.txt and src/components/requirefiled.txt, combined for a comprehensive export.
    const exportFieldsOrder = [
      { header: 'Vendor SKU', dataKey: 'vendor_sku' }, //
      { header: 'UPC', dataKey: 'UPC' }, //
      { header: 'Product EN Name', dataKey: 'product_en_name' }, //
      { header: 'Product CN Name', dataKey: 'product_cn_name' }, //
      { header: 'Status', dataKey: 'status', type: 'status' }, //
      { header: 'ATS', dataKey: 'ATS' }, //
      { header: 'Dropship Price', dataKey: 'dropship_price' }, //
      { header: 'MSRP$', dataKey: 'MSRP' }, //
      { header: '$ HDL for Shipping', dataKey: 'HDL_for_shipping' }, //
      { header: '$ HDL for Receiving', dataKey: 'HDL_for_receiving' }, //
      { header: '$ HDL for Returning', dataKey: 'HDL_for_returning' }, //
      { header: '$ Storage Monthly', dataKey: 'storage_monthly' }, //
      { header: 'Allow Dropship Return', dataKey: 'allow_dropship_return', type: 'booleanToLabel' }, //
      { header: 'Shipping Lead Time', dataKey: 'shipping_lead_time' }, //
      { header: 'Division', dataKey: 'division' }, //
      { header: 'Department', dataKey: 'department' }, //
      { header: 'Category', dataKey: 'category' }, //
      { header: 'Subcategory', dataKey: 'sub_category' }, //
      { header: 'Class', dataKey: 'product_class' }, //
      { header: 'Group', dataKey: 'group' }, //
      { header: 'Subgroup', dataKey: 'subgroup' }, //
      { header: 'Style', dataKey: 'style' }, //
      { header: 'Substyle', dataKey: 'sub_style' }, //
      { header: 'Brand', dataKey: 'brand' }, //
      { header: 'Model', dataKey: 'model' }, //
      { header: 'Color', dataKey: 'color' }, //
      { header: 'Size', dataKey: 'size' }, //
      { header: 'OptionName1', dataKey: 'option_1' }, //
      { header: 'OptionName2', dataKey: 'option_2' }, //
      { header: 'OptionName3', dataKey: 'option_3' }, //
      { header: 'OptionName4', dataKey: 'option_4' }, //
      { header: 'OptionName5', dataKey: 'option_5' }, //
      { header: 'Gender', dataKey: 'gender' }, //
      { header: 'Age Group', dataKey: 'age_group' }, //
      { header: 'Country Of Origin', dataKey: 'country_of_region' }, //
      { header: 'Color Code NRF', dataKey: 'color_code_NRF' }, //
      { header: 'Color Desc', dataKey: 'color_desc' }, //
      { header: 'Size Code NRF', dataKey: 'size_code_NRF' }, //
      { header: 'Size Desc', dataKey: 'size_desc' }, //
      { header: 'Manufacturer', dataKey: 'manufacturer' }, //
      { header: 'OEM', dataKey: 'OEM' }, //
      { header: 'Product Year', dataKey: 'product_year' }, //
      { header: 'Condition', dataKey: 'condition', type: 'condition' }, //
      { header: 'Prepack #', dataKey: 'prepack_code' }, //
      { header: 'Remark', dataKey: 'remark' }, //
      { header: 'Harmonized #', dataKey: 'harmonized_code' }, //
      { header: 'UOM', dataKey: 'UOM' }, //
      { header: 'Net Weight', dataKey: 'net_weight' }, //
      { header: 'Gross Weight', dataKey: 'gross_weight' }, //
      { header: 'Product Height', dataKey: 'product_height' }, //
      { header: 'Product Length', dataKey: 'product_length' }, //
      { header: 'Product Width', dataKey: 'product_width' }, //
      { header: 'Box Height', dataKey: 'box_height' }, //
      { header: 'Box Length', dataKey: 'box_length' }, //
      { header: 'Box Width', dataKey: 'box_width' }, //
      { header: 'Qty/Case', dataKey: 'qty_case' }, //
      { header: 'Qty/Box', dataKey: 'qty_box' }, //
      { header: 'Material Content', dataKey: 'material_content' }, //
      { header: 'Tags', dataKey: 'tag' }, //
      { header: 'Care Instructions', dataKey: 'care_instructions' }, //
      { header: 'Ship From', dataKey: 'ship_from' }, //
      { header: 'Ship To', dataKey: 'ship_to' }, //
      { header: 'Ship Carrier', dataKey: 'ship_carrier' }, //
      { header: 'Shipping Description', dataKey: 'ship_desc' }, //
      { header: 'Return Policy', dataKey: 'return_policy' }, //
      { header: 'Security Privacy', dataKey: 'security_privacy' }, //
      { header: 'Dropship Description', dataKey: 'dropship_desc' }, //
      { header: 'Title', dataKey: 'title' }, //
      { header: 'Short Description', dataKey: 'short_desc' }, //
      { header: 'Long Description', dataKey: 'long_desc' }, //
      { header: 'Dropship Listing Title', dataKey: 'dropship_listing_title' }, //
      { header: 'Dropship Short Description', dataKey: 'dropship_short_desc' }, //
      { header: 'Dropship Long Description', dataKey: 'dropship_long_desc' }, //
      { header: 'Keywords', dataKey: 'keywords' }, //
      { header: 'Google Product Category', dataKey: 'google_product_category' }, //
      { header: 'Google Product Type', dataKey: 'google_product_type' }, //
      { header: 'Facebook Product Category', dataKey: 'facebook_product_category' }, //
      { header: 'Color Map', dataKey: 'color_map' }, //
      { header: 'Key Features 1', dataKey: 'key_features_1' }, //
      { header: 'Key Features 2', dataKey: 'key_features_2' }, //
      { header: 'Key Features 3', dataKey: 'key_features_3' }, //
      { header: 'Key Features 4', dataKey: 'key_features_4' }, //
      { header: 'Key Features 5', dataKey: 'key_features_5' }, //
      { header: 'Main Image', dataKey: 'main_image' }, //
      { header: 'Front Image', dataKey: 'front_image' }, //
      { header: 'Back Image', dataKey: 'back_image' }, //
      { header: 'Side Image', dataKey: 'side_image' }, //
      { header: 'Detail Image', dataKey: 'detail_image' }, //
      { header: 'Full Image', dataKey: 'full_image' }, //
      { header: 'Thumbnail Image', dataKey: 'thumbnail_image' }, //
      { header: 'Size Chart Image', dataKey: 'size_chart_image' }, //
      { header: 'Swatch Image', dataKey: 'swatch_image' }, //
      { header: 'Additional Image 1', dataKey: 'additional_image_1' }, //
      { header: 'Additional Image 2', dataKey: 'additional_image_2' }, //
      { header: 'Additional Image 3', dataKey: 'additional_image_3' }, //
      { header: 'Main Video', dataKey: 'main_video' }, //
      { header: 'Additional Video 1', dataKey: 'additional_video_1' }, //
      { header: 'Material 1 Name', dataKey: 'material_name_1' }, //
      { header: 'Material 1 Percentage', dataKey: 'material_1_percentage' }, //
      { header: 'Material 2 Name', dataKey: 'material_name_2' }, //
      { header: 'Material 2 Percentage', dataKey: 'material_2_percentage' }, //
      { header: 'Material 3 Name', dataKey: 'material_name_3' }, //
      { header: 'Material 3 Percentage', dataKey: 'material_3_percentage' }, //
      { header: 'Material 4 Name', dataKey: 'material_name_4' }, //
      { header: 'Material 4 Percentage', dataKey: 'material_4_percentage' }, //
      { header: 'Material 5 Name', dataKey: 'material_name_5' }, //
      { header: 'Material 5 Percentage', dataKey: 'material_5_percentage' }, //
      { header: 'Additional Color 1', dataKey: 'additional_color_1' }, //
      { header: 'Additional Color 2', dataKey: 'additional_color_2' }, //
    ];

    const dataToExport = selectedRowKeys.length > 0
      ? dataSource.filter(item => selectedRowKeys.includes(item.key))
      : dataSource;

    if (dataToExport.length === 0) {
      message.warning('No data to export.');
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
    // 使用非 LaTeX 格式
    const timestamp = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    XLSX.writeFile(workbook, `skus_${timestamp}.xlsx`);
    message.success('SKU data exported successfully!');
  };

  const handleCsvUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setLoading(true);
    setErrorMessages([]);
    try {
      const response = await uploadSkuCsv(file);
      onSuccess(response, file);
      message.success(`${file.name} uploaded and processed successfully!`);
      fetchSkusWithHandling();
    } catch (error) {
      console.error("CSV Upload failed:", error);
      let errorMessage = `Failed to upload ${file.name}: `;
      if (error.fieldErrors && Array.isArray(error.fieldErrors)) {
        const detailedErrors = error.fieldErrors.map(fe => {
          const fieldName = fe.loc && fe.loc.length > 1 ? fe.loc[fe.loc.length -1] : 'Unknown field';
          return `${fieldName}: ${fe.msg}`;
        }).join('; ');
        errorMessage += `Validation errors: ${detailedErrors}`;
         setErrorMessages(prev => [...prev, `Validation errors in ${file.name}: ${detailedErrors}`]);
      } else if (error.message) {
        errorMessage += error.message;
         setErrorMessages(prev => [...prev, `Upload error for ${file.name}: ${error.message}`]);
      } else {
        errorMessage += 'Unknown error during upload.';
        setErrorMessages(prev => [...prev, `Upload error for ${file.name}: Unknown error.`]);
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


  if (!isLoggedIn) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <ConfigProvider locale={zhCN}>
      <div className="App">
        <div className="header-container"> {/* 新增容器用于 Logo, Title, Logout */}
            <div className="logo-title-container">
                <img src={JFJPLogo} alt="JFJP Logo" className="header-logo" />
                <h1 className="header-title">SKU Management System</h1>
            </div>
            <div className="header-right">
                <span className="language-selector">EN / 中文</span> {/* 图片中的语言切换 */}
                <Button onClick={handleLogout} type="default">退出登录</Button>
            </div>
        </div>

        {errorMessages.length > 0 && (
          <Alert
            message="Operation Information / Errors"
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
        <div className="table-actions-container"> {/* 新增容器用于操作按钮和搜索框 */}
            <Space className="table-top-buttons">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingSku(null); setIsModalOpen(true); }}>
                    Create SKU (Modal)
                </Button>
                <Upload
                    ref={fileInputRef}
                    customRequest={handleCsvUpload}
                    showUploadList={false}
                    accept=".csv"
                >
                    <Button icon={<UploadOutlined />}>Upload CSV</Button>
                </Upload>
                <Button icon={<ExportOutlined />} onClick={handleExport}>
                    Export All
                </Button>
                {/* 图片中没有这个按钮，暂时移除
                {selectedRowKeys.length > 0 && (
                    <Popconfirm
                        title={`Are you sure to delete ${selectedRowKeys.length} selected SKUs?`}
                        onConfirm={handleDeleteSelected}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger icon={<DeleteOutlined />}>
                            Delete Selected ({selectedRowKeys.length})
                        </Button>
                    </Popconfirm>
                )}
                */}
            </Space>
            <div className="search-bar-container">
                <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search by SKU, UPC, or Name"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 300 }} // 调整搜索框宽度
                />
                {/* 图片中没有右侧的筛选器，暂时移除 */}
            </div>
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
            dataSource={filteredDataSource} // 使用过滤后的数据源
            loading={loading}
            scroll={{ x: 'max-content', y: '60vh' }}
            bordered
            rowKey="key"
            pagination={{
                onChange: cancel,
                pageSizeOptions: ['15', '20', '50', '100', '200'],
                showSizeChanger: true,
                defaultPageSize: 15,
                // 图片中分页器显示为 "15 条/页"，需要自定义 showTotal
                showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} 条`, // 示例：显示 "1-15 / 100 条"
              }}
          />
        </Form>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddInline}>
                Add New SKU (Inline)
            </Button>
        </div>
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
      </div>
    </ConfigProvider>
  );
};

export default App;