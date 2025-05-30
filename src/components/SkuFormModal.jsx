// src/components/SkuFormModal.jsx
import { Modal, Form, Input, Select, InputNumber, Button, Row, Col, message } from 'antd';
import { useEffect, useState } from 'react';
import { generateAIDescription } from '../services/skuApiService';
import React from 'react'; 

const { Option } = Select;
const { TextArea } = Input;

const AI_INPUT_FIELDS = [
  'product_en_name', 'brand', 'category', 'sub_category', 'color', 'size',
  'product_class', 'group', 'sub_group', 'style', 'sub_style', 'model',
  'gender', 'keywords'
];

const SkuFormModal = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  fieldsConfig, // Crucial prop
  statusOptions,
  conditionOptions,
  apiFieldErrors,
  showAllMode = false,
}) => {
  const [form] = Form.useForm();
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // ... (useEffect hooks remain the same)
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
    // ... (handleOk function remains the same)
    form
      .validateFields()
      .then(async (values) => {
        const submissionValues = { ...values };
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

        const success = await onSubmit(submissionValues);
        if (success) {
          form.resetFields();
        }
      })
      .catch((info) => {
        console.log('Validate Failed (Frontend Validation Failed):', info);
      });
  };

  const handleAIGenerate = async () => {
    console.log('Debug: handleAIGenerate function started.'); // 1. Log entry

    if (!fieldsConfig || !Array.isArray(fieldsConfig) || fieldsConfig.length === 0) {
      console.error('Debug: fieldsConfig prop is missing, not an array, or empty. Cannot proceed.');
      message.error('AI描述功能配置错误，请联系管理员。');
      return;
    }
    console.log('Debug: fieldsConfig is present with length:', fieldsConfig.length); // 2. Log fieldsConfig status
    console.log('Debug: AI_INPUT_FIELDS:', AI_INPUT_FIELDS); // 2a. Log AI_INPUT_FIELDS

    const currentFormValues = form.getFieldsValue(AI_INPUT_FIELDS);
    console.log('Debug: currentFormValues from form:', currentFormValues); // 3. Log form values
    
    const fieldDetails = AI_INPUT_FIELDS.map(fieldName => {
      const fieldConfigItem = fieldsConfig.find(f => f.name === fieldName);
      if (!fieldConfigItem) {
        console.warn(`Debug: No fieldConfig found for AI input field: ${fieldName}`);
      }
      const label = fieldConfigItem ? fieldConfigItem.label : fieldName;
      const value = currentFormValues[fieldName];
      const isFilled = value !== undefined && value !== null && String(value).trim() !== '';
      return { name: fieldName, label, isFilled };
    });
    console.log('Debug: fieldDetails processed:', fieldDetails); // 4. Log processed field details

    const filledFields = fieldDetails.filter(f => f.isFilled);
    const missingFields = fieldDetails.filter(f => !f.isFilled);

    let messageParts = [];
    if (missingFields.length > 0) {
      messageParts.push(`为了AI能更准确地生成描述，建议补充以下字段：\n- ${missingFields.map(f => f.label).join('\n- ')}`);
    } else {
      messageParts.push("所有推荐的AI输入字段均已填写。");
    }

    if (filledFields.length > 0) {
      messageParts.push(`\n当前已填写的相关字段：\n- ${filledFields.map(f => f.label).join('\n- ')}`);
    } else if (missingFields.length > 0) {
      messageParts.push("\n当前未填写任何推荐的AI输入字段。");
    }
    
    const confirmDialogContent = messageParts.join('\n');
    console.log('Debug: Confirm dialog content to be displayed:', confirmDialogContent); // 5. Log dialog content

    Modal.confirm({
      title: '确认生成AI描述吗？',
      content: <div style={{ whiteSpace: 'pre-line' }}>{confirmDialogContent + "\n\n是否继续生成？"}</div>,
      okText: '生成',
      cancelText: '取消',
      maskClosable: true,
      onOk: async () => {
        console.log('Debug: Modal.confirm onOk triggered.'); // 6. Log onOk
        const payload = {};
        AI_INPUT_FIELDS.forEach(fieldName => {
          const value = currentFormValues[fieldName];
          if (value !== undefined && value !== null && String(value).trim() !== '') {
            payload[fieldName] = String(value).trim();
          }
        });
        console.log('Debug: Payload for AI API:', payload); // 6a. Log payload

        if (Object.keys(payload).length === 0) {
          console.log('Debug: Payload is empty, AI call will be skipped.'); // 6b. Log empty payload
          message.warning('请输入一些有效的产品信息以供AI生成描述。');
          return; 
        }

        try {
          setAiLoading(true);
          const aiResponse = await generateAIDescription(payload);
          console.log('Debug: AI Response from backend:', aiResponse); // 6c. Log AI response

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
          console.log('Debug: Data being set to form:', filteredFieldsToUpdate); // 6d. Log data to set to form

          form.setFieldsValue(filteredFieldsToUpdate);
          message.success('AI成功生成了描述信息！');

        } catch (error) {
          console.error('Debug: Error in Modal.confirm onOk during AI call:', error); // 7. Log error in onOk
          message.error(`AI描述生成失败: ${error.message || '请稍后再试'}`);
        } finally {
          setAiLoading(false);
          console.log('Debug: aiLoading set to false in onOk finally block.'); // 7a. Log aiLoading reset
        }
      },
      onCancel: () => {
        console.log('Debug: Modal.confirm onCancel triggered.'); // 8. Log onCancel
      },
    });
    console.log('Debug: Modal.confirm has been invoked.'); // 9. Log after Modal.confirm call
  };

  const renderField = (field) => {
    // ... (renderField function remains the same)
    switch (field.type) {
      case 'text':
        return <Input placeholder={field.example || field.description} disabled={field.name === 'id'} />;
      case 'number':
        return <InputNumber
          style={{ width: '100%' }}
          placeholder={field.example || field.description}
          min={field.validation?.min}
          precision={field.isFee ? 2 : 0} 
        />;
      case 'textarea':
        return <TextArea rows={field.rows || 2} placeholder={field.example || field.description} />;
      case 'select':
        let optionsSource = field.options || [];
        if (field.name === 'status') optionsSource = statusOptions;
        if (field.name === 'condition') optionsSource = conditionOptions;
        if (field.name === 'allow_dropship_return') optionsSource = [{value: 'True', label: 'Yes'}, {value: 'False', label: 'No'}];

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

  const requiredFields = fieldsConfig ? fieldsConfig.filter(field => field.isMandatory && field.name !== 'id') : [];
  const otherFields = fieldsConfig ? fieldsConfig.filter(field => !field.isMandatory && field.name !== 'id') : [];

  const canUseAI = fieldsConfig && fieldsConfig.some(
    f => AI_INPUT_FIELDS.includes(f.name) || 
         ['title', 'short_desc', 'long_desc', 'key_features_1', 'key_features_2', 'key_features_3', 'key_features_4', 'key_features_5'].includes(f.name)
  );

  return (
    <Modal
      title={showAllMode ? 'View/Edit All SKU Fields' : (initialData ? 'Edit SKU' : 'Create SKU')}
      open={visible}
      onOk={handleOk} 
      onCancel={onClose}
      width="80vw"
      destroyOnClose
      maskClosable={false}
      footer={[
          <Button key="back" onClick={onClose}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk} loading={false}>
            {initialData ? 'Update' : 'Create'}
          </Button>,
        ]}
    >
      <Form form={form} layout="vertical" name="skuForm">
        {showAllMode && requiredFields.length > 0 && (
          <div style={{ marginBottom: '24px', border: '1px solid #d9d9d9', padding: '16px', borderRadius: '8px' }}>
            <Row align="middle" style={{ marginBottom: '16px' }}>
              <Col>
                <h3 style={{ marginTop: 0, marginBottom: 0, color: '#1890ff' }}>Required Fields (Mandatory)</h3>
              </Col>
              {canUseAI && (
                <Col style={{ marginLeft: '16px' }}> 
                  <Button
                    key="aiGenerateRequired"
                    onClick={handleAIGenerate}
                    loading={aiLoading}
                  >
                    ✨ Use AI description
                  </Button>
                </Col>
              )}
            </Row>
            <Row gutter={16}>
              {requiredFields.map((field) => (
                <Col span={field.gridWidth || 8} key={field.name}>
                  <Form.Item
                    name={field.name}
                    label={field.label}
                    rules={field.validation ?
                      Object.entries(field.validation).reduce((acc, [key, value]) => {
                          if (key === 'required' && value) {
                              acc.push({ required: true, message: field.validation.requiredMsg || `${field.label} is required!` });
                          } else if (key === 'pattern' && value) {
                              acc.push({ pattern: value, message: field.validation.patternMsg || 'Invalid format!' });
                          } else if (key === 'maxLength' && value) {
                              acc.push({ max: value, message: field.validation.maxLengthMsg || `Max ${value} characters!` });
                          } else if (key === 'min' && value !== undefined && (field.type === 'number' || field.isFee)) {
                              acc.push({ type: 'number', min: value, message: field.validation.minMsg || `Cannot be less than ${value}!` });
                          } else if (key === 'max' && value !== undefined && (field.type === 'number' || field.isFee)) {
                              acc.push({ type: 'number', max: value, message: field.validation.maxMsg || `Cannot be greater than ${value}!` });
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
              ))}
            </Row>
          </div>
        )}

        <div style={showAllMode ? { border: '1px solid #d9d9d9', padding: '16px', borderRadius: '8px' } : {}}>
            {showAllMode && <h3 style={{ marginTop: 0, color: '#1890ff' }}>Other Fields</h3>}
            <Row gutter={16}>
              {(showAllMode && fieldsConfig ? fieldsConfig : otherFields).map((field) => { // Added fieldsConfig check for safety
                if (!field || field.name === 'id') return null; 
                if (showAllMode && field.isMandatory) return null;

                return (
                  <React.Fragment key={field.name}>
                    <Col span={field.gridWidth || 8}>
                      <Form.Item
                        name={field.name}
                        label={field.label}
                        rules={field.validation ?
                            Object.entries(field.validation).reduce((acc, [key, value]) => {
                                if (key === 'required' && value) {
                                    acc.push({ required: true, message: field.validation.requiredMsg || `${field.label} is required!` });
                                } else if (key === 'pattern' && value) {
                                    acc.push({ pattern: value, message: field.validation.patternMsg || 'Invalid format!' });
                                } else if (key === 'maxLength' && value) {
                                    acc.push({ max: value, message: field.validation.maxLengthMsg || `Max ${value} characters!` });
                                } else if (key === 'min' && value !== undefined && (field.type === 'number' || field.isFee)) {
                                    acc.push({ type: 'number', min: value, message: field.validation.minMsg || `Cannot be less than ${value}!` });
                                } else if (key === 'max' && value !== undefined && (field.type === 'number' || field.isFee)) {
                                    acc.push({ type: 'number', max: value, message: field.validation.maxMsg || `Cannot be greater than ${value}!` });
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
                  </React.Fragment>
                );
              })}
            </Row>
        </div>
      </Form>
    </Modal>
  );
};

export default SkuFormModal;