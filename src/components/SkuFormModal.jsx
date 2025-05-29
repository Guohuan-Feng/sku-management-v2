import { Modal, Form, Input, Select, InputNumber, Button, Row, Col, Checkbox, message } from 'antd';
import { useEffect, useState } from 'react';
import { generateAIDescription } from '../services/skuApiService';
import React from 'react'; // 确保 React 被导入以使用 Fragment

const { Option } = Select;
const { TextArea } = Input;

// AI 生成描述时，从表单获取这些字段的值作为输入
const AI_INPUT_FIELDS = [
  'product_name', 'brand', 'category', 'sub_category', 'color', 'size',
  'product_class', 'group', 'sub_group', 'style', 'sub_style', 'model',
  'gender', 'keywords'
];

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
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        const formData = { ...initialData };
        fieldsConfig.forEach(field => {
          if (field.type === 'select') {
             if (field.name === 'status' || field.name === 'condition') {
                if (formData[field.name] !== undefined && formData[field.name] !== null) {
                    formData[field.name] = String(formData[field.name]);
                }
             } else if (field.name === 'allow_dropship_return') {
                formData[field.name] = String(formData[field.name]);
             }
          }
          if (field.type === 'number' && formData[field.name] !== undefined && formData[field.name] !== null) {
            const numValue = parseFloat(formData[field.name]);
            formData[field.name] = isNaN(numValue) ? null : numValue;
          }
        });
        form.setFieldsValue(formData);
      } else {
        const defaultValues = {};
        fieldsConfig.forEach(field => {
          if (field.defaultValue !== undefined) {
            defaultValues[field.name] = field.defaultValue;
          }
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

  useEffect(() => {
    if (apiFieldErrors && apiFieldErrors.length > 0) {
      const antdFieldErrors = apiFieldErrors.map(err => ({
        name: err.loc[err.loc.length - 1],
        errors: [err.msg],
      }));
      form.setFields(antdFieldErrors);
    }
  }, [apiFieldErrors, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
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
          form.resetFields();
        }
      })
      .catch((info) => {
        console.log('Validate Failed (前端校验失败):', info);
      });
  };

  const handleAIGenerate = async () => {
    try {
      const currentValues = form.getFieldsValue(AI_INPUT_FIELDS);
      const payload = {};
      for (const key in currentValues) {
        if (currentValues[key] !== undefined && currentValues[key] !== null && String(currentValues[key]).trim() !== '') {
          payload[key] = currentValues[key];
        }
      }

      if (Object.keys(payload).length === 0) {
        message.warning('请输入一些产品信息以供 AI 生成描述。');
        return;
      }

      setAiLoading(true);
      const aiResponse = await generateAIDescription(payload);
      console.log('AI Response from backend:', aiResponse); // 查看完整的AI响应对象


      const fieldsToUpdate = {
        title: aiResponse['product title'],
        short_desc: aiResponse['short description'],
        long_desc: aiResponse['long description'],
        key_features_1: aiResponse['key features 1'],
        key_features_2: aiResponse['key features 2'],
        key_features_3: aiResponse['key features 3'],
        key_features_4: aiResponse['key features 4'],
        key_features_5: aiResponse['key features 5'],
      };

      const filteredFieldsToUpdate = {};
      

      for (const key in fieldsToUpdate) {
          if (fieldsToUpdate[key] !== undefined) {
              filteredFieldsToUpdate[key] = fieldsToUpdate[key];
          }
      }
      console.log('Data being set to form:', filteredFieldsToUpdate); // 查看最终要设置到表单的数据

      form.setFieldsValue(filteredFieldsToUpdate);
      message.success('AI 已成功生成描述信息！');

    } catch (error) {
      console.error('AI 生成描述失败:', error);
      message.error(`AI 生成描述失败: ${error.message || '请稍后再试'}`);
    } finally {
      setAiLoading(false);
    }
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
      width="80vw"
      destroyOnClose
      maskClosable={false}
      footer={[ // 从页脚移除 AI 生成按钮
          <Button key="back" onClick={onClose}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk} loading={false}>
            {initialData ? '更新' : '创建'}
          </Button>,
        ]}
    >
      <Form form={form} layout="vertical" name="skuForm">
        <Row gutter={16}>
          {fieldsConfig.map((field) => {
            if (field.name === 'id') return null;
            return (
              // 使用 React.Fragment 来包裹 Col 和可能的 AI 按钮容器
              <React.Fragment key={field.name}>
                <Col span={field.gridWidth || 8}>
                  <Form.Item
                    name={field.name}
                    label={field.label}
                    rules={field.validation ?
                        Object.entries(field.validation).reduce((acc, [key, value]) => {
                            if (key === 'required' && value) {
                                acc.push({ required: true, message: field.validation.requiredMsg || `${field.label} 是必填项!` });
                            } else if (key === 'pattern' && value) {
                                acc.push({ pattern: value, message: field.validation.patternMsg || '格式不正确!' });
                            } else if (key === 'maxLength' && value) {
                                acc.push({ max: value, message: field.validation.maxLengthMsg || `最多 ${value} 字符!` });
                            } else if (key === 'min' && value !== undefined && (field.type === 'number' || field.isFee)) {
                                acc.push({ type: 'number', min: value, message: field.validation.minMsg || `不能小于 ${value}!` });
                            } else if (key === 'max' && value !== undefined && (field.type === 'number' || field.isFee)) {
                                acc.push({ type: 'number', max: value, message: field.validation.maxMsg || `不能大于 ${value}!` });
                            }
                            return acc;
                        }, [])
                        : []
                    }
                    required={field.validation?.required}
                  >
                    {renderField(field)}
                  </Form.Item>
                </Col>
                {/* 在 long_desc 字段下方（逻辑上）添加 AI 生成按钮 */}
                {field.name === 'long_desc' && (
                  <Col span={24} style={{ textAlign: 'right', marginTop: '0px', marginBottom: '16px' }}>
                    <Button onClick={handleAIGenerate} loading={aiLoading}>
                      ✨ Use AI description
                    </Button>
                  </Col>
                )}
              </React.Fragment>
            );
          })}
        </Row>
      </Form>
    </Modal>
  );
};

export default SkuFormModal;