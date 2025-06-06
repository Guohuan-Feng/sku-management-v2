// src/components/fieldConfig.js

// --- Helper data and enums ---
export const statusOptions = [
  { value: '0', label: 'Active' }, { value: '1', label: 'Inactive' },
  { value: '2', label: 'Discontinued' }, { value: '3', label: 'Closeout' },
  { value: '4', label: 'Liquidation' }, { value: '5', label: 'Prelimnry' },
  { value: '11', label: 'New' }, { value: '12', label: 'Promotional' },
];

export const conditionOptions = [
  { value: '0', label: 'New' }, { value: '1', label: 'Used' },
  { value: '2', label: 'Refurbished' }, { value: '4', label: 'Reconditioned' },
  { value: '8', label: 'LikeNew' }, { value: '9', label: 'UsedGood' },
  { value: '10', label: 'UsedPoor' }, { value: '11', label: 'Damaged' },
];

// --- Patterns (Updated to be more permissive and corrected syntax) ---
// This pattern allows English, Chinese, numbers, spaces, and a wide range of common special characters.
export const generalTextAndSpecialCharsPattern = /^[a-zA-Z0-9\s.,!?;:'’"()[\]{}《》·—\-–…&%$#@^+=*/\\|`~·，。！？；：“”‘’（）【】<>\u4e00-\u9fa5\n\r]*$/;
export const generalTextAndSpecialCharsPatternNotEmpty = /^[a-zA-Z0-9\s.,!?;:'’"()[\]{}《》·—\-–…&%$#@^+=*/\\|`~·，。！？；：“”‘’（）【】<>\u4e00-\u9fa5\n\r]+$/;
export const nrfCodePattern = /^[a-zA-Z0-9\- ]*$/; // Keep this one stricter if it's truly NRF specific
export const noLeadingZeroAndNoSpecialCharsPattern = /^[a-zA-Z1-9][a-zA-Z0-9-]*$/; // Keep this one stricter for SKU
export const imageUrlPattern = /^https?:\/\/.+/i;
export const videoUrlPattern = /^https?:\/\/.+/i;
export const fourDigitYearPattern = /^\d{4}$/;
export const upcPattern = /^\d{12}$/;
export const positiveIntegerPattern = /^[1-9]\d*$/;
export const nonNegativeIntegerPattern = /^\d+$/;
export const pricePattern = /^\d+(\.\d{1,2})?$/; // Allows up to 2 decimal places
export const percentageInputPattern = /^\d*\.?\d*%?$/; // For input visual
export const percentageValidationPattern = /^(\d{1,2}(\.\d{1,2})?|100)$/; // For validation
export const harmonizedCodePattern = /^[0-9A-Za-z.\-]+$/; // Keep this one stricter for harmonized code


// List of mandatory field names from the CSV (UPDATED)
// Includes original mandatory fields + newly requested mandatory fields
const mandatoryFieldsFromCSV = [
  'vendor_sku',
  'UPC', // 新增必填
  'product_en_name', // 原有 Product EN Name
  'product_cn_name', // 新增必填
  'dropship_price',
  'brand', // 新增必填
  'net_weight', // 新增必填
  'gross_weight', // 新增必填
  'product_height', // 新增必填
  'product_length', // 新增必填
  'product_width', // 新增必填
  'box_height', // 新增必填
  'box_length', // 新增必填
  'box_width', // 新增必填
  'main_image',
  'size_chart_image', // 新增必填
  'allow_dropship_return',
  'condition',
  'UOM',
  'ship_from',
  'ship_to',
  'ship_carrier',
  'title',
  'short_desc',
  'keywords',
  'key_features_1',
  'key_features_2',
  'full_image', // 确保这个是 Full Image, 如果是必填请加回
  'thumbnail_image', // 确保这个是 Thumbnail Image, 如果是必填请加回
];


// Helper function to create validation object
const createValidation = (field) => {
  // Initialize validation as an empty object first to ensure it's always defined
  let validation = {};

  // Then, if there's original validation config, merge it
  if (field.origValidation) {
    validation = { ...validation, ...field.origValidation };
  }

  const isMandatoryByList = mandatoryFieldsFromCSV.includes(field.name);
  // If the field is explicitly marked as required in its original validation, respect that.
  const isOrigRequired = field.origValidation && field.origValidation.required;

  if (isMandatoryByList || isOrigRequired) {
    // Ensure required is true and a message is present
    validation.required = true;
    validation.requiredMsg = validation.requiredMsg || `${field.label} is required.`;
  } else {
    // If not mandatory by list and not in origValidation, explicitly set to false and remove any accidental requiredMsg
    validation.required = false;
    delete validation.requiredMsg;
  }
  return validation;
};

// Temporary array to hold original structures before adjusting isMandatory
// ADDED 'product_cn_name' and updated origValidation for new mandatory fields
const tempFieldsConfig = [
  {
    name: 'vendor_sku', label: 'Vendor SKU', type: 'text', gridWidth: 8,
    origValidation: { required: true, pattern: noLeadingZeroAndNoSpecialCharsPattern, patternMsg: 'Invalid SKU format (cannot start with 0, no special characters except hyphens). Max 100 characters.', maxLength: 100 },
    description: 'Unique product identifier provided by the vendor.', example: 'ABC-12345-XYZ'
  },
  {
    name: 'UPC', label: 'UPC', type: 'text', gridWidth: 8,
    origValidation: { required: true, pattern: upcPattern, patternMsg: 'UPC must be exactly 12 digits.', maxLength: 12 }, // Updated to required
    description: 'Universal Product Code (12-digit number).', example: '123456789012'
  },
  {
    name: 'product_en_name', label: 'Product EN Name', type: 'text', gridWidth: 8, // Label changed to EN Name
    origValidation: { required: true, maxLength: 100, pattern: generalTextAndSpecialCharsPatternNotEmpty, patternMsg: 'Product EN name allows English, Chinese, numbers, spaces, and common special characters. Max 100 characters.' },
    description: 'Full product name in English.', example: 'Example Product Name'
  },
  {
    name: 'product_cn_name', label: 'Product CN Name', type: 'text', gridWidth: 8, // New field for CN Name
    origValidation: { required: true, maxLength: 100, pattern: generalTextAndSpecialCharsPatternNotEmpty, patternMsg: 'Product CN name allows Chinese, English, numbers, spaces, and common special characters. Max 100 characters.' },
    description: 'Full product name in Chinese.', example: '示例产品名称'
  },
  {
    name: 'status', label: 'Status', type: 'select', gridWidth: 8,
    options: statusOptions, defaultValue: '0',
    origValidation: {required: true, requiredMsg: 'Status is required.'},
    description: 'Product status. Backend expects an integer.'
  },
  {
    name: 'ATS', label: 'ATS', type: 'number', gridWidth: 8,
    origValidation: { min: 0, pattern: nonNegativeIntegerPattern, patternMsg: 'ATS must be a non-negative integer.', minMsg:'ATS cannot be negative.' },
    description: 'Available to Sell quantity.', example: '100'
  },
  {
    name: 'dropship_price', label: 'Dropship Price', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { required: true, min: 0, pattern: pricePattern, patternMsg: 'Invalid price format (e.g., 10.99).', minMsg:'Price cannot be negative.' },
    description: 'Vendor dropship price.', example: '50.00'
  },
  {
    name: 'MSRP', label: 'MSRP', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'Invalid price format.', minMsg:'Price cannot be negative.' },
    description: 'Manufacturer Suggested Retail Price.', example: '70.00'
  },
  {
    name: 'HDL_for_shipping', label: 'HDL for Shipping', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'Invalid fee format.', minMsg:'Fee cannot be negative.' },
    description: 'Handling fee for shipping.', example: '5.50'
  },
  {
    name: 'HDL_for_receiving', label: 'HDL for Receiving', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'Invalid fee format.', minMsg:'Fee cannot be negative.' },
    description: 'Handling fee for receiving.', example: '2.00'
  },
  {
    name: 'HDL_for_returning', label: 'HDL for Returning', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'Invalid fee format.', minMsg:'Fee cannot be negative.' },
    description: 'Returning handling fee.', example: '3.50'
  },
  {
    name: 'storage_monthly', label: 'Storage Monthly', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'Invalid fee format.', minMsg:'Fee cannot be negative.' },
    description: 'Monthly storage fee per unit.', example: '1.25'
  },
  {
    name: 'allow_dropship_return', label: 'Allow Dropship Return', type: 'select', gridWidth: 8,
    options: [{ value: 'True', label: 'Yes' }, { value: 'False', label: 'No' }], defaultValue: 'False',
    origValidation: { required: true, requiredMsg: 'Allow Dropship Return is required.' },
    description: 'Whether dropship returns are allowed.'
  },
  {
    name: 'shipping_lead_time', label: 'Shipping Lead Time (Days)', type: 'number', gridWidth: 8,
    origValidation: { min: 0, pattern: nonNegativeIntegerPattern, patternMsg: 'Must be a non-negative integer.', minMsg:'Cannot be negative.' },
    description: 'Number of days from order to shipment.', example: '3'
  },
  {
    name: 'division', label: 'Division', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product division.', example: 'Electronics'
  },
  {
    name: 'department', label: 'Department', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product department.', example: 'Audio Equipment'
  },
  {
    name: 'category', label: 'Category', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Main product category.', example: 'Headphones'
  },
  {
    name: 'sub_category', label: 'Sub Category', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product sub-category.', example: 'Wireless Headphones'
  },
  {
    name: 'product_class', label: 'Product Class', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product classification.', example: 'Consumer Electronics'
  },
  {
    name: 'group', label: 'Group', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product group.', example: 'Audio Devices'
  },
  {
    name: 'subgroup', label: 'Subgroup', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product subgroup.', example: 'Bluetooth Audio'
  },
  {
    name: 'style', label: 'Style', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product style.', example: 'Over-ear'
  },
  {
    name: 'sub_style', label: 'Sub Style', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product sub-style.', example: 'Noise Cancelling'
  },
  {
    name: 'brand', label: 'Brand', type: 'text', gridWidth: 8,
    origValidation: { required: true, maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' }, // Updated to required
    description: 'Product brand.', example: 'Sony'
  },
  {
    name: 'model', label: 'Model', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product model.', example: 'WH-1000XM5'
  },
  {
    name: 'color', label: 'Color', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product color.', example: 'Black'
  },
  {
    name: 'size', label: 'Size', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'Product size (if applicable).', example: 'One Size'
  },
  { name: 'option_1', label: 'Option 1', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 50' }, description:'Custom option 1' },
  { name: 'option_2', label: 'Option 2', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 50' }, description:'Custom option 2' },
  { name: 'option_3', label: 'Option 3', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 50' }, description:'Custom option 3' },
  { name: 'option_4', label: 'Option 4', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 50' }, description:'Custom option 4' },
  { name: 'option_5', label: 'Option 5', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 50' }, description:'Custom option 5' },
  {
    name: 'gender', label: 'Gender', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 20, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 20 characters.', maxLengthMsg:'Max 20 characters.' },
    description: 'Target gender.', example: 'Unisex'
  },
  {
    name: 'age_group', label: 'Age Group', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Target age group.', example: 'Adult'
  },
  {
    name: 'country_of_region', label: 'Country of Origin', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Country of manufacture.', example: 'USA'
  },
  {
    name: 'color_code_NRF', label: 'Color Code NRF', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: nrfCodePattern, patternMsg: 'Allowed: English, numbers, hyphens, spaces. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'NRF standard color code.', example: 'BLK001'
  },
  {
    name: 'color_desc', label: 'Color Description', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 20, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 20 characters.', maxLengthMsg:'Max 20 characters.' },
    description: 'Description of the color.', example: 'Midnight Black'
  },
  {
    name: 'size_code_NRF', label: 'Size Code NRF', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: nrfCodePattern, patternMsg: 'Allowed: English, numbers, hyphens, spaces. Max 50 characters.', maxLengthMsg: 'Max 50 characters.' },
    description: 'NRF standard size code.', example: 'LGE 010'
  },
  {
    name: 'size_desc', label: 'Size Description', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Detailed size description.', example: 'Large'
  },
  {
    name: 'manufacturer', label: 'Manufacturer', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Product manufacturer.', example: 'Acme Corp'
  },
  {
    name: 'OEM', label: 'OEM', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Original Equipment Manufacturer.', example: 'OEM Inc'
  },
  {
    name: 'product_year', label: 'Product Year', type: 'text', gridWidth: 8,
    origValidation: { pattern: fourDigitYearPattern, patternMsg: 'Please enter a 4-digit year (e.g., "2023").' },
    description: 'Year of manufacture (e.g., "2023").', example: '2023'
  },
  {
    name: 'condition', label: 'Condition', type: 'select', gridWidth: 8,
    options: conditionOptions, defaultValue: '0',
    origValidation: { required: true, requiredMsg: 'Condition is required.' },
    description: 'Product condition. Backend expects an integer.'
  },
  {
    name: 'prepack_code', label: 'Prepack Code', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Prepack code (if applicable).', example: 'PPK-007'
  },
  {
    name: 'remark', label: 'Remark', type: 'textarea', rows: 2, gridWidth: 24, // Textarea might take full width
    origValidation: { maxLength: 100, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Remark contains invalid characters.', maxLengthMsg:'Max 100 characters.' },
    description: 'Additional remarks.', example: 'Limited edition release'
  },
  {
    name: 'harmonized_code', label: 'Harmonized Code', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: harmonizedCodePattern, patternMsg:'Invalid harmonized code format (allows numbers, letters, periods, hyphens).', maxLengthMsg:'Max 50 characters.', required: false },
    description: 'Harmonized System code for customs.', example: '8517.12.0050'
  },
  {
    name: 'UOM', label: 'UOM', type: 'text', gridWidth: 8,
    origValidation: { required: true, maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Unit of Measurement.', example: 'Each',
    defaultValue: 'Each' // Added default value
  },
  {
    name: 'net_weight', label: 'Net Weight', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { required: true, min:0.01, pattern: pricePattern, patternMsg:'Invalid weight format (e.g., 0.5).', minMsg:'Must be > 0.' }, // Updated to required
    description: 'Product net weight (e.g., kg or lb).', example: '0.25'
  },
  {
    name: 'gross_weight', label: 'Gross Weight', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { required: true, min:0.01, pattern: pricePattern, patternMsg:'Invalid weight format.', minMsg:'Must be > 0.' }, // Updated to required
    description: 'Product gross weight (with packaging).', example: '0.35'
  },
  {
    name: 'product_height', label: 'Product Height', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { required: true, min:0.01, pattern: pricePattern, patternMsg:'Invalid dimension format.', minMsg:'Must be > 0.' }, // Updated to required
    description: 'Product height (e.g., cm or in).', example: '15.0'
  },
  {
    name: 'product_length', label: 'Product Length', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { required: true, min:0.01, pattern: pricePattern, patternMsg:'Invalid dimension format.', minMsg:'Must be > 0.' }, // Updated to required
    description: 'Product length.', example: '7.0'
  },
  {
    name: 'product_width', label: 'Product Width', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { required: true, min:0.01, pattern: pricePattern, patternMsg:'Invalid dimension format.', minMsg:'Must be > 0.' }, // Updated to required
    description: 'Product width.', example: '1.0'
  },
  {
    name: 'box_height', label: 'Box Height', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { required: true, min:0.01, pattern: pricePattern, patternMsg:'Invalid dimension format.', minMsg:'Must be > 0.' }, // Updated to required
    description: 'Box height.', example: '18.0'
  },
  {
    name: 'box_length', label: 'Box Length', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { required: true, min:0.01, pattern: pricePattern, patternMsg:'Invalid dimension format.', minMsg:'Must be > 0.' }, // Updated to required
    description: 'Box length.', example: '10.0'
  },
  {
    name: 'box_width', label: 'Box Width', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { required: true, min:0.01, pattern: pricePattern, patternMsg:'Invalid dimension format.', minMsg:'Must be > 0.' }, // Updated to required
    description: 'Box width.', example: '3.0'
  },
  {
    name: 'qty_case', label: 'Qty/Case', type: 'number', gridWidth: 8,
    origValidation: { min:1, pattern: positiveIntegerPattern, patternMsg:'Must be a positive integer.', minMsg:'Must be >= 1.' },
    description: 'Quantity of products per case.', example: '24'
  },
  {
    name: 'qty_box', label: 'Qty/Box', type: 'number', gridWidth: 8,
    origValidation: { min:1, pattern: positiveIntegerPattern, patternMsg:'Must be a positive integer.', minMsg:'Must be >= 1.' },
    description: 'Quantity of products per box.', example: '6'
  },
  {
    name: 'material_content', label: 'Material Content', type: 'textarea', rows:2, gridWidth: 24,
    origValidation: { maxLength: 200, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 200 characters.' },
    description: 'Primary materials.', example: '80% Cotton, 20% Polyester'
  },
  {
    name: 'tag', label: 'Tag', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Product search keywords.', example: 'smartphone electronics'
  },
  {
    name: 'care_instructions', label: 'Care Instructions', type: 'textarea', rows: 3, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 1000 characters.', required: false },
    description: 'Product care instructions.', example: 'Hand wash cold. Do not bleach.'
  },
  {
    name: 'ship_from', label: 'Ship From', type: 'text', gridWidth: 8,
    origValidation: { required: true, maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Origin of product shipment.', example: 'California Warehouse',
    defaultValue: 'US' // Added default value
  },
  {
    name: 'ship_to', label: 'Ship To', type: 'text', gridWidth: 8,
    origValidation: { required: true, maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Destination for product delivery.', example: 'USA Domestic',
    defaultValue: 'US' // Added default value
  },
  {
    name: 'ship_carrier', label: 'Ship Carrier', type: 'text', gridWidth: 8,
    origValidation: { required: true, maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Shipping company.', example: 'UPS Ground',
    defaultValue: 'UPS, USPS, FedEx' // Added default value
  },
  {
    name: 'ship_desc', label: 'Shipping Description', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 200, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 200 characters.', required: false },
    description: 'Additional shipping information.', example: 'Ships in 1-2 business days.'
  },
  {
    name: 'return_policy', label: 'Return Policy', type: 'textarea', rows: 3, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 1000 characters.', required: false },
    description: 'Detailed product return policy.', example: '30-day free returns.'
  },
  {
    name: 'security_privacy', label: 'Security & Privacy', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 1000 characters.' },
    description: 'Security and privacy information.', example: 'Data encrypted end-to-end.'
  },
  {
    name: 'dropship_desc', label: 'Dropship Description', type: 'textarea', rows: 3, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 1000 characters.' },
    description: 'Dropship listing description.', example: 'This item is dropshipped directly from the supplier.'
  },
  {
    name: 'title', label: 'Title (Listing)', type: 'text', gridWidth: 24,
    origValidation: { required: true, maxLength: 500, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 500 characters.' },
    description: 'Product listing title.', example: 'Amazing New Product - Limited Stock!'
  },
  {
    name: 'short_desc', label: 'Short Description', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { required: true, maxLength: 100, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 100 characters.' },
    description: 'Brief product description.', example: 'Get this amazing new product today.'
  },
  {
    name: 'long_desc', label: 'Long Description', type: 'textarea', rows: 4, gridWidth: 24,
    origValidation: { maxLength: 2000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 2000 characters.' },
    description: 'Detailed product description.', example: 'Full details about features, benefits, and specifications of this incredible product.'
  },
  {
    name: 'keywords', label: 'Keywords', type: 'text', gridWidth: 24,
    origValidation: { required: true, maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, commas, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Comma-separated keywords for SEO.', example: 'new, product, amazing, electronics'
  },
  {
    name: 'dropship_listing_title', label: 'Dropship Listing Title', type: 'text', gridWidth: 24,
    origValidation: { maxLength: 500, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 500 characters.' },
    description: 'Dropship channel listing title.', example: 'DS - Amazing New Product - Fast Shipping'
  },
  {
    name: 'dropship_short_desc', label: 'Dropship Short Desc.', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 100, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 100 characters.' },
    description: 'Dropship channel short description.', example: 'Dropshipped: Get this amazing item with quick delivery.'
  },
  {
    name: 'dropship_long_desc', label: 'Dropship Long Desc.', type: 'textarea', rows: 4, gridWidth: 24,
    origValidation: { maxLength: 2000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Invalid characters.', maxLengthMsg:'Max 2000 characters.' },
    description: 'Dropship channel detailed description.', example: 'Full dropship details including origin and handling...'
  },
  {
    name: 'google_product_category', label: 'Google Product Category', type: 'text', gridWidth: 8,
    origValidation: { maxLength:50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Category must use allowed characters (letters, numbers, hyphens, spaces, common special characters). Max 50 characters.' },
    description: 'Google Shopping category. Values like "Arts & Entertainment" should be "Arts and Entertainment".', example: 'Electronics - Audio - Headphones'
  },
  {
    name: 'google_product_type', label: 'Google Product Type', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. Max 50 characters.', maxLengthMsg:'Max 50 characters.' },
    description: 'Your specific product type for Google.', example: 'Wireless Noise Cancelling Headphones'
  },
  {
    name: 'facebook_product_category', label: 'Facebook Product Category', type: 'text', gridWidth: 8,
    origValidation: { maxLength:50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'Category must use allowed characters (letters, numbers, hyphens, spaces, common special characters). Max 50 characters.' },
    description: 'Facebook Shopping category. Values like "APPAREL_AND_ACCESSORIES" should be "APPAREL AND ACCESSORIES".', example: 'Electronics - Audio Equipment'
  },
  {
    name: 'color_map', label: 'Color Map', type: 'text', gridWidth: 24,
    origValidation: { maxLength: 2000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters. If multiple, use commas and ensure pattern allows.', maxLengthMsg:'Max 2000 characters.' },
    description: 'Primary colors for mapping. E.g., "Black" or "Red, Blue".', example: 'Black'
  },
  { name: 'key_features_1', label: 'Key Feature 1', type: 'text', gridWidth: 24, origValidation: { required: true, maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:'Feature contains invalid characters.', maxLengthMsg:'Max 100 characters.' } },
  { name: 'key_features_2', label: 'Key Feature 2', type: 'text', gridWidth: 24, origValidation: { required: true, maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:'Feature contains invalid characters.', maxLengthMsg:'Max 100 characters.' } },
  { name: 'key_features_3', label: 'Key Feature 3', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:'Feature contains invalid characters.', maxLengthMsg:'Max 100 characters.' } },
  { name: 'key_features_4', label: 'Key Feature 4', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:'Feature contains invalid characters.', maxLengthMsg:'Max 100 characters.' } },
  { name: 'key_features_5', label: 'Key Feature 5', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:'Feature contains invalid characters.', maxLengthMsg:'Max 100 characters.' } },
  { name: 'main_image', label: 'Main Image URL', type: 'url', gridWidth: 24, origValidation: { required: true, pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  { name: 'front_image', label: 'Front Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  { name: 'side_image', label: 'Side Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  { name: 'back_image', label: 'Back Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  { name: 'detail_image', label: 'Detail Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  { name: 'full_image', label: 'Full Image URL', type: 'url', gridWidth: 8, origValidation: { required: true, pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } }, // Keep as required if needed
  { name: 'thumbnail_image', label: 'Thumbnail Image URL', type: 'url', gridWidth: 8, origValidation: { required: true, pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } }, // Keep as required if needed
  { name: 'size_chart_image', label: 'Size Chart Image URL', type: 'url', gridWidth: 8, origValidation: { required: true, pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } }, // Updated to required
  { name: 'swatch_image', label: 'Swatch Image URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  { name: 'additional_image_1', label: 'Additional Image 1 URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  { name: 'additional_image_2', label: 'Additional Image 2 URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  { name: 'additional_image_3', label: 'Additional Image 3 URL', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  { name: 'main_video', label: 'Main Video URL', type: 'url', gridWidth: 12, origValidation: { pattern: videoUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  { name: 'additional_video_1', label: 'Additional Video 1 URL', type: 'url', gridWidth: 12, origValidation: { pattern: videoUrlPattern, patternMsg: 'Requires a valid URL starting with http(s)://.' } },
  {
    name: 'material_name_1', label: 'Material 1 Name', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters.", maxLengthMsg:"Max 100 characters." }
  },
  {
    name: 'material_1_percentage', label: 'Material 1 %', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"Please enter a value between 1 and 100 (e.g., 50 or 50.5).", minMsg:"Min 1.", maxMsg:"Max 100." }
  },
  {
    name: 'material_name_2', label: 'Material 2 Name', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters.", maxLengthMsg:"Max 100 characters." }
  },
  {
    name: 'material_2_percentage', label: 'Material 2 %', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"Please enter a value between 1 and 100.", minMsg:"Min 1.", maxMsg:"Max 100." }
  },
  {
    name: 'material_name_3', label: 'Material 3 Name', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters.", maxLengthMsg:"Max 100 characters." }
  },
  {
    name: 'material_3_percentage', label: 'Material 3 %', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"Please enter a value between 1 and 100.", minMsg:"Min 1.", maxMsg:"Max 100." }
  },
  {
    name: 'material_name_4', label: 'Material 4 Name', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters.", maxLengthMsg:"Max 100 characters." }
  },
  {
    name: 'material_4_percentage', label: 'Material 4 %', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"Please enter a value between 1 and 100.", minMsg:"Min 1.", maxMsg:"Max 100." }
  },
  {
    name: 'material_name_5', label: 'Material 5 Name', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters.", maxLengthMsg:"Max 100 characters." }
  },
  {
    name: 'material_5_percentage', label: 'Material 5 %', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"Please enter a value between 1 and 100.", minMsg:"Min 1.", maxMsg:"Max 100." }
  },
  {
    name: 'additional_color_1', label: 'Additional Color 1', type: 'text', gridWidth: 12,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters.", maxLengthMsg:"Max 100 characters." }
  },
  {
    name: 'additional_color_2', label: 'Additional Color 2', type: 'text', gridWidth: 12,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"Allowed: English, Chinese, numbers, hyphens, spaces, and common special characters.", maxLengthMsg:"Max 100 characters." }
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