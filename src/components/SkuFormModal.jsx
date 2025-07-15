// src/components/SkuFormModal.jsx
import { Modal, Form, Input, Select, InputNumber, Button, Row, Col, message } from 'antd';
import { useEffect, useState } from 'react'; // 引入 useEffect 和 useState
import { generateAIDescription, translateProductName } from '../services/skuApiService';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { fieldsConfig, statusOptions, conditionOptions } from './fieldConfig'; // 确保导入 fieldsConfig
import ImageUploadCell from './ImageUploadCell';

const { Option } = Select;
const { TextArea } = Input;

const AI_INPUT_FIELDS = [
  'product_en_name', 'brand', 'category', 'sub_category', 'color', 'size',
  'product_class', 'group', 'sub_group', 'style', 'sub_style', 'model',
  'gender', 'keywords'
];

const LOCAL_STORAGE_KEY = 'tempSkuFormData'; // 定义 localStorage 的键名

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
  const [uploadedImageIds, setUploadedImageIds] = useState([]);
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [aiLoading, setAiLoading] = useState(false);
  const [translateLoading, setTranslateLoading] = useState(false); // 新增翻译加载状态

  // 改进的 useEffect，用于处理表单数据的加载和保存
  useEffect(() => {
    if (visible) {
      if (initialData) {
        // 如果是编辑模式，加载 initialData
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
          if (field.type === 'url' && (formData[field.name] === null || formData[field.name] === undefined)) {
            formData[field.name] = '';
          }
          // 将 null 转换为 ''，以便在输入框中显示为空
          const currentFieldConfig = fieldsConfig.find(f => f.name === field.name);
          if (currentFieldConfig && typeof formData[field.name] === 'object' && formData[field.name] === null) {
              formData[field.name] = '';
          }
        });
        form.setFieldsValue(formData);
      } else {
        // 如果是新增模式，尝试从 localStorage 加载临时保存的数据
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            // 确保加载的数据符合字段配置的类型要求
            const loadedFormData = {};
            fieldsConfig.forEach(field => {
                let value = parsedData[field.name];
                if (value !== undefined && value !== null) {
                    if (field.type === 'select') {
                        loadedFormData[field.name] = String(value);
                    } else if (field.type === 'number') {
                        const numValue = parseFloat(value);
                        loadedFormData[field.name] = isNaN(numValue) ? null : numValue;
                    } else if (field.name === 'allow_dropship_return') {
                        loadedFormData[field.name] = String(value);
                    } else if (field.type === 'url') {
                        loadedFormData[field.name] = String(value).trim() === '' ? '' : value;
                    } else {
                        loadedFormData[field.name] = value;
                    }
                } else if (field.type === 'url') {
                    loadedFormData[field.name] = ''; // URL字段默认显示为空字符串
                }
                // 将 null 转换为 ''，以便在输入框中显示为空
                const currentFieldConfig = fieldsConfig.find(f => f.name === field.name);
                if (currentFieldConfig && typeof loadedFormData[field.name] === 'object' && loadedFormData[field.name] === null) {
                    loadedFormData[field.name] = '';
                }
            });
            form.setFieldsValue(loadedFormData);
            message.info(t('messages.tempDataLoaded')); // 提示用户数据已加载
          } catch (e) {
            console.error("Failed to parse saved form data:", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY); // 解析失败则清除无效数据
          }
        } else {
          // 如果没有临时数据，则设置默认值
          const defaultValues = {};
          fieldsConfig.forEach(field => {
            if (field.defaultValue !== undefined) {
              defaultValues[field.name] = field.defaultValue;
            }
            if (field.name === 'allow_dropship_return' && field.defaultValue !== undefined) {
              defaultValues[field.name] = String(field.defaultValue);
            }
            if (field.type === 'url') {
                defaultValues[field.name] = '';
            }
            // 将 null 转换为 ''，以便在输入框中显示为空
            const currentFieldConfig = fieldsConfig.find(f => f.name === field.name);
            if (currentFieldConfig && typeof defaultValues[field.name] === 'object' && defaultValues[field.name] === null) {
                defaultValues[field.name] = '';
            }
          });
          form.setFieldsValue(defaultValues);
        }
      }
    } else {
      // 模态框关闭时，如果不是编辑现有 SKU 且表单有内容，则进行临时保存
      if (!initialData) {
        const currentValues = form.getFieldsValue(true); // 获取所有字段值
        const isEmpty = Object.values(currentValues).every(val => val === undefined || val === null || (typeof val === 'string' && val.trim() === ''));

        if (!isEmpty) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentValues));
            message.info(t('messages.tempDataSaved'));
        } else {
            localStorage.removeItem(LOCAL_STORAGE_KEY); // 如果表单是空的，则清除旧的临时数据
        }
      }
      form.resetFields(); // 无论是否保存，关闭时重置表单
    }
  }, [visible, initialData, form, fieldsConfig, t]);

  useEffect(() => {
    if (apiFieldErrors && apiFieldErrors.length > 0) {
      const antdFieldErrors = apiFieldErrors.map(err => ({
        name: err.loc[err.loc.length - 1],
        errors: [err.msg],
      }));
      form.setFields(antdFieldErrors);
    }
  }, [apiFieldErrors, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
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
        // 新增逻辑：如果字段不是强制必填且其值为字符串且为空，则将其设为 null
        const currentFieldConfig = fieldsConfig.find(f => f.name === field.name);
        if (currentFieldConfig && !currentFieldConfig.isMandatory && typeof submissionValues[field.name] === 'string' && submissionValues[field.name].trim() === '') {
            submissionValues[field.name] = null;
        }
        if (field.type === 'url') {
          if (submissionValues[field.name] === null || submissionValues[field.name] === undefined || String(submissionValues[field.name]).trim() === '') {
            submissionValues[field.name] = null;
          }
        }
      });

      // 添加已上传的图片ID到提交数据中
      const submissionData = {
        ...submissionValues,
        uploadedImageIds: uploadedImageIds
      };

      const success = await onSubmit(submissionData, initialData); // 传递 initialData 以便判断是创建还是更新
      if (success) {
        localStorage.removeItem(LOCAL_STORAGE_KEY); // 成功提交后清除临时数据
        form.resetFields();
        setUploadedImageIds([]); // 清除已上传的图片ID
      }
    } catch (info) {
      console.log('Validate Failed (Frontend Validation Failed):', info);
    }
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

  // 新增翻译产品名函数
  const handleTranslateProductName = async () => {
    const productCnName = form.getFieldValue('product_cn_name');
    // --- START DEBUG LOG ---
    console.log('Product Chinese Name before API call:', productCnName);
    // --- END DEBUG LOG ---

    if (!productCnName || productCnName.trim() === '') {
      message.warning(t('messages.inputChineseNameFirst'));
      return;
    }

    try {
      setTranslateLoading(true);
      const response = await translateProductName(productCnName);
      if (response && response.product_en_name) {
        form.setFieldsValue({ product_en_name: response.product_en_name });
        message.success(t('messages.translationSuccess'));
      } else {
        message.error(t('messages.translationFailed'));
      }
    } catch (error) {
      console.error('Error translating product name:', error);
      message.error(`${t('messages.translationError')}${error.message || '请稍后再试'}`);
    } finally {
      setTranslateLoading(false);
    }
  };

  const renderField = (field) => {
    const placeholderText = field?.example || field?.description || '';

    // 特殊处理main_image字段
    if (field.name === 'main_image') {
      return (
        <ImageUploadCell
          value={form.getFieldValue(field.name)}
          onChange={(url, imageId) => {
            form.setFieldsValue({ [field.name]: url });
            if (imageId) {
              setUploadedImageIds(prev => [...prev, imageId]);
            }
          }}
          record={{ id: initialData?.id }}
          fieldName="main_image"
        />
      );
    }

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
  const canTranslate = fieldsConfig && fieldsConfig.some(f => f.name === 'product_cn_name') && fieldsConfig.some(f => f.name === 'product_en_name');

  // 新增清除临时保存数据的函数
  const clearTempData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    form.resetFields(); // 清除表单内容
    message.success(t('messages.tempDataCleared'));
  };

  return (
    <Modal
      title={showAllMode ? t('modalTitles.viewEditAll') : (initialData ? t('modalTitles.editSku') : t('modalTitles.createSku'))}
      open={visible}
      onOk={handleOk}
      onCancel={onClose} // onClose 会触发 useEffect 中的保存逻辑
      width="80vw"
      destroyOnClose={!initialData} // 如果是新增模式（没有 initialData），关闭时销毁组件以确保重新加载时不保留旧状态
      maskClosable={false}
      footer={[
          // 在新增模式下才显示“清除临时保存”按钮
          !initialData && <Button key="clearTemp" onClick={clearTempData}>
            {t('modalButtons.clearTempData')}
          </Button>,
          <Button key="back" onClick={onClose}>
            {t('modalButtons.cancel')}
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk} loading={aiLoading}>
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
              {/* 新增翻译产品名按钮 */}
              {canTranslate && (
                <Col style={{ marginLeft: '16px' }}>
                  <Button
                    key="translateProductName"
                    onClick={handleTranslateProductName}
                    loading={translateLoading}
                  >
                    {t('中文产品名字翻译为英文')}
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