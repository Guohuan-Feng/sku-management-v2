// src/components/fieldConfig.js

// --- Helper data and enums ---
// 这些选项的 label 仍然是字符串，因为它们是 Select 组件的选项，而不是直接显示在 Form.Item 的 label
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


// List of mandatory field names from the CSV (UPDATED based on your latest 16 items)
const mandatoryFieldsFromCSV = [
  'vendor_sku',
  'UPC',
  'product_en_name',
  'product_cn_name',
  'dropship_price',
  'brand',
  'net_weight',
  'gross_weight',
  'product_height',
  'product_length',
  'product_width',
  'box_height',
  'box_length',
  'box_width',
  'main_image',
  'size_chart_image',
];


// Helper function to create validation object
const createValidation = (field) => {
  let validation = { ...field.origValidation }; // Start with existing origValidation

  const isMandatoryByList = mandatoryFieldsFromCSV.includes(field.name);

  if (isMandatoryByList) {
    validation.required = true;
    validation.requiredMsg = `validation.required`; // Use i18n key for required message
  } else {
    // If not in the new mandatory list, ensure it's not required, unless it had a specific origValidation.required=true
    if (!(field.origValidation && field.origValidation.required)) {
        validation.required = false;
        delete validation.requiredMsg;
    }
  }
  return validation;
};

