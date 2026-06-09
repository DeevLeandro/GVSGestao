import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Input, Button, Space, DatePicker, Select } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import api, { extractFireDACData } from "../services/api";

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadTransacoes();
  }, []);

  const loadTransacoes = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userID");
      const response = await api.get("/ServerPrincipal/PesquisaTransacoes", {
        params: { Cliente: userId }
      });
      const data = extractFireDACData(response.data);
      const formatted = data.map((t, i) => ({
        key: i.toString(),
        data: t.tra_data || t.data,
        descricao: t.tra_descricao || t.descricao,
        tipo: t.tra_tipo || t.tipo,
        valor: t.tra_valor || t.valor || 0,
        economia: t.tra_economia || t.economia || 0,
        status: t.tra_status || t.status || "Concluído",
      }));
      setTransacoes(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Data", dataIndex: "data", key: "data", width: 120 },
    { title: "Descrição", dataIndex: "descricao", key: "descricao" },
    { 
      title: "Tipo", 
      dataIndex: "tipo", 
      key: "tipo",
      render: (tipo) => <Tag color={tipo === "Crédito" ? "green" : "red"}>{tipo}</Tag>
    },
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
      title: "Economia", 
      dataIndex: "economia", 
      key: "economia",
      render: (economia) => (
        <span style={{ color: "#3f8600" }}>
          R$ {economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      title: "Status", 
      dataIndex: "status", 
      key: "status",
      render: (status) => <Tag color={status === "Concluído" ? "success" : "warning"}>{status}</Tag>
    },
  ];

  const filteredTransacoes = transacoes.filter(t =>
    t.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Histórico de Transações</h2>
        <Button icon={<ReloadOutlined />} onClick={loadTransacoes} loading={loading}>
          Atualizar
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Search
            placeholder="Buscar por descrição"
            style={{ width: 300 }}
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <RangePicker />
          <Select placeholder="Filtrar por tipo" style={{ width: 150 }} allowClear>
            <Option value="credito">Crédito</Option>
            <Option value="debito">Débito</Option>
          </Select>
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredTransacoes} 
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", margin: 0 },
};