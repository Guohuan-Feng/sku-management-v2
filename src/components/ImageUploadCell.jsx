import React, { useState } from 'react';
import { Upload, Button, message, Image } from 'antd';
import { UploadOutlined, EyeOutlined } from '@ant-design/icons';
import { uploadImage } from '../services/skuApiService';
import { useTranslation } from 'react-i18next';

const ImageUploadCell = ({ 
  value, 
  onChange, 
  record, 
  fieldName = 'main_image',
  disabled = false 
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(value);

  const handleUpload = async (file) => {
    if (!file) return false;

    // 检查文件类型
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error(t('imageUpload.onlyImageAllowed'));
      return false;
    }

    // 检查文件大小 (5MB)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error(t('imageUpload.fileTooLarge'));
      return false;
    }

    setUploading(true);
    try {
      const skuId = record.id && !record.id.toString().startsWith('new-temp-id') ? record.id : null;
      const response = await uploadImage(file, fieldName, skuId);
      
      if (response && response.url) {
        setImageUrl(response.url);
        onChange?.(response.url, response.id);
        message.success(t('imageUpload.uploadSuccess'));
        
        // 保存图片ID到record中，用于后续关联
        if (response.id) {
          record.uploadedImageIds = record.uploadedImageIds || [];
          record.uploadedImageIds.push(response.id);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      message.error(t('imageUpload.uploadFailed'));
    } finally {
      setUploading(false);
    }

    return false; // 阻止默认上传行为
  };

  const uploadProps = {
    name: 'file',
    showUploadList: false,
    beforeUpload: handleUpload,
    disabled: disabled || uploading,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Upload {...uploadProps}>
        <Button 
          icon={<UploadOutlined />} 
          loading={uploading}
          disabled={disabled}
          size="small"
        >
          {uploading ? t('imageUpload.uploading') : t('imageUpload.upload')}
        </Button>
      </Upload>
      
      {imageUrl && (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {
            window.open(imageUrl, '_blank');
          }}
          title={t('imageUpload.preview')}
        />
      )}
      
      {imageUrl && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {imageUrl}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadCell; 