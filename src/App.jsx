// src/App.jsx
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Table, ConfigProvider, Button, message, Upload, Space, Popconfirm, Alert } from 'antd';
import zhCN from 'antd/locale/zh_CN'; // Keep zhCN if you still want Chinese locale for Ant Design components
import * as XLSX from 'xlsx';
import { fieldsConfig, statusOptions, conditionOptions } from './components/fieldConfig';
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ExportOutlined } from '@ant-design/icons';
import SkuFormModal from './components/SkuFormModal';
import { getAllSkus, createSku, updateSku, deleteSku, uploadSkuCsv } from './services/skuApiService';

const App = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSku, setEditingSku] = useState(null);
  const fileInputRef = useRef(null);
  const [errorMessages, setErrorMessages] = useState([]); // Used to store and display multiple errors
  const [formApiFieldErrors, setFormApiFieldErrors] = useState([]); // New state for field-level errors from API

  const fetchSkusWithHandling = async () => {
    setLoading(true);
    setErrorMessages([]); // Clear previous errors
    try {
      const data = await getAllSkus();
      // Backend should return SKU objects with an 'id' field
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

  // Table columns definition
  const tableColumns = [
    ...fieldsConfig.map((field) => ({
      title: field.label,
      dataIndex: field.name,
      key: field.name,
      width: field.name === 'vendor_sku' ? 180 : (field.type === 'textarea' || field.name.toLowerCase().includes('desc') ? 250 : 150),
      fixed: field.name === 'vendor_sku' ? 'left' : undefined,
      ellipsis: true,
    })),
    {
      title: 'Operation',
      key: 'operation',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} type="link">Edit</Button>
          <Popconfirm
            title="Are you sure to delete this SKU?"
            onConfirm={() => handleDelete(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} type="link" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleAdd = () => {
    setEditingSku(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sku) => {
    setEditingSku(sku);
    setIsModalOpen(true);
  };

  const handleDelete = async (skuId) => {
    setLoading(true);
    setErrorMessages([]);
    try {
      await deleteSku(skuId);
      message.success('SKU deleted successfully!');
      fetchSkusWithHandling(); // Reload data
      setSelectedRowKeys(prevKeys => prevKeys.filter(k => k !== skuId)); // Remove from selection
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
        await deleteSku(skuId);
        successCount++;
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
    fetchSkusWithHandling(); // Reload data
    setSelectedRowKeys([]); // Clear selection
  };


  const handleModalSubmit = async (values) => {
    setLoading(true);
    setErrorMessages([]);
    setFormApiFieldErrors([]); // Clear field errors before submission

    // Add temporary field push_to_wms
    const submissionData = { ...values, push_to_wms: true };

    try {
      if (editingSku && editingSku.id) {
        // For update operations, ensure ID is not included in the submitted body data, and push_to_wms is added
        const { id, ...updateValuesSansId } = submissionData;
        await updateSku(editingSku.id, updateValuesSansId);
        message.success('SKU updated successfully!');
      } else {
        // For create operations, use submissionData directly with push_to_wms
        await createSku(submissionData);
        message.success('SKU created successfully!');
      }
      setIsModalOpen(false);
      fetchSkusWithHandling(); // Reload data
      return true; // Return true on successful operation
    } catch (error) {
      console.error('SKU operation failed:', error);
      message.error(`${editingSku ? 'Update' : 'Create'} SKU failed: ${error.message}`);
      if (error.fieldErrors && Array.isArray(error.fieldErrors)) {
        setErrorMessages(prev => [...prev, 'Form submission failed, please check error messages for specific fields.']);
        setFormApiFieldErrors(error.fieldErrors);
      } else {
        setErrorMessages(prev => [...prev, `${editingSku ? 'Update' : 'Create'} SKU failed: ${error.message}`]);
      }
      return false; // Return false on failed operation
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSku(null);
    setFormApiFieldErrors([]); // Clear field errors when modal closes
  };

  const handleExport = () => {
    if (dataSource.length === 0) {
        message.warning('No data to export!');
        return;
    }
    const dataToExport = (selectedRowKeys.length > 0
        ? dataSource.filter(item => selectedRowKeys.includes(item.key))
        : dataSource
    ).map(item => {
      const exportRow = {};
      fieldsConfig.forEach(field => {
        exportRow[field.label] = item[field.name];
      });
      return exportRow;
    });

    if (dataToExport.length === 0) {
        message.warning('No selected data to export!');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, selectedRowKeys.length > 0 ? "selected_sku_data.xlsx" : "all_sku_data.xlsx");
    message.success(selectedRowKeys.length > 0 ? 'Selected data exported!' : 'All data exported!');
  };


  const handleCsvUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setLoading(true);
    setErrorMessages([]);
    try {
      const response = await uploadSkuCsv(file);
      if (response.failure_count > 0) {
        message.warning(`Some SKUs failed to upload: ${response.failure_count} failures. See console or error messages for details.`);
        const uploadErrors = response.failures.map(f => `Row ${f.row}: ${JSON.stringify(f.error) || 'Unknown error'}`);
        setErrorMessages(uploadErrors);
        console.error("CSV upload failure details:", response.failures);
      }
      if (response.success_count > 0) {
        message.success(`Successfully uploaded ${response.success_count} SKUs!`);
      }
       if (response.success_count === 0 && response.failure_count === 0 && response.message) {
         message.info(response.message);
      } else if (response.success_count === 0 && response.failure_count === 0) {
         message.info("Upload complete, but no SKUs were processed. File might be empty or not as expected.");
      }
      onSuccess(response, file);
      fetchSkusWithHandling();
    } catch (error) {
      console.error('CSV upload failed:', error);
      message.error(`CSV upload failed: ${error.message}`);
      setErrorMessages(prev => [...prev, `CSV upload failed: ${error.message}`]);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Create SKU
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
        <Table
          rowSelection={rowSelection}
          columns={tableColumns}
          dataSource={dataSource}
          loading={loading}
          scroll={{ x: 'max-content', y: '60vh' }}
          bordered
          rowKey="key"
        />
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
      </div>
    </ConfigProvider>
  );
};

export default App;