// Temporary array to hold original structures before adjusting isMandatory
const tempFieldsConfig = [
  {
    name: 'vendor_sku', label: 'field.vendor_sku', type: 'text', gridWidth: 8,
    origValidation: { pattern: noLeadingZeroAndNoSpecialCharsPattern, patternMsg: 'validation.invalidSKU', maxLength: 100 },
    description: 'Unique product identifier provided by the vendor.', example: 'ABC-12345-XYZ'
  },
  {
    name: 'UPC', label: 'field.UPC', type: 'text', gridWidth: 8,
    origValidation: { pattern: upcPattern, patternMsg: 'validation.upcLength', maxLength: 12 },
    description: 'Universal Product Code (12-digit number).', example: '123456789012'
  },
  {
    name: 'product_en_name', label: 'field.product_en_name', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 100, pattern: generalTextAndSpecialCharsPatternNotEmpty, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Full product name in English.', example: 'Example Product Name'
  },
  {
    name: 'product_cn_name', label: 'field.product_cn_name', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 100, pattern: generalTextAndSpecialCharsPatternNotEmpty, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Full product name in Chinese.', example: '示例产品名称'
  },
  {
    name: 'status', label: 'field.status', type: 'select', gridWidth: 8,
    options: statusOptions, defaultValue: '0',
    description: 'Product status. Backend expects an integer.'
  },
  {
    name: 'ATS', label: 'field.ATS', type: 'number', gridWidth: 8,
    origValidation: { min: 0, pattern: nonNegativeIntegerPattern, patternMsg: 'validation.nonNegativeInteger', minMsg:'validation.cannotBeNegative' },
    description: 'Available to Sell quantity.', example: '100'
  },
  {
    name: 'dropship_price', label: 'field.dropship_price', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'validation.invalidPrice', minMsg:'validation.cannotBeNegative' },
    description: 'Vendor dropship price.', example: '50.00'
  },
  {
    name: 'MSRP', label: 'field.MSRP', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'validation.invalidPrice', minMsg:'validation.cannotBeNegative' },
    description: 'Manufacturer Suggested Retail Price.', example: '70.00'
  },
  {
    name: 'HDL_for_shipping', label: 'field.HDL_for_shipping', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'validation.invalidPrice', minMsg:'validation.cannotBeNegative' },
    description: 'Handling fee for shipping.', example: '5.50'
  },
  {
    name: 'HDL_for_receiving', label: 'field.HDL_for_receiving', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'validation.invalidPrice', minMsg:'validation.cannotBeNegative' },
    description: 'Handling fee for receiving.', example: '2.00'
  },
  {
    name: 'HDL_for_returning', label: 'field.HDL_for_returning', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'validation.invalidPrice', minMsg:'validation.cannotBeNegative' },
    description: 'Returning handling fee.', example: '3.50'
  },
  {
    name: 'storage_monthly', label: 'field.storage_monthly', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min: 0, pattern: pricePattern, patternMsg: 'validation.invalidPrice', minMsg:'validation.cannotBeNegative' },
    description: 'Monthly storage fee per unit.', example: '1.25'
  },
  {
    name: 'allow_dropship_return', label: 'field.allow_dropship_return', type: 'select', gridWidth: 8,
    options: [{ value: 'True', label: 'Yes' }, { value: 'False', label: 'No' }], defaultValue: 'False',
    description: 'Whether dropship returns are allowed.'
  },
  {
    name: 'shipping_lead_time', label: 'field.shipping_lead_time', type: 'number', gridWidth: 8,
    origValidation: { min: 0, pattern: nonNegativeIntegerPattern, patternMsg: 'validation.nonNegativeInteger', minMsg:'validation.cannotBeNegative' },
    description: 'Number of days from order to shipment.', example: '3'
  },
  {
    name: 'division', label: 'field.division', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product division.', example: 'Electronics'
  },
  {
    name: 'department', label: 'field.department', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product department.', example: 'Audio Equipment'
  },
  {
    name: 'category', label: 'field.category', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Main product category.', example: 'Headphones'
  },
  {
    name: 'sub_category', label: 'field.sub_category', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product sub-category.', example: 'Wireless Headphones'
  },
  {
    name: 'product_class', label: 'field.product_class', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product classification.', example: 'Consumer Electronics'
  },
  {
    name: 'group', label: 'field.group', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product group.', example: 'Audio Devices'
  },
  {
    name: 'subgroup', label: 'field.subgroup', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product subgroup.', example: 'Bluetooth Audio'
  },
  {
    name: 'style', label: 'field.style', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product style.', example: 'Over-ear'
  },
  {
    name: 'sub_style', label: 'field.sub_style', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product sub-style.', example: 'Noise Cancelling'
  },
  {
    name: 'brand', label: 'field.brand', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product brand.', example: 'Sony'
  },
  {
    name: 'model', label: 'field.model', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product model.', example: 'WH-1000XM5'
  },
  {
    name: 'color', label: 'field.color', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product color.', example: 'Black'
  },
  {
    name: 'size', label: 'field.size', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern', maxLengthMsg: 'validation.maxCharacters' },
    description: 'Product size (if applicable).', example: 'One Size'
  },
  { name: 'option_1', label: 'field.option_1', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' }, description:'Custom option 1' },
  { name: 'option_2', label: 'field.option_2', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' }, description:'Custom option 2' },
  { name: 'option_3', label: 'field.option_3', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' }, description:'Custom option 3' },
  { name: 'option_4', label: 'field.option_4', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' }, description:'Custom option 4' },
  { name: 'option_5', label: 'field.option_5', type: 'text', gridWidth: 8, origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' }, description:'Custom option 5' },
  {
    name: 'gender', label: 'field.gender', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 20, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Target gender.', example: 'Unisex'
  },
  {
    name: 'age_group', label: 'field.age_group', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Target age group.', example: 'Adult'
  },
  {
    name: 'country_of_region', label: 'field.country_of_region', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Country of manufacture.', example: 'USA'
  },
  {
    name: 'color_code_NRF', label: 'field.color_code_NRF', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: nrfCodePattern, patternMsg: 'validation.generalPatternNoChinese', maxLengthMsg: 'validation.maxCharacters' },
    description: 'NRF standard color code.', example: 'BLK001'
  },
  {
    name: 'color_desc', label: 'field.color_desc', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 20, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Description of the color.', example: 'Midnight Black'
  },
  {
    name: 'size_code_NRF', label: 'field.size_code_NRF', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: nrfCodePattern, patternMsg: 'validation.generalPatternNoChinese', maxLengthMsg: 'validation.maxCharacters' },
    description: 'NRF standard size code.', example: 'LGE 010'
  },
  {
    name: 'size_desc', label: 'field.size_desc', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Detailed size description.', example: 'Large'
  },
  {
    name: 'manufacturer', label: 'field.manufacturer', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Product manufacturer.', example: 'Acme Corp'
  },
  {
    name: 'OEM', label: 'field.OEM', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Original Equipment Manufacturer.', example: 'OEM Inc'
  },
  {
    name: 'product_year', label: 'field.product_year', type: 'text', gridWidth: 8,
    origValidation: { pattern: fourDigitYearPattern, patternMsg: 'validation.fourDigitYear' },
    description: 'Year of manufacture (e.g., "2023").', example: '2023'
  },
  {
    name: 'condition', label: 'field.condition', type: 'select', gridWidth: 8,
    options: conditionOptions, defaultValue: '0',
    description: 'Product condition. Backend expects an integer.'
  },
  {
    name: 'prepack_code', label: 'field.prepack_code', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Prepack code (if applicable).', example: 'PPK-007'
  },
  {
    name: 'remark', label: 'field.remark', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 100, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Additional remarks.', example: 'Limited edition release'
  },
  {
    name: 'harmonized_code', label: 'field.harmonized_code', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: harmonizedCodePattern, patternMsg:'validation.invalidHarmonized', maxLengthMsg:'validation.maxCharacters', required: false },
    description: 'Harmonized System code for customs.', example: '8517.12.0050'
  },
  {
    name: 'UOM', label: 'field.UOM', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Unit of Measurement.', example: 'Each',
    defaultValue: 'Each'
  },
  {
    name: 'net_weight', label: 'field.net_weight', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'validation.invalidPrice', minMsg:'validation.mustBePositive' },
    description: 'Product net weight (e.g., kg or lb).', example: '0.25'
  },
  {
    name: 'gross_weight', label: 'field.gross_weight', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'validation.invalidPrice', minMsg:'validation.mustBePositive' },
    description: 'Product gross weight (with packaging).', example: '0.35'
  },
  {
    name: 'product_height', label: 'field.product_height', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'validation.invalidPrice', minMsg:'validation.mustBePositive' },
    description: 'Product height (e.g., cm or in).', example: '15.0'
  },
  {
    name: 'product_length', label: 'field.product_length', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'validation.invalidPrice', minMsg:'validation.mustBePositive' },
    description: 'Product length.', example: '7.0'
  },
  {
    name: 'product_width', label: 'field.product_width', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'validation.invalidPrice', minMsg:'validation.mustBePositive' },
    description: 'Product width.', example: '1.0'
  },
  {
    name: 'box_height', label: 'field.box_height', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'validation.invalidPrice', minMsg:'validation.mustBePositive' },
    description: 'Box height.', example: '18.0'
  },
  {
    name: 'box_length', label: 'field.box_length', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'validation.invalidPrice', minMsg:'validation.mustBePositive' },
    description: 'Box length.', example: '10.0'
  },
  {
    name: 'box_width', label: 'field.box_width', type: 'number', isFee: true, gridWidth: 8,
    origValidation: { min:0.01, pattern: pricePattern, patternMsg:'validation.invalidPrice', minMsg:'validation.mustBePositive' },
    description: 'Box width.', example: '3.0'
  },
  {
    name: 'qty_case', label: 'field.qty_case', type: 'number', gridWidth: 8,
    origValidation: { min:1, pattern: positiveIntegerPattern, patternMsg:'validation.positiveInteger', minMsg:'validation.minOne' },
    description: 'Quantity of products per case.', example: '24'
  },
  {
    name: 'qty_box', label: 'field.qty_box', type: 'number', gridWidth: 8,
    origValidation: { min:1, pattern: positiveIntegerPattern, patternMsg:'validation.positiveInteger', minMsg:'validation.minOne' },
    description: 'Quantity of products per box.', example: '6'
  },
  {
    name: 'material_content', label: 'field.material_content', type: 'textarea', rows:2, gridWidth: 24,
    origValidation: { maxLength: 200, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Primary materials.', example: '80% Cotton, 20% Polyester'
  },
  {
    name: 'tag', label: 'field.tag', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Product search keywords.', example: 'smartphone electronics'
  },
  {
    name: 'care_instructions', label: 'field.care_instructions', type: 'textarea', rows: 3, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters', required: false },
    description: 'Product care instructions.', example: 'Hand wash cold. Do not bleach.'
  },
  {
    name: 'ship_from', label: 'field.ship_from', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Origin of product shipment.', example: 'California Warehouse',
    defaultValue: 'US'
  },
  {
    name: 'ship_to', label: 'field.ship_to', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Destination for product delivery.', example: 'USA Domestic',
    defaultValue: 'US'
  },
  {
    name: 'ship_carrier', label: 'field.ship_carrier', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Shipping company.', example: 'UPS Ground',
    defaultValue: 'UPS, USPS, FedEx'
  },
  {
    name: 'ship_desc', label: 'field.ship_desc', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 200, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters', required: false },
    description: 'Additional shipping information.', example: 'Ships in 1-2 business days.'
  },
  {
    name: 'return_policy', label: 'field.return_policy', type: 'textarea', rows: 3, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters', required: false },
    description: 'Detailed product return policy.', example: '30-day free returns.'
  },
  {
    name: 'security_privacy', label: 'field.security_privacy', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Security and privacy information.', example: 'Data encrypted end-to-end.'
  },
  {
    name: 'dropship_desc', label: 'field.dropship_desc', type: 'textarea', rows: 3, gridWidth: 24,
    origValidation: { maxLength: 1000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Dropship listing description.', example: 'This item is dropshipped directly from the supplier.'
  },
  {
    name: 'title', label: 'field.title', type: 'text', gridWidth: 24,
    origValidation: { maxLength: 500, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Product listing title.', example: 'Amazing New Product - Limited Stock!'
  },
  {
    name: 'short_desc', label: 'field.short_desc', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 100, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Brief product description.', example: 'Get this amazing new product today.'
  },
  {
    name: 'long_desc', label: 'field.long_desc', type: 'textarea', rows: 4, gridWidth: 24,
    origValidation: { maxLength: 2000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Detailed product description.', example: 'Full details about features, benefits, and specifications of this incredible product.'
  },
  {
    name: 'keywords', label: 'field.keywords', type: 'text', gridWidth: 24,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Comma-separated keywords for SEO.', example: 'new, product, amazing, electronics'
  },
  {
    name: 'dropship_listing_title', label: 'field.dropship_listing_title', type: 'text', gridWidth: 24,
    origValidation: { maxLength: 500, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Dropship channel listing title.', example: 'DS - Amazing New Product - Fast Shipping'
  },
  {
    name: 'dropship_short_desc', label: 'field.dropship_short_desc', type: 'textarea', rows: 2, gridWidth: 24,
    origValidation: { maxLength: 100, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Dropship channel short description.', example: 'Dropshipped: Get this amazing item with quick delivery.'
  },
  {
    name: 'dropship_long_desc', label: 'field.dropship_long_desc', type: 'textarea', rows: 4, gridWidth: 24,
    origValidation: { maxLength: 2000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Dropship channel detailed description.', example: 'Full dropship details including origin and handling...'
  },
  {
    name: 'google_product_category', label: 'field.google_product_category', type: 'text', gridWidth: 8,
    origValidation: { maxLength:50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern' },
    description: 'Google Shopping category. Values like "Arts & Entertainment" should be "Arts and Entertainment".', example: 'Electronics - Audio - Headphones'
  },
  {
    name: 'google_product_type', label: 'field.google_product_type', type: 'text', gridWidth: 8,
    origValidation: { maxLength: 50, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Your specific product type for Google.', example: 'Wireless Noise Cancelling Headphones'
  },
  {
    name: 'facebook_product_category', label: 'field.facebook_product_category', type: 'text', gridWidth: 8,
    origValidation: { maxLength:50, pattern: generalTextAndSpecialCharsPattern, patternMsg: 'validation.generalPattern' },
    description: 'Facebook Shopping category. Values like "APPAREL_AND_ACCESSORIES" should be "APPAREL AND ACCESSORIES".', example: 'Electronics - Audio Equipment'
  },
  {
    name: 'color_map', label: 'field.color_map', type: 'text', gridWidth: 24,
    origValidation: { maxLength: 2000, pattern: generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' },
    description: 'Primary colors for mapping. E.g., "Black" or "Red, Blue".', example: 'Black'
  },
  { name: 'key_features_1', label: 'field.key_features_1', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' } },
  { name: 'key_features_2', label: 'field.key_features_2', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' } },
  { name: 'key_features_3', label: 'field.key_features_3', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' } },
  { name: 'key_features_4', label: 'field.key_features_4', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' } },
  { name: 'key_features_5', label: 'field.key_features_5', type: 'text', gridWidth: 24, origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:'validation.generalPattern', maxLengthMsg:'validation.maxCharacters' } },
  { name: 'main_image', label: 'field.main_image', type: 'url', gridWidth: 24, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'front_image', label: 'field.front_image', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'side_image', label: 'field.side_image', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'back_image', label: 'field.back_image', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'detail_image', label: 'field.detail_image', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'full_image', label: 'field.full_image', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'thumbnail_image', label: 'field.thumbnail_image', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'size_chart_image', label: 'field.size_chart_image', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'swatch_image', label: 'field.swatch_image', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'additional_image_1', label: 'field.additional_image_1', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'additional_image_2', label: 'field.additional_image_2', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'additional_image_3', label: 'field.additional_image_3', type: 'url', gridWidth: 8, origValidation: { pattern: imageUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'main_video', label: 'field.main_video', type: 'url', gridWidth: 12, origValidation: { pattern: videoUrlPattern, patternMsg: 'validation.urlInvalid' } },
  { name: 'additional_video_1', label: 'field.additional_video_1', type: 'url', gridWidth: 12, origValidation: { pattern: videoUrlPattern, patternMsg: 'validation.urlInvalid' } },
  {
    name: 'material_name_1', label: 'field.material_name_1', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"validation.generalPattern", maxLengthMsg:"validation.maxCharacters" }
  },
  {
    name: 'material_1_percentage', label: 'field.material_1_percentage', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"validation.percentageRange", minMsg:"validation.minOnePercent", maxMsg:"validation.maxOneHundredPercent" }
  },
  {
    name: 'material_name_2', label: 'field.material_name_2', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"validation.generalPattern", maxLengthMsg:"validation.maxCharacters" }
  },
  {
    name: 'material_2_percentage', label: 'field.material_2_percentage', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"validation.percentageRange", minMsg:"validation.minOnePercent", maxMsg:"validation.maxOneHundredPercent" }
  },
  {
    name: 'material_name_3', label: 'field.material_name_3', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"validation.generalPattern", maxLengthMsg:"validation.maxCharacters" }
  },
  {
    name: 'material_3_percentage', label: 'field.material_3_percentage', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"validation.percentageRange", minMsg:"validation.minOnePercent", maxMsg:"validation.maxOneHundredPercent" }
  },
  {
    name: 'material_name_4', label: 'field.material_name_4', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"validation.generalPattern", maxLengthMsg:"validation.maxCharacters" }
  },
  {
    name: 'material_4_percentage', label: 'field.material_4_percentage', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"validation.percentageRange", minMsg:"validation.minOnePercent", maxMsg:"validation.maxOneHundredPercent" }
  },
  {
    name: 'material_name_5', label: 'field.material_name_5', type: 'text', gridWidth: 6,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"validation.generalPattern", maxLengthMsg:"validation.maxCharacters" }
  },
  {
    name: 'material_5_percentage', label: 'field.material_5_percentage', type: 'number', gridWidth: 6,
    origValidation: { min:1, max:100, pattern:percentageValidationPattern, patternMsg:"validation.percentageRange", minMsg:"validation.minOnePercent", maxMsg:"validation.maxOneHundredPercent" }
  },
  {
    name: 'additional_color_1', label: 'field.additional_color_1', type: 'text', gridWidth: 12,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"validation.generalPattern", maxLengthMsg:"validation.maxCharacters" }
  },
  {
    name: 'additional_color_2', label: 'field.additional_color_2', type: 'text', gridWidth: 12,
    origValidation: { maxLength: 100, pattern:generalTextAndSpecialCharsPattern, patternMsg:"validation.generalPattern", maxLengthMsg:"validation.maxCharacters" }
  },
];


// Final processing to set isMandatory and validation object
export const fieldsConfig = tempFieldsConfig.map(field => {
  const finalValidation = createValidation(field);

  return {
    ...field,
    isMandatory: finalValidation.required, // isMandatory directly reflects the finalValidation.required
    validation: finalValidation,
  };
});