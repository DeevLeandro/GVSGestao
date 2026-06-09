import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Spin, 
  Alert, 
  Space,
  Typography,
  Row,
  Col,
  Divider
} from "antd";
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  IdcardOutlined,
  SaveOutlined,
  ArrowLeftOutlined 
} from "@ant-design/icons";
import toast from "react-hot-toast";
import api from "../services/api";

const { Title } = Typography;

export default function CadastroCliente() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Obter userId do localStorage
  const userId = localStorage.getItem('userID');

  const handleCadastro = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      // Remove caracteres não numéricos do CPF e Telefone
      const cpfLimpo = values.cpf.replace(/\D/g, '');
      const telefoneLimpo = values.telefone.replace(/\D/g, '');
      
      // Prepara os dados conforme esperado pela API Delphi
      const dadosCliente = {
        IDLogin: parseInt(userId),
        Nome: values.nome,
        CPF: cpfLimpo,
        Email: values.email,
        Telefone: telefoneLimpo
      };
      
      console.log("Enviando dados:", dadosCliente);
      
      const response = await api.post(
        "/ServerPrincipal/InserirClientes",
        dadosCliente,
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      
      console.log("Resposta da API:", response.data);
      
      toast.success("Cliente cadastrado com sucesso!");
      
      // Redireciona para o Dashboard após o cadastro
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
      
    } catch (error) {
      console.error("Erro no cadastro:", error);
      
      let mensagemErro = "Erro ao cadastrar cliente. Tente novamente.";
      
      if (error.response) {
        if (error.response.status === 400) {
          mensagemErro = "Dados inválidos. Verifique as informações.";
        } else if (error.response.status === 409) {
          mensagemErro = "CPF ou Email já cadastrado.";
        } else if (error.response.status === 500) {
          mensagemErro = "Erro interno no servidor. Contate o suporte.";
        } else if (error.response.data) {
          if (typeof error.response.data === 'string') {
            mensagemErro = error.response.data;
          } else if (error.response.data.message) {
            mensagemErro = error.response.data.message;
          } else {
            mensagemErro = JSON.stringify(error.response.data);
          }
        }
      } else if (error.request) {
        mensagemErro = "Servidor não está respondendo. Verifique sua conexão.";
      } else if (error.message) {
        mensagemErro = error.message;
      }
      
      setError(mensagemErro);
      toast.error(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  // Validação de CPF
  const validarCPF = (_, value) => {
    if (!value) return Promise.reject(new Error('CPF é obrigatório'));
    
    const cpf = value.replace(/\D/g, '');
    if (cpf.length !== 11) {
      return Promise.reject(new Error('CPF deve conter 11 dígitos'));
    }
    
    let soma = 0;
    let resto;
    
    if (cpf === "00000000000" || cpf === "11111111111" || cpf === "22222222222" ||
        cpf === "33333333333" || cpf === "44444444444" || cpf === "55555555555" ||
        cpf === "66666666666" || cpf === "77777777777" || cpf === "88888888888" ||
        cpf === "99999999999") {
      return Promise.reject(new Error('CPF inválido'));
    }
    
    for (let i = 1; i <= 9; i++) {
      soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) {
      return Promise.reject(new Error('CPF inválido'));
    }
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) {
      return Promise.reject(new Error('CPF inválido'));
    }
    
    return Promise.resolve();
  };

  // Formatar CPF
  const formatarCPF = (value) => {
    const cpf = value.replace(/\D/g, '');
    if (cpf.length <= 11) {
      return cpf
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  // Formatar Telefone
  const formatarTelefone = (value) => {
    const telefone = value.replace(/\D/g, '');
    if (telefone.length <= 10) {
      return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <div style={styles.header}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate("/dashboard")}
              type="text"
            >
              Voltar
            </Button>
            <Title level={3} style={styles.title}>
              Cadastrar Novo Cliente
            </Title>
          </Space>
        </div>
        
        <Divider />
        
        {error && typeof error === 'string' && error.length > 0 && (
          <Alert
            message="Erro no Cadastro"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24 }}
            onClose={() => setError(null)}
          />
        )}
        
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCadastro}
            autoComplete="off"
            size="large"
          >
            <Row gutter={24}>
              <Col xs={24} sm={24} md={24}>
                <Form.Item
                  name="nome"
                  label="Nome Completo"
                  rules={[
                    { required: true, message: 'Por favor, insira o nome do cliente' },
                    { min: 3, message: 'Nome deve ter pelo menos 3 caracteres' },
                    { max: 100, message: 'Nome muito longo' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined />}
                    placeholder="Ex: João Silva Santos"
                    disabled={loading}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  name="cpf"
                  label="CPF"
                  rules={[
                    { required: true, message: 'Por favor, insira o CPF' },
                    { validator: validarCPF }
                  ]}
                >
                  <Input
                    prefix={<IdcardOutlined />}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    onChange={(e) => {
                      const formatted = formatarCPF(e.target.value);
                      form.setFieldsValue({ cpf: formatted });
                    }}
                    disabled={loading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  name="telefone"
                  label="Telefone"
                  rules={[
                    { required: true, message: 'Por favor, insira o telefone' },
                    { 
                      pattern: /^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$/,
                      message: 'Telefone inválido. Use o formato (00) 00000-0000'
                    }
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    onChange={(e) => {
                      const formatted = formatarTelefone(e.target.value);
                      form.setFieldsValue({ telefone: formatted });
                    }}
                    disabled={loading}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} sm={24} md={24}>
                <Form.Item
                  name="email"
                  label="E-mail"
                  rules={[
                    { required: true, message: 'Por favor, insira o e-mail' },
                    { type: 'email', message: 'E-mail inválido' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="cliente@exemplo.com"
                    disabled={loading}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'center' }} size="large">
                <Button 
                  onClick={() => form.resetFields()}
                  disabled={loading}
                  size="large"
                >
                  Limpar Campos
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                  style={{ background: "#52c41a", borderColor: "#52c41a" }}
                >
                  {loading ? "Cadastrando..." : "Cadastrar Cliente"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    minHeight: "calc(100vh - 64px)",
    background: "#f0f2f5",
  },
  card: {
    maxWidth: "800px",
    margin: "0 auto",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  header: {
    marginBottom: "16px",
  },
  title: {
    margin: 0,
  },
};