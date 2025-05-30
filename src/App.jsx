// src/App.jsx
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Table, ConfigProvider, Button, message, Upload, Space, Popconfirm, Alert, Form } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import * as XLSX from 'xlsx';
import { fieldsConfig, statusOptions, conditionOptions } from './components/fieldConfig';
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ExportOutlined, SaveOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import SkuFormModal from './components/SkuFormModal';
import EditableCell from './components/EditableCell';
import { getAllSkus, createSku, updateSku, deleteSku, uploadSkuCsv } from './services/skuApiService';

const App = () => {
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // 用于 Create/Edit Modal
  const [editingSku, setEditingSku] = useState(null); // 用于 Create/Edit Modal 的数据
  const fileInputRef = useRef(null);
  const [errorMessages, setErrorMessages] = useState([]);
  const [formApiFieldErrors, setFormApiFieldErrors] = useState([]);

  const [editingKey, setEditingKey] = useState('');
  const [editingRowData, setEditingRowData] = useState({}); // 新增状态：存储当前编辑行的实时数据

  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [viewingSku, setViewingSku] = useState(null);

  // >>>>>>>>>>>>>> 确保 handleInlineFormValuesChange 定义在这里，在 Form 组件使用之前 <<<<<<<<<<<<<<<
  const handleInlineFormValuesChange = (changedValues, allValues) => {
    setEditingRowData(prev => ({ ...prev, ...changedValues }));
  };
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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

  useEffect(() => {
    fetchSkusWithHandling();
  }, []);

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    // 如果有正在编辑的行，先处理它
    if (editingKey && editingKey !== record.key) {
      // 提示用户保存或取消当前编辑，或者自动保存/取消
      message.warning('Please save or cancel the current editing row before editing another!');
      return; // 阻止编辑新行
    }

    // 初始化 form 和 editingRowData
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
    setEditingRowData(initialValues); // 将当前行数据复制到编辑草稿状态
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
    setEditingRowData({}); // 清空草稿数据
    setFormApiFieldErrors([]);
  };

  // 保存编辑
  const save = async (key) => {
    setLoading(true);
    setErrorMessages([]);
    setFormApiFieldErrors([]);

    try {
      // 从 form 中获取最新验证通过的值
      const validatedFields = await form.validateFields();

      // 将 validatedFields 合并到 editingRowData 中，确保所有字段都存在
      const updatedItem = { ...editingRowData, ...validatedFields };

      // 进行类型转换以符合后端API要求 (这部分逻辑保持不变)
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

      const { key: _, ...apiPayload } = updatedItem; // 移除 key 字段

      // 提交到后端
      if (String(key).startsWith('new-temp-id')) { // 修正了 key.startsWith 错误
        await createSku(apiPayload);
        message.success('SKU created successfully!');
      } else { // 现有行
        await updateSku(apiPayload.id, apiPayload); // 更新时使用真实的 ID
        message.success('SKU updated successfully!');
      }

      // 成功后，重新获取数据，清除编辑状态和草稿数据
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

  // 定义表格默认显示的字段名称列表
  const defaultDisplayFields = [
    'vendor_sku',
    'UPC',
    'product_en_name',
    'product_cn_name',
    'dropship_price',
    'brand',
    'net_weight',
    'gross_weight',
    'product_height',
    'product_length',
    'product_width',
    'box_height',
    'box_length',
    'box_width',
    'main_image',
    'size_chart_image',
    'allow_dropship_return', 'condition', 'UOM', 'ship_from', 'ship_to', 'ship_carrier',
    'title', 'short_desc', 'keywords', 'key_features_1', 'key_features_2',
    'full_image', 'thumbnail_image',
    'status'
  ];

  const getTableColumns = () => {
    const orderedDisplayFields = [
      'vendor_sku', 'UPC', 'product_en_name', 'product_cn_name', 'dropship_price', 'brand',
      'net_weight', 'gross_weight', 'product_height', 'product_length', 'product_width',
      'box_height', 'box_length', 'box_width', 'main_image', 'size_chart_image',
      'allow_dropship_return', 'condition', 'UOM', 'ship_from', 'ship_to', 'ship_carrier',
      'title', 'short_desc', 'keywords', 'key_features_1', 'key_features_2',
      'full_image', 'thumbnail_image', 'status'
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
          onCell: (record) => ({
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

    // 添加操作列
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
            {/* Show All 按钮：点击后打开模态框显示所有字段 */}
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

  const handleDelete = async (skuId) => {
    setLoading(true);
    setErrorMessages([]);
    try {
      if (skuId === editingKey && String(skuId).startsWith('new-temp-id')) {
        setDataSource(dataSource.filter(item => item.key !== skuId));
        setEditingKey('');
        setEditingRowData({});
        message.success('New SKU discarded!');
      } else {
        await deleteSku(skuId);
        message.success('SKU deleted successfully!');
        fetchSkusWithHandling();
      }
      setSelectedRowKeys(prevKeys => prevKeys.filter(k => k !== skuId));
    } catch (error) {
      console.error('Failed to delete SKU:', error);
      message.error(`Failed to delete SKU: ${error.message}`);
      setErrorMessages(prev => [...prev, `Failed to delete SKU ID ${skuId}: ${error.message}`]);
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
    const newSelectedRowKeys = [];
    const newEditingRowData = { ...editingRowData };

    for (const skuId of selectedRowKeys) {
      try {
        if (skuId === editingKey && String(skuId).startsWith('new-temp-id')) {
            setDataSource(prev => prev.filter(item => item.key !== skuId));
            setEditingKey('');
            setEditingRowData({});
            message.success('New SKU discarded!');
        } else {
            await deleteSku(skuId);
            successCount++;
        }
      } catch (error) {
        console.error(`Failed to delete SKU ID ${skuId}:`, error);
        currentErrors.push(`Failed to delete SKU ID ${skuId}: ${error.message}`);
        newSelectedRowKeys.push(skuId);
      }
    }
    setLoading(false);
    if (successCount > 0) {
      message.success(`Successfully deleted ${successCount} SKUs!`);
    }
    if (currentErrors.length > 0) {
      setErrorMessages(currentErrors);
      message.error(`There were ${currentErrors.length} SKUs that failed to delete. Please check the prompts.`);
    }
    fetchSkusWithHandling();
    setSelectedRowKeys(newSelectedRowKeys);
    setEditingRowData(newEditingRowData);
  };

  // 模态框提交处理函数 (修改点：新增 initialDataParam 参数)
  const handleModalSubmit = async (values, initialDataParam) => {
    setLoading(true);
    setFormApiFieldErrors([]);
    console.log('handleModalSubmit: Received values:', values); // 新增日志
    console.log('handleModalSubmit: Received initialDataParam:', initialDataParam); // 新增日志
    console.log('handleModalSubmit: Type of values.id:', typeof values.id, 'Value of values.id:', values.id); // 新增日志

    try {
      let success = false;
      if (initialDataParam) { // 根据 initialDataParam 是否存在判断是更新还是创建
        // 修改点：使用 initialDataParam.id 来获取 SKU ID
        await updateSku(initialDataParam.id, values); // 确保 values.id 包含了正确的 SKU ID
        message.success('SKU updated successfully!');
        success = true;
      } else {
        const { id: _, ...payload } = values; // 创建新 SKU 时移除临时 id
        await createSku(payload);
        message.success('SKU created successfully!');
        success = true;
      }
      if (success) {
        fetchSkusWithHandling(); // 重新获取数据

        // 根据 initialDataParam 的来源关闭正确的模态框
        if (initialDataParam === editingSku) { // 如果是编辑操作的模态框
            handleModalClose();
        } else if (initialDataParam === viewingSku) { // 如果是查看所有字段的模态框
            handleViewAllModalClose();
        } else { // 否则认为是创建操作的模态框
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
  const handleViewAllModalClose = () => { setIsViewAllModalOpen(false); setViewingSku(null); setFormApiFieldErrors([]); }; // 清空错误信息
  const handleExport = () => { /* ... (unchanged) ... */ };
  const handleCsvUpload = async (options) => { /* ... (unchanged) ... */ };


  return (
    <ConfigProvider locale={zhCN}>
      <div className="App">
        <h1 style={{ color: 'black' }}>SKU Management System</h1>
        {errorMessages.length > 0 && (
          <Alert
            message="An error occurred"
            description={
              <ul>
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
        <Space style={{ marginBottom: 16 }}>
          {/* 模态框新增按钮保留 */}
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
            {selectedRowKeys.length > 0 ? `Export Selected (${selectedRowKeys.length})` : 'Export All'}
          </Button>
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
        </Space>
        <Form form={form} component={false} onValuesChange={handleInlineFormValuesChange}>
          <Table
            rowSelection={rowSelection}
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            columns={getTableColumns()}
            dataSource={dataSource}
            loading={loading}
            scroll={{ x: 'max-content', y: '60vh' }}
            bordered
            rowKey="key"
          />
        </Form>
        {/* 将新增行按钮移动到表格下方，并左对齐 */}
        <div style={{ textAlign: 'left', marginTop: '16px' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddInline}>
                Add New SKU (Inline)
            </Button>
        </div>
        {/* 用于创建/编辑 SKU 的模态框，现在也使用 showAllMode 布局 */}
        <SkuFormModal
          visible={isModalOpen}
          onClose={handleModalClose}
          onSubmit={(values) => handleModalSubmit(values, editingSku)} // 修改点：传递 editingSku
          initialData={editingSku}
          fieldsConfig={fieldsConfig}
          statusOptions={statusOptions}
          conditionOptions={conditionOptions}
          apiFieldErrors={formApiFieldErrors}
          showAllMode={true} // 设置为 showAllMode，以便统一布局
        />
        {/* 用于显示所有字段的模态框，现在支持编辑 */}
        <SkuFormModal
          visible={isViewAllModalOpen}
          onClose={handleViewAllModalClose}
          onSubmit={(values) => handleModalSubmit(values, viewingSku)} // 修改点：传递 viewingSku
          initialData={viewingSku}
          fieldsConfig={fieldsConfig}
          statusOptions={statusOptions}
          conditionOptions={conditionOptions}
          apiFieldErrors={formApiFieldErrors}
          showAllMode={true} // 设置为 showAllMode
        />
      </div>
    </ConfigProvider>
  );
};

export default App;