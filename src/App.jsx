import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Table, ConfigProvider, Button, message, Upload, Space, Popconfirm, Alert } from 'antd';
import zhCN from 'antd/locale/zh_CN';
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
  const [errorMessages, setErrorMessages] = useState([]); // 用于存储和显示多个错误
  const [formApiFieldErrors, setFormApiFieldErrors] = useState([]); // 新状态，用于存储传递给模态框的字段级错误

  const fetchSkusWithHandling = async () => {
    setLoading(true);
    setErrorMessages([]); // 清空之前的错误
    try {
      const data = await getAllSkus();
      // 后端返回的 sku 对象应该有 'id' 字段
      setDataSource(data.map(item => ({ ...item, key: item.id })));
      message.success('SKU 数据加载成功！');
    } catch (error) {
      console.error("获取 SKU 失败:", error);
      message.error(`获取 SKU 失败: ${error.message}`);
      setErrorMessages(prev => [...prev, `获取 SKU 失败: ${error.message}`]);
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
      title: '操作',
      key: 'operation',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} type="link">编辑</Button>
          <Popconfirm
            title="确定删除此SKU吗？"
            onConfirm={() => handleDelete(record.key)}
            okText="是"
            cancelText="否"
          >
            <Button icon={<DeleteOutlined />} type="link" danger>删除</Button>
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
      message.success('SKU 删除成功!');
      fetchSkusWithHandling(); // 重新加载数据
      setSelectedRowKeys(prevKeys => prevKeys.filter(k => k !== skuId)); // 从选择中移除
    } catch (error) {
      console.error('删除 SKU 失败:', error);
      message.error(`删除 SKU 失败: ${error.message}`);
      setErrorMessages(prev => [...prev, `删除 SKU ID ${skuId} 失败: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的 SKU!');
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
        console.error(`删除 SKU ID ${skuId} 失败:`, error);
        currentErrors.push(`删除 SKU ID ${skuId} 失败: ${error.message}`);
      }
    }
    setLoading(false);
    if (successCount > 0) {
      message.success(`成功删除 ${successCount} 个 SKU!`);
    }
    if (currentErrors.length > 0) {
      setErrorMessages(currentErrors);
      message.error(`有 ${currentErrors.length} 个 SKU 删除失败，请查看提示。`);
    }
    fetchSkusWithHandling(); // 重新加载数据
    setSelectedRowKeys([]); // 清空选择
  };


  const handleModalSubmit = async (values) => {
    setLoading(true);
    setErrorMessages([]);
    setFormApiFieldErrors([]); // <--- 在提交前清空字段错误
    try {
      if (editingSku && editingSku.id) {
        const { id, ...updateValues } = values;
        await updateSku(editingSku.id, updateValues);
        message.success('SKU 更新成功!');
      } else {
        await createSku(values);
        message.success('SKU 创建成功!');
      }
      setIsModalOpen(false);
      fetchSkusWithHandling(); // 重新加载数据
      return true; // <--- 新增：操作成功时返回 true
    } catch (error) {
      console.error('操作 SKU 失败:', error);
      message.error(`${editingSku ? '更新' : '创建'} SKU 失败: ${error.message}`);
      // setErrorMessages(prev => [...prev, `${editingSku ? '更新' : '创建'} SKU 失败: ${error.message}`]);
      // ^^^ 如果 fieldErrors 存在，优先使用更具体的字段错误提示，否则使用通用错误信息
      if (error.fieldErrors && Array.isArray(error.fieldErrors)) {
        setErrorMessages(prev => [...prev, '表单提交失败，请检查以下字段的错误提示。']); 
        setFormApiFieldErrors(error.fieldErrors);
      } else {
        setErrorMessages(prev => [...prev, `${editingSku ? '更新' : '创建'} SKU 失败: ${error.message}`]);
      }
      return false; // <--- 新增：操作失败时返回 false
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSku(null);
    setFormApiFieldErrors([]); // <--- 关闭模态框时清空字段错误
  };

  const handleExport = () => {
    if (dataSource.length === 0) {
        message.warning('没有数据可以导出！');
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
        message.warning('没有选中的数据可以导出！');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, selectedRowKeys.length > 0 ? "selected_sku_data.xlsx" : "all_sku_data.xlsx");
    message.success(selectedRowKeys.length > 0 ? '选中的数据已导出!' : '全部数据已导出!');
  };


  const handleCsvUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setLoading(true);
    setErrorMessages([]);
    try {
      const response = await uploadSkuCsv(file);
      // 后端返回的 response 结构是 {"success_count": success, "failure_count": len(failures), "failures": failures}
      if (response.failure_count > 0) {
        message.warning(`部分 SKU 上传失败: ${response.failure_count} 个失败。详情请查看控制台或错误提示。`);
        const uploadErrors = response.failures.map(f => `行 ${f.row}: ${JSON.stringify(f.error) || '未知错误'}`);
        setErrorMessages(uploadErrors);
        console.error("CSV上传失败详情:", response.failures);
      }
      if (response.success_count > 0) {
        message.success(`成功上传 ${response.success_count} 个 SKU!`);
      }
       if (response.success_count === 0 && response.failure_count === 0 && response.message) {
         // 例如，文件为空或格式完全不符，但API服务已处理
         message.info(response.message);
      } else if (response.success_count === 0 && response.failure_count === 0) {
         message.info("上传完成，但没有 SKU 被处理。文件可能为空或不符合预期。");
      }
      onSuccess(response, file); // Antd Upload onSuccess 回调
      fetchSkusWithHandling(); // 重新加载数据
    } catch (error) {
      console.error('CSV 上传失败:', error);
      message.error(`CSV 上传失败: ${error.message}`);
      setErrorMessages(prev => [...prev, `CSV 上传失败: ${error.message}`]);
      onError(error); // Antd Upload onError 回调
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider locale={zhCN}>
      <div className="App">
        <h1 style={{ color: 'black' }}>SKU 管理系统</h1>
        {errorMessages.length > 0 && (
          <Alert
            message="发生错误"
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
            创建 SKU
          </Button>
          <Upload
            ref={fileInputRef}
            customRequest={handleCsvUpload} // 使用 customRequest 来完全控制上传过程
            showUploadList={false} // 不显示 Antd 的上传列表
            accept=".csv"
          >
            <Button icon={<UploadOutlined />}>上传 CSV</Button>
          </Upload>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            {selectedRowKeys.length > 0 ? `导出选中 (${selectedRowKeys.length})` : '导出全部'}
          </Button>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
                title={`确定删除选中的 ${selectedRowKeys.length} 个SKU吗？`}
                onConfirm={handleDeleteSelected}
                okText="是"
                cancelText="否"
            >
                <Button danger icon={<DeleteOutlined />}>
                    删除选中 ({selectedRowKeys.length})
                </Button>
            </Popconfirm>
          )}
        </Space>
        <Table
          rowSelection={rowSelection}
          columns={tableColumns}
          dataSource={dataSource}
          loading={loading}
          scroll={{ x: 'max-content', y: '60vh' }} // 限制表格高度并允许垂直滚动
          bordered
          rowKey="key" // 确保每行都有唯一的key，我们已在 fetchSkus 中设置
        />
        <SkuFormModal
          visible={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          initialData={editingSku}
          fieldsConfig={fieldsConfig}
          statusOptions={statusOptions}
          conditionOptions={conditionOptions}
          apiFieldErrors={formApiFieldErrors} // <--- 将字段错误传递给模态框
        />
      </div>
    </ConfigProvider>
  );
};

export default App;