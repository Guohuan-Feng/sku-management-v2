// src/components/fieldConfig.js

// --- Helper data and enums ---
export const statusOptions = [ // 确保已导出，如果SKUForm等组件直接引用的话
  { value: '0', label: 'Active' }, { value: '1', label: 'Inactive' },
  { value: '2', label: 'Discontinued' }, { value: '3', label: 'Closeout' },
  { value: '4', label: 'Liquidation' }, { value: '5', label: 'Prelimnry' },
  { value: '11', label: 'New' }, { value: '12', label: 'Promotional' },
];

export const conditionOptions = [ // 确保已导出
  { value: '0', label: 'New' }, { value: '1', label: 'Used' },
  { value: '2', label: 'Refurbished' }, { value: '4', label: 'Reconditioned' },
  { value: '8', label: 'LikeNew' }, { value: '9', label: 'UsedGood' },
  { value: '10', label: 'UsedPoor' }, { value: '11', label: 'Damaged' },
];

// --- Patterns (保持您提供的所有pattern定义) ---
export const nrfCodePattern = /^[a-zA-Z0-9\- ]*$/;
export const noLeadingZeroAndNoSpecialCharsPattern = /^[a-zA-Z1-9][a-zA-Z0-9-]*$/;
export const backendLimitedStrEngPattern = /^[a-zA-Z0-9\- ]*$/;
export const backendLimitedStrEngPatternNotEmpty = /^[a-zA-Z0-9\- ]+$/;
export const backendLimitedStrChPattern = /^[\u4e00-\u9fa5a-zA-Z0-9 ]*$/;
export const backendLimitedStrChPatternNotEmpty = /^[\u4e00-\u9fa5a-zA-Z0-9 ]+$/;
export const generalTextWithSpecialCharsPattern = /^[\x00-\x7F\s\u4e00-\u9fa5_&',.\/\(\)]*$/;
export const imageUrlPattern = /^https?:\/\/.+/i;
export const videoUrlPattern = /^https?:\/\/.+/i;
export const fourDigitYearPattern = /^\d{4}$/;
export const upcPattern = /^\d{12}$/;
export const positiveIntegerPattern = /^[1-9]\d*$/;
export const nonNegativeIntegerPattern = /^\d+$/;
export const pricePattern = /^\d+(\.\d{1,2})?$/;
export const percentageInputPattern = /^\d*\.?\d*%?$/;
export const percentageValidationPattern = /^(\d{1,2}(\.\d{1,2})?|100)$/;
export const harmonizedCodePattern = /^[0-9A-Za-z.\-]+$/;


// List of mandatory field names from the CSV
const mandatoryFieldsFromCSV = [
  'vendor_sku', 'product_name', 'dropship_price', 'allow_dropship_return', 'condition',
  'UOM', 'ship_from', 'ship_to', 'ship_carrier', 'title', 'short_desc',
  'keywords', 'key_features_1', 'key_features_2', 'main_image', 'full_image', 'thumbnail_image'
];

// Helper function to create validation object
const createValidation = (field) => {
  const isMandatoryByList = mandatoryFieldsFromCSV.includes(field.name);
  const validation = { ...(field.origValidation || {}) };

  // If the field is explicitly marked as required in its original validation, respect that.
  const isOrigRequired = field.origValidation && field.origValidation.required;

  if (isMandatoryByList || isOrigRequired) {
    validation.requiredMsg = validation.requiredMsg || `${field.label} 是必填项。`;
    // Ensure 'required' boolean flag is present for AntD rules if relying on it
    validation.required = true; 
  } else {
    // If not mandatory by list and not in origValidation, remove any accidental requiredMsg
    // and ensure required flag is false.
    delete validation.requiredMsg;
    validation.required = false; 
  }
  return validation;
};

// Temporary array to hold original structures before adjusting isMandatory
// *** 请将您完整的 tempFieldsConfig 数组粘贴到这里 ***
// *** 并为每个字段添加 gridWidth 属性，例如 gridWidth: 8 (1/3行), 12 (1/2行), 24 (整行) ***
const tempFieldsConfig = [
  {
    name: 'vendor_sku', label: 'Vendor SKU', type: 'text', gridWidth: 8,
    origValidation: { required: true, pattern: noLeadingZeroAndNoSpecialCharsPattern, patternMsg: '无效SKU格式 (不能以0开头, 除连字符外无特殊字符)。最多100字符。', maxLength: 100 },
    description: '供应商提供的唯一产品标识符。', example: 'ABC-12345-XYZ'
  },
  {
    name: 'UPC', label: 'UPC', type: 'text', gridWidth: 8,
    origValidation: { pattern: upcPattern, patternMsg: '如果提供，UPC必须是12位数字。', maxLength: 12 },
    description: '通用产品代码 (12位数字)。', example: '123456789012'
  },
  {
    name: 'product_name', label: 'Product Name', type: 'text', gridWidth: 8,
    origValidation: { required: true, maxLength: 100, pattern: backendLimitedStrChPatternNotEmpty, patternMsg: '产品名称允许中文、字母、数字、空格。最多100字符。' },
    description: '完整的产品名称。', example: '示例产品名称'
  },
  {
    name: 'status', label: 'Status', type: 'select', gridWidth: 8,
    options: statusOptions, defaultValue: '0',
    origValidation: {}, // Status is usually required implicitly by having a default
    description: '产品状态。后端期望整数。'
  },
  {
    name: 'ATS', label: 'ATS', type: 'number', gridWidth: 8,
    origValidation: { min: 0, pattern: nonNegativeIntegerPattern, patternMsg: 'ATS必须是非负整数。', minMsg:'ATS不能为负。' }, // 允许ATS为0
    description: '可销售数量。', example: '100'
  },
  {
    name: 'dropship_price', label: 'Dropship Price', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { required: true, min: 0, pattern: pricePattern, patternMsg: '无效价格格式 (例如, 10.99)。', minMsg:'价格不能为负。' },
    description: '供应商一件代发价格。', example: '50.00'
  },
  {
    name: 'MSRP', label: 'MSRP', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: '无效价格格式。', minMsg:'价格不能为负。' },
    description: '制造商建议零售价。', example: '70.00'
  },
  {
    name: 'HDL_for_shipping', label: 'HDL for Shipping', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: '无效费用格式。', minMsg:'费用不能为负。' },
    description: '运输处理费。', example: '5.50'
  },
  {
    name: 'HDL_for_receiving', label: 'HDL for Receiving', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: '无效费用格式。', minMsg:'费用不能为负。' },
    description: '接收处理费。', example: '2.00'
  },
  {
    name: 'HDL_for_returning', label: 'HDL for Returning', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: '无效费用格式。', minMsg:'费用不能为负。' },
    description: '退货处理费。', example: '3.50'
  },
  {
    name: 'storage_monthly', label: 'Storage Monthly', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: '无效费用格式。', minMsg:'费用不能为负。' },
    description: '每单位月度仓储费。', example: '1.25'
  },
  {
    name: 'allow_dropship_return', label: 'Allow Dropship Return', type: 'select', gridWidth: 8,
    options: [{ value: 'True', label: '是' }, { value: 'False', label: '否' }], defaultValue: 'False',
    origValidation: { required: true }, // This is in mandatoryFieldsFromCSV
    description: '是否允许一件代发退货？'
  },
  {
    name: 'shipping_lead_time', label: 'Shipping Lead Time (Days)', type: 'number', gridWidth: 8,
    origValidation: { min: 0, pattern: nonNegativeIntegerPattern, patternMsg: '必须是非负整数。', minMsg:'不能为负。' },
    description: '从订单到发货的天数。', example: '3'
  },
  {
    name: 'division', label: 'Division', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品部门。', example: 'Electronics'
  },
  {
    name: 'department', label: 'Department', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品部。', example: 'Audio Equipment'
  },
  {
    name: 'category', label: 'Category', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '主要产品类别。', example: 'Headphones'
  },
  {
    name: 'sub_category', label: 'Sub Category', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品子类别。', example: 'Wireless Headphones'
  },
  {
    name: 'product_class', label: 'Product Class', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品分类。', example: 'Consumer Electronics'
  },
  {
    name: 'group', label: 'Group', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品组。', example: 'Audio Devices'
  },
  {
    name: 'subgroup', label: 'Subgroup', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品子组。', example: 'Bluetooth Audio'
  },
  {
    name: 'style', label: 'Style', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品风格。', example: 'Over-ear'
  },
  {
    name: 'sub_style', label: 'Sub Style', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品子风格。', example: 'Noise Cancelling'
  },
  {
    name: 'brand', label: 'Brand', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品品牌。', example: 'Sony'
  },
  {
    name: 'model', label: 'Model', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品型号。', example: 'WH-1000XM5'
  },
  {
    name: 'color', label: 'Color', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品颜色。', example: 'Black'
  },
  {
    name: 'size', label: 'Size', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: '产品尺寸（如适用）。', example: 'One Size'
  },
  { name: 'option_1', label: 'Option 1', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'无效字符。', maxLengthMsg:'最多50' }, description:'自定义选项1' },
  { name: 'option_2', label: 'Option 2', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'无效字符。', maxLengthMsg:'最多50' }, description:'自定义选项2' },
  { name: 'option_3', label: 'Option 3', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'无效字符。', maxLengthMsg:'最多50' }, description:'自定义选项3' },
  { name: 'option_4', label: 'Option 4', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'无效字符。', maxLengthMsg:'最多50' }, description:'自定义选项4' },
  { name: 'option_5', label: 'Option 5', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'无效字符。', maxLengthMsg:'最多50' }, description:'自定义选项5' },
  {
    name: 'gender', label: 'Gender', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 20, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多20字符。' },
    description: '目标性别。', example: 'Unisex'
  },
  {
    name: 'age_group', label: 'Age Group', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '目标年龄组。', example: 'Adult'
  },
  {
    name: 'country_of_region', label: 'Country of Origin', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '制造国。', example: 'USA'
  },
  {
    name: 'color_code_NRF', label: 'Color Code NRF', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: nrfCodePattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: 'NRF标准颜色代码。', example: 'BLK001'
  },
  {
    name: 'color_desc', label: 'Color Description', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 20, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多20字符。' },
    description: '颜色描述。', example: 'Midnight Black'
  },
  {
    name: 'size_code_NRF', label: 'Size Code NRF', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: nrfCodePattern, patternMsg: '允许：字母、数字、连字符、空格。', maxLengthMsg: '最多50字符。' },
    description: 'NRF标准尺寸代码。', example: 'LGE 010'
  },
  {
    name: 'size_desc', label: 'Size Description', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '详细尺寸描述。', example: 'Large'
  },
  {
    name: 'manufacturer', label: 'Manufacturer', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '产品制造商。', example: 'Acme Corp'
  },
  {
    name: 'OEM', label: 'OEM', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '原始设备制造商。', example: 'OEM Inc'
  },
  {
    name: 'product_year', label: 'Product Year', type: 'text', gridWidth: 8,
    origValidation: { pattern: fourDigitYearPattern, patternMsg: '请输入4位年份 (例如, "2023")。' },
    description: '制造年份 (例如, "2023")。', example: '2023'
  },
  {
    name: 'condition', label: 'Condition', type: 'select', gridWidth: 8,
    options: conditionOptions, defaultValue: '0',
    origValidation: { required: true }, // This is in mandatoryFieldsFromCSV
    description: '产品状况。后端期望整数。'
  },
  {
    name: 'prepack_code', label: 'Prepack Code', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '预包装代码（如适用）。', example: 'PPK-007'
  },
  {
    name: 'remark', label: 'Remark', type: 'textarea', rows: 2, gridWidth: 24, // Textarea might take full width
    origValidation: { maxLength: 100, pattern: generalTextWithSpecialCharsPattern, patternMsg:'备注中包含无效字符。', maxLengthMsg:'最多100字符。' },
    description: '附加备注。', example: '限量版发行'
  },
  {
    name: 'harmonized_code', label: 'Harmonized Code', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: harmonizedCodePattern, patternMsg:'无效的海关编码格式 (允许数字, 字母, 点, 连字符)。', maxLengthMsg:'最多50字符。' },
    description: '海关协调制度编码。', example: '8517.12.0050'
  },
  {
    name: 'UOM', label: 'UOM', type: 'text', gridWidth: 8,
    origValidation: { required: true, maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '计量单位。', example: 'Each'
  },
  {
    name: 'net_weight', label: 'Net Weight', type: 'number', gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'无效重量格式 (例如, 0.5)。', minMsg:'必须 > 0。' },
    description: '产品净重 (例如, kg 或 lb)。', example: '0.25'
  },
  {
    name: 'gross_weight', label: 'Gross Weight', type: 'number', gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'无效重量格式。', minMsg:'必须 > 0。' },
    description: '产品毛重 (含包装)。', example: '0.35'
  },
  {
    name: 'product_height', label: 'Product Height', type: 'number', gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'无效尺寸格式。', minMsg:'必须 > 0。' },
    description: '产品高度 (例如, cm 或 in)。', example: '15.0'
  },
  {
    name: 'product_length', label: 'Product Length', type: 'number', gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'无效尺寸格式。', minMsg:'必须 > 0。' },
    description: '产品长度。', example: '7.0'
  },
  {
    name: 'product_width', label: 'Product Width', type: 'number', gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'无效尺寸格式。', minMsg:'必须 > 0。' },
    description: '产品宽度。', example: '1.0'
  },
  {
    name: 'box_height', label: 'Box Height', type: 'number', gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'无效尺寸格式。', minMsg:'必须 > 0。' },
    description: '包装盒高度。', example: '18.0'
  },
  {
    name: 'box_length', label: 'Box Length', type: 'number', gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'无效尺寸格式。', minMsg:'必须 > 0。' },
    description: '包装盒长度。', example: '10.0'
  },
  {
    name: 'box_width', label: 'Box Width', type: 'number', gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'无效尺寸格式。', minMsg:'必须 > 0。' },
    description: '包装盒宽度。', example: '3.0'
  },
  {
    name: 'qty_case', label: 'Qty/Case', type: 'number', gridWidth: 8,
    origValidation: { min:1, pattern: positiveIntegerPattern, patternMsg:'必须是正整数。', minMsg:'必须 >= 1。' },
    description: '每箱产品数量。', example: '24'
  },
  {
    name: 'qty_box', label: 'Qty/Box', type: 'number', gridWidth: 8,
    origValidation: { min:1, pattern: positiveIntegerPattern, patternMsg:'必须是正整数。', minMsg:'必须 >= 1。' },
    description: '每盒产品数量。', example: '6'
  },
  {
    name: 'material_content', label: 'Material Content', type: 'textarea', rows:2, gridWidth: 24,
    origValidation: { maxLength: 200, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多200字符。' },
    description: '主要材料。', example: '80% Cotton, 20% Polyester'
  },
  {
    name: 'tag', label: 'Tag', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '产品搜索关键词。', example: 'smartphone electronics'
  },
  {
    name: 'care_instructions', label: 'Care Instructions', type: 'textarea', rows: 3, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多1000字符。' },
    description: '产品保养说明。', example: 'Hand wash cold. Do not bleach.'
  },
  {
    name: 'ship_from', label: 'Ship From', type: 'text', gridWidth: 8,
    origValidation: { required: true, maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '产品发货地。', example: 'California Warehouse'
  },
  {
    name: 'ship_to', label: 'Ship To', type: 'text', gridWidth: 8,
    origValidation: { required: true, maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '产品送货目的地。', example: 'USA Domestic'
  },
  {
    name: 'ship_carrier', label: 'Ship Carrier', type: 'text', gridWidth: 8,
    origValidation: { required: true, maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。', maxLengthMsg:'最多50字符。' },
    description: '运输公司。', example: 'UPS Ground'
  },
  {
    name: 'ship_desc', label: 'Shipping Description', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 200, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多200字符。' },
    description: '附加运输信息。', example: 'Ships in 1-2 business days.'
  },
  {
    name: 'return_policy', label: 'Return Policy', type: 'textarea', rows: 3, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多1000字符。' },
    description: '产品退货政策详情。', example: '30-day free returns.'
  },
  {
    name: 'security_privacy', label: 'Security & Privacy', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多1000字符。' },
    description: '安全和隐私信息。', example: 'Data encrypted end-to-end.'
  },
  {
    name: 'dropship_desc', label: 'Dropship Description', type: 'textarea', rows: 3, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多1000字符。' },
    description: '一件代发列表描述。', example: 'This item is dropshipped directly from the supplier.'
  },
  {
    name: 'title', label: 'Title (Listing)', type: 'text', gridWidth: 24,
    origValidation: { required: true, maxLength: 500, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多500字符。' },
    description: '产品列表标题。', example: 'Amazing New Product - Limited Stock!'
  },
  {
    name: 'short_desc', label: 'Short Description', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { required: true, maxLength: 100, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多100字符。' },
    description: '简要产品描述。', example: 'Get this amazing new product today.'
  },
  {
    name: 'long_desc', label: 'Long Description', type: 'textarea', rows: 4, gridWidth: 24,
    origValidation: { maxLength: 2000, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多2000字符。' },
    description: '详细产品描述。', example: 'Full details about features, benefits, and specifications of this incredible product.'
  },
  {
    name: 'keywords', label: 'Keywords', type: 'text', gridWidth: 24,
    origValidation: { required: true, maxLength: 50, pattern: /^[a-zA-Z0-9,\- ]*$/, patternMsg:'允许：字母、数字、连字符、空格、逗号。', maxLengthMsg:'最多50字符。' },
    description: '用于SEO的逗号分隔关键词。', example: 'new, product, amazing, electronics'
  },
  {
    name: 'dropship_listing_title', label: 'Dropship Listing Title', type: 'text', gridWidth: 24,
    origValidation: { maxLength: 500, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多500字符。' },
    description: '一件代发渠道列表标题。', example: 'DS - Amazing New Product - Fast Shipping'
  },
  {
    name: 'dropship_short_desc', label: 'Dropship Short Desc.', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 100, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多100字符。' },
    description: '一件代发渠道简短描述。', example: 'Dropshipped: Get this amazing item with quick delivery.'
  },
  {
    name: 'dropship_long_desc', label: 'Dropship Long Desc.', type: 'textarea', rows: 4, gridWidth: 24,
    origValidation: { maxLength: 2000, pattern: generalTextWithSpecialCharsPattern, patternMsg:'无效字符。', maxLengthMsg:'最多2000字符。' },
    description: '一件代发渠道详细描述。', example: 'Full dropship details including origin and handling...'
  },
  {
    name: 'google_product_category', label: 'Google Product Category', type: 'text', gridWidth: 8,
    origValidation: { maxLength:50, pattern: backendLimitedStrEngPattern, patternMsg: '类别必须使用允许的字符 (字母, 数字, 连字符, 空格)。最多50字符。' },
    description: 'Google Shopping类别。像 "Arts & Entertainment" 这样的值应为 "Arts and Entertainment"。', example: 'Electronics - Audio - Headphones'
  },
  {
    name: 'google_product_type', label: 'Google Product Type', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。最多50字符。', maxLengthMsg:'最多50字符。' },
    description: '您为Google设定的特定产品类型。', example: 'Wireless Noise Cancelling Headphones'
  },
  {
    name: 'facebook_product_category', label: 'Facebook Product Category', type: 'text', gridWidth: 8,
    origValidation: { maxLength:50, pattern: backendLimitedStrEngPattern, patternMsg: '类别必须使用允许的字符 (字母, 数字, 连字符, 空格)。最多50字符。' },
    description: 'Facebook Shopping类别。像 "APPAREL_AND_ACCESSORIES" 这样的值应为 "APPAREL AND ACCESSORIES"。', example: 'Electronics - Audio Equipment'
  },
  {
    name: 'color_map', label: 'Color Map', type: 'text', gridWidth: 24,
    origValidation: { maxLength: 2000, pattern: backendLimitedStrEngPattern, patternMsg:'允许：字母、数字、连字符、空格。若有多个，请用逗号并确保模式允许。', maxLengthMsg:'最多2000字符。' },
    description: '用于映射的主要颜色。例如："Black" 或如果模式允许逗号 "Red, Blue"。', example: 'Black'
  },
  { name: 'key_features_1', label: 'Key Feature 1', type: 'text', gridWidth: 24, origValidation: { required: true, maxLength: 100, pattern:generalTextWithSpecialCharsPattern, patternMsg:'特性中包含无效字符。', maxLengthMsg:'最多100字符。' } },
  { name: 'key_features_2', label: 'Key Feature 2', type: 'text', gridWidth: 24, origValidation: { required: true, maxLength: 100, pattern:generalTextWithSpecialCharsPattern, patternMsg:'特性中包含无效字符。', maxLengthMsg:'最多100字符。' } },
  { name: 'key_features_3', label: 'Key Feature 3', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextWithSpecialCharsPattern, patternMsg:'特性中包含无效字符。', maxLengthMsg:'最多100字符。' } },
  { name: 'key_features_4', label: 'Key Feature 4', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextWithSpecialCharsPattern, patternMsg:'特性中包含无效字符。', maxLengthMsg:'最多100字符。' } },
  { name: 'key_features_5', label: 'Key Feature 5', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextWithSpecialCharsPattern, patternMsg:'特性中包含无效字符。', maxLengthMsg:'最多100字符。' } },
  { name: 'main_image', label: 'Main Image URL', type: 'url', gridWidth: 24, origValidation: { required: true, pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'front_image', label: 'Front Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'side_image', label: 'Side Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'back_image', label: 'Back Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'detail_image', label: 'Detail Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'full_image', label: 'Full Image URL', type: 'url', gridWidth: 8, origValidation: { required: true, pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'thumbnail_image', label: 'Thumbnail Image URL', type: 'url', gridWidth: 8, origValidation: { required: true, pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'size_chart_image', label: 'Size Chart Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'swatch_image', label: 'Swatch Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'additional_image_1', label: 'Additional Image 1 URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'additional_image_2', label: 'Additional Image 2 URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'additional_image_3', label: 'Additional Image 3 URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'main_video', label: 'Main Video URL', type: 'url', gridWidth: 12, origValidation: { pattern: videoUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  { name: 'additional_video_1', label: 'Additional Video 1 URL', type: 'url', gridWidth: 12, origValidation: { pattern: videoUrlPattern, patternMsg: '需要以 http(s):// 开头的有效URL。' } },
  {
    name: 'material_name_1', label: 'Material 1 Name', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:backendLimitedStrEngPattern, patternMsg:"允许：字母、数字、连字符、空格。", maxLengthMsg:"最多100" }
  },
  {
    name: 'material_1_percentage', label: 'Material 1 %', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"请输入1到100之间的值 (例如, 50 或 50.5)。", minMsg:"最小1。", maxMsg:"最大100。" }
  },
  {
    name: 'material_name_2', label: 'Material 2 Name', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:backendLimitedStrEngPattern, patternMsg:"允许：字母、数字、连字符、空格。", maxLengthMsg:"最多100" }
  },
  {
    name: 'material_2_percentage', label: 'Material 2 %', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"请输入1到100之间的值。", minMsg:"最小1。", maxMsg:"最大100。" }
  },
  {
    name: 'material_name_3', label: 'Material 3 Name', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:backendLimitedStrEngPattern, patternMsg:"允许：字母、数字、连字符、空格。", maxLengthMsg:"最多100" }
  },
  {
    name: 'material_3_percentage', label: 'Material 3 %', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"请输入1到100之间的值。", minMsg:"最小1。", maxMsg:"最大100。" }
  },
  {
    name: 'material_name_4', label: 'Material 4 Name', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:backendLimitedStrEngPattern, patternMsg:"允许：字母、数字、连字符、空格。", maxLengthMsg:"最多100" }
  },
  {
    name: 'material_4_percentage', label: 'Material 4 %', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"请输入1到100之间的值。", minMsg:"最小1。", maxMsg:"最大100。" }
  },
  {
    name: 'material_name_5', label: 'Material 5 Name', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:backendLimitedStrEngPattern, patternMsg:"允许：字母、数字、连字符、空格。", maxLengthMsg:"最多100" }
  },
  {
    name: 'material_5_percentage', label: 'Material 5 %', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"请输入1到100之间的值。", minMsg:"最小1。", maxMsg:"最大100。" }
  },
  {
    name: 'additional_color_1', label: 'Additional Color 1', type: 'text', gridWidth: 12,
    origValidation: { maxLength: 100, pattern:backendLimitedStrEngPattern, patternMsg:"允许：字母、数字、连字符、空格。", maxLengthMsg:"最多100" }
  },
  {
    name: 'additional_color_2', label: 'Additional Color 2', type: 'text', gridWidth: 12,
    origValidation: { maxLength: 100, pattern:backendLimitedStrEngPattern, patternMsg:"允许：字母、数字、连字符、空格。", maxLengthMsg:"最多100" }
  },
];


// Final processing to set isMandatory and validation object
export const fieldsConfig = tempFieldsConfig.map(field => {
  const isMandatoryByList = mandatoryFieldsFromCSV.includes(field.name);
  // Check if origValidation itself has a 'required' flag for fields not in CSV list
  const isOrigValidationRequired = field.origValidation && field.origValidation.required;

  const finalValidation = createValidation(field);

  return {
    ...field,
    // Determine final mandatory status
    isMandatory: isMandatoryByList || isOrigValidationRequired || finalValidation.required,
    validation: finalValidation,
    // origValidation can be kept for reference or removed if fully processed into 'validation'
    // origValidation: undefined, 
  };
});