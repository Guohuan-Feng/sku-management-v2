// src/components/EditableCell.jsx
import React from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import { fieldsConfig, statusOptions, conditionOptions } from './fieldConfig'; // 引入 fieldConfig

const { Option } = Select;
const { TextArea } = Input;

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record, // record 现在代表原始数据，不是编辑中的实时数据
  index,
  children,
  ...restProps
}) => {
  // 根据 dataIndex 从 fieldConfig 中找到对应的字段配置
  const field = fieldsConfig.find(f => f.name === dataIndex);

  // 根据 fieldConfig 中的 validation 规则动态生成 Ant Design 的 rules
  const rules = field?.validation ?
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