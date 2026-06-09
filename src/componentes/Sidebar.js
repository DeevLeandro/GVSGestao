import React from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  WalletOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Avatar } from "antd";

export default function Sidebar({ collapsed, setCollapsed, currentMenu, setCurrentMenu, userName, userLevel, onLogout }) {
  const menuItems = [
    { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "clientes", icon: <TeamOutlined />, label: "Clientes" },
    { key: "carteira", icon: <WalletOutlined />, label: "Carteira" },
    { key: "transacoes", icon: <HistoryOutlined />, label: "Transações" },
    { key: "configuracoes", icon: <SettingOutlined />, label: "Configurações" },
  ];

  return (
    <div style={{ ...styles.sidebar, width: collapsed ? 80 : 250 }}>
      <div style={styles.logoContainer}>
        <h2 style={{ ...styles.logo, display: collapsed ? "none" : "block" }}>
          ADM GVS
        </h2>
        <div style={styles.collapseButton} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </div>

      <div style={styles.userInfo}>
        <Avatar size={collapsed ? 32 : 48} icon={<UserOutlined />} style={styles.avatar} />
        {!collapsed && (
          <div style={styles.userText}>
            <div style={styles.userName}>{userName}</div>
            <div style={styles.userLevel}>{userLevel}</div>
          </div>
        )}
      </div>

      <div style={styles.menuItems}>
        {menuItems.map((item) => (
          <div
            key={item.key}
            style={{
              ...styles.menuItem,
              backgroundColor: currentMenu === item.key ? "#1890ff" : "transparent",
              color: currentMenu === item.key ? "#fff" : "#d9d9d9",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
            onClick={() => setCurrentMenu(item.key)}
          >
            <span style={styles.menuIcon}>{item.icon}</span>
            {!collapsed && <span style={styles.menuLabel}>{item.label}</span>}
          </div>
        ))}
      </div>

      <div style={styles.logoutButton} onClick={onLogout}>
        <span style={styles.menuIcon}><LogoutOutlined /></span>
        {!collapsed && <span style={styles.menuLabel}>Sair</span>}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    position: "fixed",
    height: "100vh",
    background: "#001529",
    transition: "all 0.3s",
    overflow: "auto",
    zIndex: 100,
  },
  logoContainer: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  logo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    margin: 0,
  },
  collapseButton: {
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    padding: "8px",
    borderRadius: "4px",
  },
  userInfo: {
    padding: "20px 16px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    gap: 12,
  },
  avatar: {
    backgroundColor: "#1890ff",
  },
  userText: {
    flex: 1,
  },
  userName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  userLevel: {
    color: "#faad14",
    fontSize: 12,
    marginTop: 4,
  },
  menuItems: {
    flex: 1,
    marginTop: 20,
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    margin: "4px 8px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s",
    gap: 12,
  },
  menuIcon: {
    fontSize: 18,
    minWidth: 24,
  },
  menuLabel: {
    fontSize: 14,
  },
  logoutButton: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    margin: "0 8px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s",
    gap: 12,
    color: "#f5222d",
  },
};