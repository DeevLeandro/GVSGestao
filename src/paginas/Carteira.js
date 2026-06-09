import React from "react";
import { Card, Statistic, Row, Col, Table, Tag } from "antd";
import { WalletOutlined, DollarOutlined, HistoryOutlined } from "@ant-design/icons";

export default function Carteira() {
  // Dados simulados - depois substituir pela API real
  const movimentacoes = [
    { key: "1", data: "15/04/2026", descricao: "Crédito de Economia", valor: 1250.00, tipo: "Crédito" },
    { key: "2", data: "10/04/2026", descricao: "Resgate de Milhas", valor: -500.00, tipo: "Débito" },
    { key: "3", data: "05/04/2026", descricao: "Bônus de Indicação", valor: 300.00, tipo: "Crédito" },
  ];

  const columns = [
    { title: "Data", dataIndex: "data", key: "data" },
    { title: "Descrição", dataIndex: "descricao", key: "descricao" },
    { 
      title: "Valor", 
      dataIndex: "valor", 
      key: "valor",
      render: (valor) => (
        <span style={{ color: valor > 0 ? "#52c41a" : "#f5222d", fontWeight: "bold" }}>
          R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      title: "Tipo", 
      dataIndex: "tipo", 
      key: "tipo",
      render: (tipo) => <Tag color={tipo === "Crédito" ? "green" : "red"}>{tipo}</Tag>
    },
  ];

  return (
    <div>
      <h2 style={styles.title}>Minha Carteira</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Saldo Total"
              value={15420.50}
              precision={2}
              prefix="R$"
              valueStyle={{ color: "#3f8600" }}
              icon={<WalletOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Economia no Mês"
              value={3250.75}
              precision={2}
              prefix="R$"
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total de Transações"
              value={42}
              suffix="operações"
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Últimas Movimentações">
        <Table columns={columns} dataSource={movimentacoes} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}

const styles = {
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24 },
};