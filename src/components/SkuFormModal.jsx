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
  apiFieldErrors,
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

  // 新的 useEffect 用于处理来自 API 的字段错误
  useEffect(() => {
    if (apiFieldErrors && apiFieldErrors.length > 0) {
      const antdFieldErrors = apiFieldErrors.map(err => ({
        name: err.loc[err.loc.length - 1], // FastAPI通常将字段名放在loc数组的最后
        errors: [err.msg],
      }));
      form.setFields(antdFieldErrors);
    }
    // 注意：当 apiFieldErrors 变为空数组时（例如 App.jsx 中清空时），
    // 不需要显式清除 form.setFields 设置的错误，因为下次 validateFields 或 setFieldsValue 会覆盖它们。
    // 如果确实需要主动清除，可以在 App.jsx 清空 apiFieldErrors 后，再调用 form.resetFields() 或 form.setFields([])，但这需要更复杂的 prop 传递或 ref 使用。
    // 目前的设计是，错误在下次提交前或关闭模态框时由 App.jsx 清空 formApiFieldErrors，下次打开模态框时 apiFieldErrors 会是空数组。
  }, [apiFieldErrors, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
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

        const success = await onSubmit(submissionValues);

        if (success) {
          form.resetFields(); // 仅在成功时重置表单
          // onClose(); // App.jsx 中的 onSubmit 成功后会处理关闭逻辑
        } else {
          // 当 onSubmit 返回 false (即发生错误) 时，模态框不关闭，表单不重置。
          // 错误信息由 App.jsx 中的 Alert 组件显示。
        }
      })
      .catch((info) => {
        console.log('Validate Failed (前端校验失败):', info);
        // 前端表单校验本身的错误会由 Form.Item 自动显示，这里可以不用额外处理
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