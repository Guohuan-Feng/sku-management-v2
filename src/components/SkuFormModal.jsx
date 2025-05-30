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
  fieldsConfig,
  statusOptions,
  conditionOptions,
  apiFieldErrors,
  showAllMode = false,
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
    try {
      const currentValues = form.getFieldsValue(AI_INPUT_FIELDS);
      const payload = {};
      for (const key in currentValues) {
        if (currentValues[key] !== undefined && currentValues[key] !== null && String(currentValues[key]).trim() !== '') {
          payload[key] = currentValues[key];
        }
      }

      if (Object.keys(payload).length === 0) {
        message.warning('Please enter some product information for AI to generate a description.');
        return;
      }

      setAiLoading(true);
      const aiResponse = await generateAIDescription(payload);
      console.log('AI Response from backend:', aiResponse); 

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
      console.log('Data being set to form:', filteredFieldsToUpdate); 

      form.setFieldsValue(filteredFieldsToUpdate);
      message.success('AI successfully generated description information!');

    } catch (error) {
      console.error('AI description generation failed:', error);
      message.error(`AI description generation failed: ${error.message || 'Please try again later'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const renderField = (field) => {
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

  const requiredFields = fieldsConfig.filter(field => field.isMandatory && field.name !== 'id');
  const otherFields = fieldsConfig.filter(field => !field.isMandatory && field.name !== 'id');

  const canUseAI = fieldsConfig.some(
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
            {/* Updated Row for title and AI button */}
            <Row align="middle" style={{ marginBottom: '16px' }}>
              <Col>
                <h3 style={{ marginTop: 0, marginBottom: 0, color: '#1890ff' }}>Required Fields (Mandatory)</h3>
              </Col>
              {canUseAI && (
                <Col style={{ marginLeft: '16px' }}> {/* Added marginLeft for spacing */}
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
              {(showAllMode ? fieldsConfig : otherFields).map((field) => {
                if (field.name === 'id') return null; 
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