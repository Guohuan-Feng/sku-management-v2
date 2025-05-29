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
  // const [tableDisplayMode, setTableDisplayMode] = useState('partial'); // 移除此状态，因为Show All不再是切换表格列

  // 新增状态：用于控制“Show All”模态框的显示
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [viewingSku, setViewingSku] = useState(null); // 存储要查看所有字段的 SKU 数据

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
    const formData = { ...record };
    fieldsConfig.forEach(field => {
      if (field.type === 'select') {
         if (formData[field.name] !== undefined && formData[field.name] !== null) {
             formData[field.name] = String(formData[field.name]);
         }
      } else if (field.type === 'number' && formData[field.name] !== undefined && formData[field.name] !== null) {
        const numValue = parseFloat(formData[field.name]);
        formData[field.name] = isNaN(numValue) ? null : numValue;
      } else if (field.name === 'allow_dropship_return' && formData[field.name] !== undefined && formData[field.name] !== null) {
        formData[field.name] = String(formData[field.name]);
      }
    });
    form.setFieldsValue(formData);
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
    setFormApiFieldErrors([]);
  };

  const save = async (key) => {
    setLoading(true);
    setErrorMessages([]);
    setFormApiFieldErrors([]);

    try {
      const row = await form.validateFields();
      const newData = [...dataSource];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        const updatedItem = { ...item, ...row };

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

        if (item.id === 'new-temp-id') {
          await createSku(apiPayload);
          message.success('SKU created successfully!');
        } else {
          await updateSku(item.id, apiPayload);
          message.success('SKU updated successfully!');
        }

        fetchSkusWithHandling();
        setEditingKey('');
      } else {
        console.warn('Attempted to save a non-existent row:', key);
        message.error('Failed to save: Row not found or already saved.');
      }
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

  // 定义表格默认显示的字段名称列表 (精简模式)
  const defaultDisplayFields = [
    'vendor_sku', 'product_name', 'dropship_price', 'condition',
    'UOM', 'ship_from', 'ship_to', 'ship_carrier', 'title', 'short_desc',
    'keywords', 'key_features_1', 'key_features_2', 'main_image', 'full_image', 'thumbnail_image',
    'status',
  ];

  // getTableColumns 现在总是返回精简模式的列定义
  const getTableColumns = () => {
    const columnsToDisplay = fieldsConfig.filter(field => defaultDisplayFields.includes(field.name));

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
      width: 180, // 增加宽度以容纳 Show All 按钮
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
                setViewingSku(record); // 设置要查看的 SKU 数据
                setIsViewAllModalOpen(true); // 打开模态框
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
            acc[field.name] = null; // Initialize optional numbers as null
        } else if (field.type === 'select') {
            // For select fields, use defaultValue, or if options exist, use the first option's value
            let selectDefault = null;
            if (field.defaultValue !== undefined) {
                selectDefault = field.defaultValue;
            } else if (field.options && field.options.length > 0) {
                selectDefault = field.options[0].value;
            }
            acc[field.name] = selectDefault;
        } else if (field.type === 'url') {
            acc[field.name] = null; // Initialize optional URLs as null
        } else {
            // For general text fields, if it's not mandatory (required by backend for CSV), send null
            // For mandatory fields, send empty string and let frontend validation handle it
            if (field.isMandatory) { // This `isMandatory` is from fieldConfig, based on CSV mandatory fields or origValidation.required
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
      if (skuId === editingKey && skuId.startsWith('new-temp-id')) {
        setDataSource(dataSource.filter(item => item.key !== skuId));
        setEditingKey('');
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

    for (const skuId of selectedRowKeys) {
      try {
        if (skuId === editingKey && skuId.startsWith('new-temp-id')) {
            setDataSource(dataSource.filter(item => item.key !== skuId));
            setEditingKey('');
            message.success('New SKU discarded!');
        } else {
            await deleteSku(skuId);
            successCount++;
        }
      } catch (error) {
        console.error(`Failed to delete SKU ID ${skuId}:`, error);
        currentErrors.push(`Failed to delete SKU ID ${skuId}: ${error.message}`);
      }
    }
    setLoading(false);
    if (successCount > 0) {
      message.success(`Successfully deleted ${successCount} SKUs!`);
    }
    if (currentErrors.length > 0) {
      setErrorMessages(currentErrors);
      message.error(`${currentErrors.length} SKUs failed to delete, please check the prompts.`);
    }
    fetchSkusWithHandling();
    setSelectedRowKeys([]);
  };

  const handleModalSubmit = async (values) => { /* ... (unchanged) ... */ return true; };
  const handleModalClose = () => { setIsModalOpen(false); setEditingSku(null); setFormApiFieldErrors([]); }; // Create/Edit Modal 关闭
  const handleViewAllModalClose = () => { setIsViewAllModalOpen(false); setViewingSku(null); }; // Show All Modal 关闭
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
        {/* 移除了之前的 Show Less 按钮和逻辑 */}
        <Form form={form} component={false}>
          <Table
            rowSelection={rowSelection}
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            columns={getTableColumns()} // 直接调用 getTableColumns()
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
        {/* 用于创建/编辑 SKU 的模态框 */}
        <SkuFormModal
          visible={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          initialData={editingSku}
          fieldsConfig={fieldsConfig}
          statusOptions={statusOptions}
          conditionOptions={conditionOptions}
          apiFieldErrors={formApiFieldErrors}
        />
        {/* 新增的用于显示所有字段的模态框，设置为只读模式 */}
        <SkuFormModal
          visible={isViewAllModalOpen}
          onClose={handleViewAllModalClose}
          initialData={viewingSku}
          fieldsConfig={fieldsConfig}
          statusOptions={statusOptions}
          conditionOptions={conditionOptions}
          isReadOnly={true} // 传递只读模式
        />
      </div>
    </ConfigProvider>
  );
};

export default App;