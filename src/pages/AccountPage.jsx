import React from 'react';

const AccountPage = ({ userInfo, t }) => {
  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>{t('accountInfo') || '账号信息'}</h2>
      {userInfo ? (
        <div>
          <p><b>{t('email') || '邮箱'}:</b> {userInfo.email}</p>
          <p><b>{t('role') || '角色'}:</b> {userInfo.role}</p>
          <p><b>ID:</b> {userInfo.id}</p>
        </div>
      ) : (
        <p>{t('loading') || '加载中...'}</p>
      )}
    </div>
  );
};

export default AccountPage; 