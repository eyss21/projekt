import React, { useState } from 'react';
import Layout from './Layout';
import UserManagement from './UserManagement';
import OrderStatusManagement from './OrderStatusManagement';
import WalletManagement from './WalletManagement';
import Interventions from './Interventions';

const AdminPanel = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('userManagement');

  return (
    <Layout
      onLogout={onLogout}
      panelTitle="Panel Administratora"
      menuItems={[
        { label: 'Zarządzanie użytkownikami', action: () => setActiveTab('userManagement') },
        { label: 'Zarządzanie szczegółami zamówień', action: () => setActiveTab('orderStatusManagement') },
        { label: 'Zarządzanie środkami użytkowników', action: () => setActiveTab('walletManagement') },
        { label: 'Interwencje', action: () => setActiveTab('Interventions') }
      ]}
    >
      {activeTab === 'userManagement' && <UserManagement />}
      {activeTab === 'orderStatusManagement' && <OrderStatusManagement />}
      {activeTab === 'walletManagement' && <WalletManagement />} 
      {activeTab === 'Interventions' && <Interventions />}
    </Layout>
  );
};

export default AdminPanel;
