import { Modal, Form, Input, Select, InputNumber, Button, Row, Col, Checkbox } from 'antd';
import { useEffect } from 'react';

const { Option } = Select;
const { TextArea } = Input;

const SkuFormModal = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  fieldsConfig,
  statusOptions,
  conditionOptions,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialData) {
        // AntD Form在处理数字类型的Select时，如果其值在options中是字符串，需要转换
        // 同时处理数字和布尔值类型，以确保表单正确填充
        const formData = { ...initialData };
        fieldsConfig.forEach(field => {
          if (field.type === 'select') {
             if (field.name === 'status' || field.name === 'condition') {
                if (formData[field.name] !== undefined && formData[field.name] !== null) {
                    formData[field.name] = String(formData[field.name]);
                }
             } else if (field.name === 'allow_dropship_return') { // 布尔类型转为字符串
                formData[field.name] = String(formData[field.name]);
             }
          }
          // 对于数字输入，确保它们是数字类型，而不是字符串
          if (field.type === 'number' && formData[field.name] !== undefined && formData[field.name] !== null) {
            const numValue = parseFloat(formData[field.name]);
            formData[field.name] = isNaN(numValue) ? null : numValue;
          }
        });
        form.setFieldsValue(formData);
      } else {
        // 为创建新SKU时设置默认值
        const defaultValues = {};
        fieldsConfig.forEach(field => {
          if (field.defaultValue !== undefined) {
            defaultValues[field.name] = field.defaultValue;
          }
           // 特别处理布尔值的Select
          if (field.name === 'allow_dropship_return' && field.defaultValue !== undefined) {
            defaultValues[field.name] = String(field.defaultValue);
          }
        });
        form.setFieldsValue(defaultValues);
      }
    } else {
      form.resetFields();
    }
  }, [visible, initialData, form, fieldsConfig]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        // 在提交前转换回后端期望的类型
        const submissionValues = { ...values };
        fieldsConfig.forEach(field => {
          if (field.type === 'number' && submissionValues[field.name] !== undefined && submissionValues[field.name] !== null) {
            submissionValues[field.name] = parseFloat(submissionValues[field.name]);
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
        onSubmit(submissionValues);
        form.resetFields(); // 提交成功后重置表单
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  const renderField = (field) => {
    const rules = [];
    if (field.validation) {
      if (field.validation.required) {
        rules.push({ required: true, message: field.validation.requiredMsg || `${field.label} 是必填项!` });
      }
      if (field.validation.pattern) {
        rules.push({ pattern: field.validation.pattern, message: field.validation.patternMsg || '格式不正确!' });
      }
      if (field.validation.maxLength) {
        rules.push({ max: field.validation.maxLength, message: field.validation.maxLengthMsg || `最多 ${field.validation.maxLength} 字符!` });
      }
       if (field.validation.min !== undefined && (field.type === 'number' || field.isFee)) {
        rules.push({ type: 'number', min: field.validation.min, message: field.validation.minMsg || `不能小于 ${field.validation.min}!` });
      }
      if (field.validation.max !== undefined && (field.type === 'number' || field.isFee)) {
        rules.push({ type: 'number', max: field.validation.max, message: field.validation.maxMsg || `不能大于 ${field.validation.max}!` });
      }
    }

    switch (field.type) {
      case 'text':
        return <Input placeholder={field.example || field.description} disabled={field.name === 'id'} />;
      case 'number':
        return <InputNumber style={{ width: '100%' }} placeholder={field.example || field.description} min={field.validation?.min} precision={field.isFee ? 2 : 0} />;
      case 'textarea':
        return <TextArea rows={field.rows || 2} placeholder={field.example || field.description} />;
      case 'select':
        let optionsSource = field.options || [];
        if (field.name === 'status') optionsSource = statusOptions;
        if (field.name === 'condition') optionsSource = conditionOptions;
        if (field.name === 'allow_dropship_return') optionsSource = [{value: 'True', label: '是'}, {value: 'False', label: '否'}];

        return (
          <Select placeholder={field.description}>
            {optionsSource.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );
      case 'url':
        return <Input type="url" placeholder={field.example || field.description} />;
      default:
        return <Input placeholder={field.example || field.description} />;
    }
  };

  return (
    <Modal
      title={initialData ? '编辑 SKU' : '创建 SKU'}
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      width="80vw" // 或者更大的宽度，例如 1000
      destroyOnHidden // 关闭时销毁 Modal 及其子元素，确保表单状态在下次打开时是最新的
      maskClosable={false}
      footer={[ // 自定义页脚按钮
          <Button key="back" onClick={onClose}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk} loading={false /* TODO: 可添加提交加载状态 */}>
            {initialData ? '更新' : '创建'}
          </Button>,
        ]}
    >
      <Form form={form} layout="vertical" name="skuForm">
        <Row gutter={16}>
          {fieldsConfig.map((field) => (
            // 确保 id 字段不可编辑且不在表单中直接显示，或者根本不包含在 fieldsConfig 中让其在表单中渲染
            field.name === 'id' ? null :
            <Col span={field.gridWidth || 8} key={field.name}>
              <Form.Item
                name={field.name}
                label={field.label}
                rules={renderField(field).props.rules || []} // 获取 field 自身的 rules
                required={field.validation?.required} // 显式标记必填项的星号
              >
                {renderField(field)}
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Form>
    </Modal>
  );
};

export default SkuFormModal;