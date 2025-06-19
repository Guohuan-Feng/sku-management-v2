// src/components/SkuFormModal.jsx
import { Modal, Form, Input, Select, InputNumber, Button, Row, Col, message } from 'antd';
import { useEffect, useState } from 'react';
import { generateAIDescription } from '../services/skuApiService';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation(); // 使用 useTranslation 钩子
  const [form] = Form.useForm();
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        const formData = { ...initialData };
        fieldsConfig.forEach(field => {
          if (field.type === 'select') {
             if (formData[field.name] !== undefined && formData[field.name] !== null) {
                formData[field.name] = String(formData[field.name]);
             }
          } else if (field.type === 'number' && formData[field.name] !== undefined && formData[field.name] !== null) {
            const numValue = parseFloat(formData[field.name]);
            formData[field.name] = isNaN(numValue) ? null : numValue;
          }
          // 初始化时将 null 或 undefined 的 URL 字段设置为空字符串，以便 Ant Design Form 正确显示
          if (field.type === 'url' && (formData[field.name] === null || formData[field.name] === undefined)) {
            formData[field.name] = '';
          }
          // 初始化时将 null 或 undefined 的 text/textarea 字段设置为空字符串
          if ((field.type === 'text' || field.type === 'textarea') && (formData[field.name] === null || formData[field.name] === undefined)) {
            formData[field.name] = '';
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
          // 初始化时将 null 或 undefined 的 URL 字段设置为空字符串
          if (field.type === 'url') {
            defaultValues[field.name] = ''; // URL字段默认显示为空字符串
          }
          // 初始化时将 null 或 undefined 的 text/textarea 字段设置为空字符串
          if (field.type === 'text' || field.type === 'textarea') {
            defaultValues[field.name] = '';
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
          // 如果 URL 字段为空字符串、undefined 或 null，将其设置为 null
          if (field.type === 'url') {
            if (submissionValues[field.name] === null || submissionValues[field.name] === undefined || String(submissionValues[field.name]).trim() === '') {
              submissionValues[field.name] = null;
            }
          }
          // 如果非强制必填的 text 或 textarea 字段为空字符串或只含空白符，将其设置为 null
          if ((field.type === 'text' || field.type === 'textarea')) {
            if (submissionValues[field.name] !== undefined && submissionValues[field.name] !== null && String(submissionValues[field.name]).trim() === '') {
              submissionValues[field.name] = null;
            }
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
    if (!fieldsConfig || !Array.isArray(fieldsConfig) || fieldsConfig.length === 0) {
      message.error(t('aiDescription.configError'));
      return;
    }

    const currentFormValues = form.getFieldsValue(AI_INPUT_FIELDS);

    const fieldDetails = AI_INPUT_FIELDS.map(fieldName => {
      const fieldConfigItem = fieldsConfig.find(f => f.name === fieldName);
      const label = fieldConfigItem ? t(fieldConfigItem.label) : fieldName;
      const value = currentFormValues[fieldName];
      const isFilled = value !== undefined && value !== null && String(value).trim() !== '';
      return { name: fieldName, label, isFilled };
    });

    const filledFields = fieldDetails.filter(f => f.isFilled);
    const missingFields = fieldDetails.filter(f => !f.isFilled);

    let messageParts = [];
    if (missingFields.length > 0) {
      messageParts.push(`${t('aiDescription.suggestMissingFields')}\n- ${missingFields.map(f => f.label).join('\n- ')}`);
    } else {
      messageParts.push(t('aiDescription.allRecommendedFieldsFilled'));
    }

    if (filledFields.length > 0) {
      messageParts.push(`\n${t('aiDescription.currentFilledFields')}\n- ${filledFields.map(f => f.label).join('\n- ')}`);
    } else if (missingFields.length > 0) {
      messageParts.push(`\n${t('aiDescription.noRecommendedFieldsFilled')}`);
    }

    const confirmDialogContent = messageParts.join('\n');

    Modal.confirm({
      title: t('aiDescription.confirmGenerateTitle'),
      content: <div style={{ whiteSpace: 'pre-line' }}>{confirmDialogContent + `\n\n${t('aiDescription.continueGenerate')}`}</div>,
      okText: t('aiDescription.generate'),
      cancelText: t('modalButtons.cancel'),
      maskClosable: true,
      onOk: async () => {
        const payload = {};
        AI_INPUT_FIELDS.forEach(fieldName => {
          const value = currentFormValues[fieldName];
          if (value !== undefined && value !== null && String(value).trim() !== '') {
            payload[fieldName] = String(value).trim();
          }
        });

        if (Object.keys(payload).length === 0) {
          message.warning(t('aiDescription.noProductInfoForAI'));
          return;
        }

        try {
          setAiLoading(true);
          const aiResponse = await generateAIDescription(payload);

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

          form.setFieldsValue(filteredFieldsToUpdate);
          message.success(t('aiDescription.aiDescSuccess'));

        } catch (error) {
          console.error('Error in Modal.confirm onOk during AI call:', error);
          message.error(`${t('aiDescription.aiDescError')}${error.message || '请稍后再试'}`);
        } finally {
          setAiLoading(false);
        }
      },
      onCancel: () => {
        // Cancel logic
      },
    });
  };

  const renderField = (field) => {
    // 提取 placeholder 文本
    const placeholderText = field?.example || field?.description || '';

    switch (field.type) {
      case 'text':
        return <Input placeholder={placeholderText} disabled={field.name === 'id'} />;
      case 'number':
        return <InputNumber
          style={{ width: '100%' }}
          placeholder={placeholderText}
          min={field.validation?.min}
          precision={field.isFee ? 2 : 0}
        />;
      case 'textarea':
        return <TextArea rows={field.rows || 2} placeholder={placeholderText} />;
      case 'select':
        let optionsSource = field.options || [];
        if (field.name === 'status') optionsSource = statusOptions;
        if (field.name === 'condition') optionsSource = conditionOptions;
        if (field.name === 'allow_dropship_return') optionsSource = [{value: 'True', label: 'Yes'}, {value: 'False', label: 'No'}];

        return (
          <Select placeholder={placeholderText}>
            {optionsSource.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );
      case 'url':
        return <Input type="url" placeholder={placeholderText} />;
      default:
        return <Input placeholder={placeholderText} />;
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
      title={showAllMode ? t('modalTitles.viewEditAll') : (initialData ? t('modalTitles.editSku') : t('modalTitles.createSku'))}
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      width="80vw"
      destroyOnClose
      maskClosable={false}
      footer={[
          <Button key="back" onClick={onClose}>
            {t('modalButtons.cancel')}
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk} loading={false}>
            {initialData ? t('modalButtons.update') : t('modalButtons.create')}
          </Button>,
        ]}
    >
      <Form form={form} layout="vertical" name="skuForm">
        {showAllMode && requiredFields.length > 0 && (
          <div style={{ marginBottom: '24px', border: '1px solid #d9d9d9', padding: '16px', borderRadius: '8px' }}>
            <Row align="middle" style={{ marginBottom: '16px' }}>
              <Col>
                <h3 style={{ marginTop: 0, marginBottom: 0, color: '#1890ff' }}>{t('modalSections.requiredFields')}</h3>
              </Col>
              {canUseAI && (
                <Col style={{ marginLeft: '16px' }}>
                  <Button
                    key="aiGenerateRequired"
                    onClick={handleAIGenerate}
                    loading={aiLoading}
                  >
                    {t('aiDescription.useAI')}
                  </Button>
                </Col>
              )}
            </Row>
            <Row gutter={16}>
              {requiredFields.map((field) => (
                <Col span={field.gridWidth || 8} key={field.name}>
                  <Form.Item
                    name={field.name}
                    label={t(field.label)}
                    rules={field.validation ?
                      Object.entries(field.validation).reduce((acc, [key, value]) => {
                          if (key === 'required' && value) {
                              acc.push({ required: true, message: t(field.validation.requiredMsg, { label: t(field.label) }) });
                          } else if (key === 'pattern' && value) {
                              const patternMsgKey = field.validation.patternMsg;
                              let messageParams = {};
                              if (patternMsgKey === 'validation.generalPattern' || patternMsgKey === 'validation.maxCharacters') {
                                messageParams = { count: field.validation.maxLength };
                              }
                              acc.push({ pattern: value, message: t(patternMsgKey, messageParams) });
                          } else if (key === 'maxLength' && value) {
                              acc.push({ max: value, message: t(field.validation.maxLengthMsg, { count: value }) });
                          } else if (key === 'min' && value !== undefined && (field.type === 'number' || field.isFee)) {
                              acc.push({ type: 'number', min: value, message: t(field.validation.minMsg, { value: value }) });
                          } else if (key === 'max' && value !== undefined && (field.type === 'number' || field.isFee)) {
                              acc.push({ type: 'number', max: value, message: t(field.validation.maxMsg, { value: value }) });
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
            {showAllMode && <h3 style={{ marginTop: 0, color: '#1890ff' }}>{t('modalSections.otherFields')}</h3>}
            <Row gutter={16}>
              {(showAllMode && fieldsConfig ? fieldsConfig : otherFields).map((field) => {
                if (!field || field.name === 'id') return null;
                if (showAllMode && field.isMandatory) return null;

                return (
                  <React.Fragment key={field.name}>
                    <Col span={field.gridWidth || 8}>
                      <Form.Item
                        name={field.name}
                        label={t(field.label)}
                        rules={field.validation ?
                            Object.entries(field.validation).reduce((acc, [key, value]) => {
                                if (key === 'required' && value) {
                                    acc.push({ required: true, message: t(field.validation.requiredMsg, { label: t(field.label) }) });
                                } else if (key === 'pattern' && value) {
                                    const patternMsgKey = field.validation.patternMsg;
                                    let messageParams = {};
                                    if (patternMsgKey === 'validation.generalPattern' || patternMsgKey === 'validation.maxCharacters') {
                                        messageParams = { count: field.validation.maxLength };
                                    }
                                    acc.push({ pattern: value, message: t(patternMsgKey, messageParams) });
                                } else if (key === 'maxLength' && value) {
                                    acc.push({ max: value, message: t(field.validation.maxLengthMsg, { count: value }) });
                                } else if (key === 'min' && value !== undefined && (field.type === 'number' || field.isFee)) {
                                    acc.push({ type: 'number', min: value, message: t(field.validation.minMsg, { value: value }) });
                                } else if (key === 'max' && value !== undefined && (field.type === 'number' || field.isFee)) {
                                    acc.push({ type: 'number', max: value, message: t(field.validation.maxMsg, { value: value }) });
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