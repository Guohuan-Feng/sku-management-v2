// src/components/EditableCell.jsx
import React from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import { fieldsConfig, statusOptions, conditionOptions } from './fieldConfig';
import { useTranslation } from 'react-i18next'; // 引入 useTranslation

const { Option } = Select;
const { TextArea } = Input;

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const { t } = useTranslation(); // 使用 useTranslation 钩子

  // 根据 dataIndex 从 fieldConfig 中找到对应的字段配置
  const field = fieldsConfig.find(f => f.name === dataIndex);

  // 根据 fieldConfig 中的 validation 规则动态生成 Ant Design 的 rules
  const rules = field?.validation ?
    Object.entries(field.validation).reduce((acc, [key, value]) => {
      if (key === 'required' && value) {
        // 翻译 requiredMsg，并传递 label 参数
        acc.push({ required: true, message: t(field.validation.requiredMsg, { label: t(field.label) }) });
      } else if (key === 'pattern' && value) {
        // 对于 patternMsg，需要根据实际内容判断是否需要传递参数
        const patternMsgKey = field.validation.patternMsg;
        let messageParams = {};
        if (patternMsgKey === 'validation.generalPattern' || patternMsgKey === 'validation.maxCharacters') {
          messageParams = { count: field.validation.maxLength };
        }
        acc.push({ pattern: value, message: t(patternMsgKey, messageParams) });
      } else if (key === 'maxLength' && value) {
        // 翻译 maxLengthMsg，并传递 count 参数
        acc.push({ max: value, message: t(field.validation.maxLengthMsg, { count: value }) });
      } else if (key === 'min' && value !== undefined && (field.type === 'number' || field.isFee)) {
        // 翻译 minMsg，并传递 value 参数
        acc.push({ type: 'number', min: value, message: t(field.validation.minMsg, { value: value }) });
      } else if (key === 'max' && value !== undefined && (field.type === 'number' || field.isFee)) {
        // 翻译 maxMsg，并传递 value 参数
        acc.push({ type: 'number', max: value, message: t(field.validation.maxMsg, { value: value }) });
      }
      return acc;
    }, [])
    : [];

  // 根据字段类型选择合适的输入组件
  const inputNode = () => {
    // 提取 placeholder 文本
    const placeholderText = field?.example || field?.description || '';

    switch (field?.type) {
      case 'text':
        return <Input placeholder={placeholderText} />;
      case 'number':
        return <InputNumber
          style={{ width: '100%' }}
          placeholder={placeholderText}
          min={field.validation?.min}
          precision={field.isFee ? 2 : 0}
        />;
      case 'textarea':
        return <TextArea rows={field?.rows || 1} placeholder={placeholderText} />; // 行内编辑时通常不需要太多行
      case 'select':
        let optionsSource = field?.options || [];
        // statusOptions 和 conditionOptions 的 label 已经是可读的字符串，无需再次翻译
        if (field.name === 'status') optionsSource = statusOptions;
        if (field.name === 'condition') optionsSource = conditionOptions;
        if (field.name === 'allow_dropship_return') optionsSource = [{value: 'True', label: 'Yes'}, {value: 'False', label: 'No'}]; // 这里的 Yes/No 可以考虑翻译

        return (
          <Select placeholder={placeholderText}>
            {optionsSource.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {/* 如果 Select 选项的 label 也需要翻译，可以在这里 t(opt.label) */}
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

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={rules}
          valuePropName={field?.type === 'select' || field?.name === 'allow_dropship_return' ? 'value' : undefined}
        >
          {inputNode()}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

export default EditableCell;