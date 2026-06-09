import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  Select,
  message,
  Divider,
  Spin,
  Empty,
  Tooltip
} from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ArrowLeftOutlined,
  StarOutlined,
  GiftOutlined,
  ReloadOutlined,
  SearchOutlined
} from "@ant-design/icons";
import api, { extractFireDACData } from "../services/api";
import toast from "react-hot-toast";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Programas() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cliente } = location.state || {};
  
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrograma, setEditingPrograma] = useState(null);
  const [form] = Form.useForm();

  // Função para formatar números com decimais (ex: 22500 -> 22.500)
  const formatMilhas = (value) => {
    if (!value && value !== 0) return 0;
    // Se o valor já for número, retorna ele mesmo
    if (typeof value === 'number') return value;
    // Se for string, tenta converter
    const numValue = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
    return isNaN(numValue) ? 0 : numValue;
  };

  // Função para exibir milhas formatadas
  const displayMilhas = (value) => {
    if (!value && value !== 0) return "0";
    // Formata com separador de milhar
    return value.toLocaleString('pt-BR');
  };

  // Carregar programas do cliente ao montar o componente
  useEffect(() => {
    if (cliente?.id) {
      loadProgramas();
    }
  }, [cliente]);

  const loadProgramas = async () => {
    setLoading(true);
    try {
      const response = await api.get("/ServerPrincipal/PesquisaProgramas", {
        params: { Cliente: cliente.id }
      });
      
      const programasData = extractFireDACData(response.data);
      
      const formatted = programasData.map((programa, index) => {
        // Extrair o valor das milhas garantindo que seja número
        let milhasValue = 0;
        const rawMilhas = programa.pro_valor_milha_padrao || programa.milhas || 0;
        
        // Converter para número (pode vir como string ou número)
        if (typeof rawMilhas === 'string') {
          // Remover pontos de milhar e converter vírgula para ponto
          const cleanValue = rawMilhas.replace(/\./g, '').replace(',', '.');
          milhasValue = parseFloat(cleanValue) || 0;
        } else {
          milhasValue = parseFloat(rawMilhas) || 0;
        }
        
        return {
          key: index.toString(),
          id: programa.pro_id || programa.id,
          nome: programa.pro_nome || programa.nome,
          codigo: programa.pro_codigo || programa.codigo,
          milhas: milhasValue,
          status: programa.pro_ativo || programa.status || "Ativo",
          observacoes: programa.pro_observacoes || programa.observacoes,
          clienteId: programa.cli_id || programa.clienteId
        };
      });
      
      setProgramas(formatted);
    } catch (error) {
      console.error("Erro ao carregar programas:", error);
      toast.error("Erro ao carregar programas do cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (programa) => {
    setEditingPrograma(programa);
    form.setFieldsValue({
      nome: programa.nome,
      codigo: programa.codigo,
      milhas: programa.milhas,
      observacoes: programa.observacoes,
      ativo: programa.status === "Ativo"
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Confirmar exclusão",
      content: "Tem certeza que deseja excluir este programa?",
      onOk: async () => {
        try {
          await api.post("/ServerPrincipal/DeletarProgramas", {
            IDPrograma: id
          });
          toast.success("Programa excluído com sucesso!");
          loadProgramas();
        } catch (error) {
          console.error("Erro ao excluir programa:", error);
          toast.error("Erro ao excluir programa");
        }
      }
    });
  };

  const handleSave = async (values) => {
    try {
      // Garantir que o valor das milhas seja enviado corretamente
      const milhasValue = parseFloat(values.milhas) || 0;
      
      if (editingPrograma) {
        await api.post("/ServerPrincipal/EditarProgramas", {
          IDPrograma: editingPrograma.id,
          Nome: values.nome,
          Codigo: values.codigo,
          Valor: milhasValue, // Envia como número
          Ativo: values.ativo ? 1 : 0,
          Observacao: values.observacoes || ""
        });
        toast.success("Programa atualizado com sucesso!");
      } else {
        await api.post("/ServerPrincipal/InserirProgramas", {
          Nome: values.nome,
          Codigo: values.codigo,
          Valor: milhasValue, // Envia como número
          Observacoes: values.observacoes || "",
          IDCliente: cliente.id
        });
        toast.success("Programa cadastrado com sucesso!");
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingPrograma(null);
      loadProgramas();
    } catch (error) {
      console.error("Erro ao salvar programa:", error);
      toast.error("Erro ao salvar programa");
    }
  };

  // Filtrar programas com base no termo de busca
  const filteredProgramas = programas.filter(p =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Programa",
      dataIndex: "nome",
      key: "nome",
      render: (text, record) => (
        <Space>
          <GiftOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo"
    },
    {
      title: "Milhas/Pontos",
      dataIndex: "milhas",
      key: "milhas",
      render: (value) => (
        <Tag color="blue" icon={<StarOutlined />}>
          {displayMilhas(value)} milhas
        </Tag>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Ativo" ? "success" : "error"}>{status}</Tag>
      )
    },
    {
      title: "Observações/Validade",
      dataIndex: "observacoes",
      key: "observacoes",
      render: (text) => text || "Sem observações"
    },
    {
      title: "Ações",
      key: "acoes",
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => handleEdit(record)}
            >
              Editar
            </Button>
          </Tooltip>
          <Tooltip title="Excluir">
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small" 
              onClick={() => handleDelete(record.id)}
            >
              Excluir
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  if (!cliente) {
    return (
      <div style={styles.container}>
        <Card>
          <Empty 
            description="Cliente não selecionado" 
            style={{ margin: "50px 0" }}
          >
            <Button onClick={() => navigate("/clientes")}>
              Voltar para Clientes
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate("/operar", { state: { cliente } })}
          >
            Voltar
          </Button>
          <Title level={3}>Programas de Fidelidade</Title>
        </Space>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadProgramas} 
            loading={loading}
          >
            Atualizar
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingPrograma(null);
              form.resetFields();
              form.setFieldsValue({ ativo: true });
              setModalVisible(true);
            }}
          >
            Novo Programa
          </Button>
        </Space>
      </div>

      <Card>
        <div style={styles.infoCliente}>
          <Text strong>Cliente: </Text>
          <Text>{cliente?.nome}</Text>
          <Divider type="vertical" />
          <Text strong>Email: </Text>
          <Text>{cliente?.email}</Text>
          <Divider type="vertical" />
          <Text strong>ID: </Text>
          <Text>{cliente?.id}</Text>
        </div>
        
        <div style={styles.searchBar}>
          <span>Exibindo {filteredProgramas.length} programas</span>
          <Search 
            placeholder="Buscar programa ou código..." 
            style={{ width: 300 }} 
            onSearch={setSearchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            allowClear
          />
        </div>

        <Spin spinning={loading}>
          {filteredProgramas.length > 0 ? 
            <Table 
              columns={columns} 
              dataSource={filteredProgramas} 
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 800 }}
            /> : 
            <Empty description="Nenhum programa encontrado" />
          }
        </Spin>
      </Card>

      <Modal
        title={editingPrograma ? "Editar Programa" : "Novo Programa"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingPrograma(null);
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="nome"
            label="Nome do Programa"
            rules={[{ required: true, message: "Informe o nome" }]}
          >
            <Select placeholder="Selecione o programa">
              <Option value="LATAM Pass">LATAM Pass</Option>
              <Option value="Smiles GOL">Smiles GOL</Option>
              <Option value="TudoAzul">TudoAzul</Option>
              <Option value="Livelo">Livelo</Option>
              <Option value="Esfera">Esfera</Option>
              <Option value="Dotz">Dotz</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="codigo"
            label="Código do Cliente"
            rules={[{ required: true, message: "Informe o código" }]}
          >
            <Input placeholder="Código de associado" />
          </Form.Item>

          <Form.Item
            name="milhas"
            label="Milhas/Pontos"
            rules={[{ required: true, message: "Informe a quantidade" }]}
          >
            <InputNumber 
              style={{ width: "100%" }} 
              placeholder="Quantidade de milhas"
              min={0}
              step={1000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={value => value?.replace(/\$\s?|(\.*)/g, '') || 0}
            />
          </Form.Item>

          {editingPrograma && (
            <Form.Item
              name="ativo"
              label="Status"
            >
              <Select placeholder="Status do programa">
                <Option value={true}>Ativo</Option>
                <Option value={false}>Inativo</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="observacoes"
            label="Observações/Validade"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Observações sobre o programa, data de validade, etc."
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setEditingPrograma(null);
              }}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Salvar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    minHeight: "calc(100vh - 64px)",
    background: "#f0f2f5",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 16,
  },
  infoCliente: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#e6f7ff",
    borderRadius: 8,
  },
  searchBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16,
    alignItems: "center",
  },
};