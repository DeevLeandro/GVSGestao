import React from "react";
import { SearchOutlined, BellOutlined } from "@ant-design/icons";
import { Input, Badge, Avatar } from "antd";

const { Search } = Input;

export default function Header() {
  return (
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        <Search
          placeholder="Buscar..."
          style={{ width: 300 }}
          enterButton={<SearchOutlined />}
        />
      </div>
      <div style={styles.headerRight}>
        <Badge count={3} style={{ marginRight: 20 }}>
          <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
        </Badge>
        <Avatar icon={<Avatar />} style={{ cursor: "pointer" }} />
      </div>
    </div>
  );
}

const styles = {
  header: {
    height: 64,
    background: "#fff",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 99,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
  },
};