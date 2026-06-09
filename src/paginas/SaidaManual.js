import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Spin,
  message,
  Upload,
  Button,
} from "antd";
import { ArrowUpOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";

const { Option } = Select;

// ── Logos programas (igual ao outro código) ─────────────────────────────────
const LOGOS_MAP = [
  { keys: ["livelo"],                    bg: "#e8003d", letra: "LV"  },
  { keys: ["itaú pontos","itau pontos"], bg: "#003087", letra: "IT"  },
  { keys: ["smiles"],                    bg: "#ff6600", letra: "S"   },
  { keys: ["azul"],                      bg: "#003087", letra: "A"   },
  { keys: ["coopera pj"],                bg: "#007b5e", letra: "CPJ" },
  { keys: ["coopera"],                   bg: "#007b5e", letra: "COO" },
  { keys: ["latam"],                     bg: "#e31837", letra: "L"   },
  { keys: ["tap"],                       bg: "#009900", letra: "TAP" },
  { keys: ["max milhas"],                bg: "#1e3a6e", letra: "MM"  },
  { keys: ["hotmilhas"],                 bg: "#cc3300", letra: "HM"  },
  { keys: ["ipiranga"],                  bg: "#f5a800", letra: "IP"  },
  { keys: ["esfera empresas"],           bg: "#8b0000", letra: "EE"  },
  { keys: ["esfera"],                    bg: "#8b0000", letra: "E_"  },
  { keys: ["bank milhas"],               bg: "#0066cc", letra: "BM"  },
  { keys: ["cash milhas"],               bg: "#5a5a5a", letra: "CM"  },
  { keys: ["curtaí","curtai"],           bg: "#e8a000", letra: "CT"  },
  { keys: ["compro suas milhas"],        bg: "#1e3a4a", letra: "CSM" },
  { keys: ["átomos","atomos"],           bg: "#444",    letra: "ÁT"  },
  { keys: ["gpa"],                       bg: "#00aa44", letra: "GPA" },
  { keys: ["pontos caixa"],              bg: "#007b5e", letra: "PC"  },
  { keys: ["caixa empresas"],            bg: "#007b5e", letra: "CE"  },
  { keys: ["sicredi empresarial"],       bg: "#009900", letra: "SCE" },
  { keys: ["sicredi"],                   bg: "#009900", letra: "SC"  },
  { keys: ["dotz"],                      bg: "#ff6600", letra: "DZ"  },
  { keys: ["porto plus"],                bg: "#0057a8", letra: "PP"  },
  { keys: ["inter loop"],                bg: "#ff6b00", letra: "IL"  },
  { keys: ["inter empresas"],            bg: "#ff6b00", letra: "IE"  },
  { keys: ["volare"],                    bg: "#c8102e", letra: "VL"  },
  { keys: ["membership","amex"],         bg: "#006fcf", letra: "MR"  },
  { keys: ["safra"],                     bg: "#003366", letra: "SR"  },
  { keys: ["suma"],                      bg: "#1e3a4a", letra: "SU"  },
  { keys: ["cressol"],                   bg: "#007b5e", letra: "CR"  },
  { keys: ["banrisul"],                  bg: "#003087", letra: "BR"  },
  { keys: ["unicred"],                   bg: "#009900", letra: "UC"  },
  { keys: ["milhas plus"],               bg: "#e8a000", letra: "M+"  },
  { keys: ["xp pontos"],                 bg: "#1a1a2e", letra: "XP"  },
  { keys: ["nubank"],                    bg: "#820ad1", letra: "NU"  },
  { keys: ["ailos"],                     bg: "#007b5e", letra: "AI"  },
  { keys: ["banestes"],                  bg: "#003087", letra: "BN"  },
  { keys: ["bb empresas"],               bg: "#f5a800", letra: "BB"  },
  { keys: ["itaú empresas","itau empresas"], bg: "#003087", letra: "ITE" },
  { keys: ["pontos btg"],                bg: "#1a1a2e", letra: "BTG" },
  { keys: ["iberia"],                    bg: "#cc0000", letra: "IB"  },
  { keys: ["mileageplus","united"],      bg: "#002244", letra: "UA"  },
  { keys: ["all accor","accor"],         bg: "#c8102e", letra: "AL"  },
  { keys: ["ihg"],                       bg: "#6a0dad", letra: "IHG" },
  { keys: ["aadvantage","american"],     bg: "#0078d2", letra: "AA"  },
  { keys: ["flying blue"],               bg: "#003087", letra: "FB"  },
  { keys: ["british"],                   bg: "#2b4090", letra: "BA"  },
  { keys: ["qatar"],                     bg: "#5c0632", letra: "QR"  },
  { keys: ["aeroplan"],                  bg: "#c8102e", letra: "AP"  },
  { keys: ["copa","connectmiles"],       bg: "#0033a0", letra: "CM"  },
  { keys: ["delta"],                     bg: "#c8102e", letra: "DL"  },
  { keys: ["emirates"],                  bg: "#c8102e", letra: "EK"  },
  { keys: ["virgin","flying club"],      bg: "#e8003d", letra: "VS"  },
  { keys: ["finnair"],                   bg: "#003580", letra: "AY"  },
  { keys: ["wyndham"],                   bg: "#003087", letra: "WY"  },
];

const getLogo = (nome = "") => {
  const n = nome.toLowerCase();
  for (const l of LOGOS_MAP) {
    if (l.keys.some((k) => n.includes(k))) return l;
  }
  return { bg: "#607d8b", letra: (nome || "??").slice(0, 2).toUpperCase() };
};

const LogoCircle = ({ nome, size = 20 }) => {
  const { bg, letra } = getLogo(nome);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      background: bg, color: "#fff",
      fontSize: size * 0.33, fontWeight: 700, flexShrink: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    }}>{letra}</span>
  );
};

// ── Helper FireDAC (mesma do Contas) ─────────────────────────────────────
const extractRows = (data) => {
  if (!data) return [];
  if (data.FDBS) {
    try {
      const tables = data.FDBS.Manager.TableList;
      if (tables?.length > 0 && tables[0].RowList)
        return tables[0].RowList.map((r) => r.Original);
    } catch (e) {}
  }
  if (data.Table && Array.isArray(data.Table)) return data.Table;
  if (Array.isArray(data)) return data;
  return [];
};

// ── Função para formatar número com separador de milhar ──────────────────
const formatNumberWithThousand = (value) => {
  if (!value && value !== 0) return "";
  return value.toLocaleString("pt-BR");
};

const parseFormattedNumber = (value) => {
  if (!value) return 0;
  const cleanValue = String(value).replace(/\./g, "").replace(",", ".");
  return parseFloat(cleanValue) || 0;
};

export default function SaidaManualPontos({ clienteId: clienteIdProp }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cartoes, setCartoes] = useState([]);
  const [titulares, setTitulares] = useState([]);  // ← array com todos titulares
  const [clienteId, setClienteId] = useState(null);

  // ── Estados de controle ───────────────────────────────────────────────────
  const [origemMilhas, setOrigemMilhas] = useState("proprias");
  const [cartaoSelecionado, setCartaoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(0);
  const [quantidadeDisplay, setQuantidadeDisplay] = useState("");
  const [precoPagante, setPrecoPagante] = useState(0);
  const [extras, setExtras] = useState(0);
  const [fileList, setFileList] = useState([]);

  // ── Cálculos derivados ────────────────────────────────────────────────────
  const custoMedio = cartaoSelecionado?.car_vunitario ?? cartaoSelecionado?.CAR_VUNITARIO ?? 0;
  const saldoDisp  = cartaoSelecionado?.car_saldo_milhas ?? 0;
  
  const precoEmMilhas = custoMedio > 0 && quantidade > 0
    ? (custoMedio / 1000) * quantidade
    : 0;
  
  const economiaGerada = precoPagante > 0 && (precoEmMilhas > 0 || extras > 0)
    ? precoPagante - precoEmMilhas - extras
    : 0;
  
  const economiaPercent = precoPagante > 0 && economiaGerada > 0
    ? Math.round((economiaGerada / precoPagante) * 100)
    : 0;

  const formatLocaleNumber = (value) => {
    if (!value && value !== 0) return "";
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ── Carregamento inicial ────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    if (!id) {
      const storedUser = localStorage.getItem("user");
      const storedUserId = localStorage.getItem("userID");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          id = user.cli_id || user.id;
        } catch (e) {}
      }
      if (!id && storedUserId) id = parseInt(storedUserId);
    }
    if (id) {
      setClienteId(id);
      carregarDados(id);
    } else {
      message.error("Usuário não autenticado. Faça login novamente.");
    }
  }, [clienteIdProp]);

  const carregarDados = async (id) => {
    setLoading(true);
    try {
      // 1. Busca todos os titulares do gestor (PesquisaTitular)
      const titRes = await api.get("/ServerPrincipal/PesquisaTitular", { params: { Cliente: id } });
      const titRows = extractRows(titRes.data);

      // 2. Deduplica titulares pelo cli_id (mesma técnica do Contas)
      const seen = new Set();
      const titularesDeduplic = titRows.filter((t) => {
        const k = String(t.cli_id ?? t.CLI_ID ?? "");
        if (!k || k === "0" || seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      // 3. Busca cartões de CADA titular individualmente
      const carResArr = await Promise.all(
        titularesDeduplic.map((t) => {
          const cliId = t.cli_id ?? t.CLI_ID;
          return api.get("/ServerPrincipal/PesquisaCartoes", { params: { Cliente: cliId } })
            .then((res) => ({ cliId, rows: extractRows(res.data), tit: t }))
            .catch(() => ({ cliId, rows: [], tit: t }));
        })
      );

      // 4. Monta lista flat de cartões enriquecidos com dados do titular
      const cartoesFlat = [];
      const seenCar = new Set();
      carResArr.forEach(({ rows, tit }) => {
        rows.forEach((c) => {
          const carKey = String(c.car_id ?? c.CAR_ID ?? "");
          if (!carKey || seenCar.has(carKey)) return;
          seenCar.add(carKey);
          cartoesFlat.push({
            car_id:            c.car_id            ?? c.CAR_ID,
            car_nome_programa: c.car_nome_programa  ?? c.CAR_NOME_PROGRAMA ?? "",
            car_saldo_milhas:  c.car_saldo_milhas   ?? c.CAR_SALDO_MILHAS  ?? 0,
            car_vunitario:     c.car_vunitario      ?? c.CAR_VUNITARIO     ?? 0,
            cli_id:            tit.cli_id           ?? tit.CLI_ID,
            cli_nome:          tit.cli_nome         ?? tit.CLI_NOME        ?? "",
            cli_email:         tit.cli_email        ?? tit.CLI_EMAIL       ?? "",
            cli_cpf:           tit.cli_cpf          ?? tit.CLI_CPF         ?? "",
            cli_telefone:      tit.cli_telefone     ?? tit.CLI_TELEFONE    ?? "",
          });
        });
      });

      setTitulares(titularesDeduplic);
      setCartoes(cartoesFlat);
    } catch (e) {
      message.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleCartaoChange = (id) => {
    const cartao = cartoes.find((x) => x.car_id === id);
    if (cartao) {
      const custo = cartao.car_vunitario ?? 0;
      setCartaoSelecionado({ ...cartao, car_vunitario: Number(custo) });
    } else {
      setCartaoSelecionado(null);
    }
  };

  const handleOrigemChange = (value) => {
    setOrigemMilhas(value);
    setCartaoSelecionado(null);
    form.setFieldsValue({
      cartaoId: undefined,
      fornecedorNome: "",
      fornecedorContato: "",
      custoMilheiroBalcao: "",
    });
  };

  const handleQuantidadeChange = (value) => {
    const numericValue = parseFormattedNumber(value);
    setQuantidade(numericValue);
    setQuantidadeDisplay(formatNumberWithThousand(numericValue));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    if (!clienteId) { message.error("Cliente não identificado."); return; }
    if (!quantidade || quantidade <= 0) { message.error("Informe a quantidade."); return; }

    setLoading(true);
    try {
      const payload = {
        IDCliente:      clienteId,
        IDCartao:       origemMilhas === "proprias" ? values.cartaoId : null,
        QtdeMilhas:     quantidade,
        Motivo:         values.motivo,
        PrecoPagante:   precoPagante,
        Extras:         extras,
        PrecoEmMilhas:  precoEmMilhas,
        CustoTotal:     precoEmMilhas,
        EconomiaGerada: economiaGerada,
        EconomiaPercent: economiaPercent,
        Observacoes:    values.observacoes || "",
        DataOperacao:   values.dataOperacao
          ? values.dataOperacao.format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),
        OrigemMilhas:   origemMilhas,
        FornecedorNome:    origemMilhas === "balcao" ? values.fornecedorNome : "",
        FornecedorContato: origemMilhas === "balcao" ? values.fornecedorContato : "",
        CustoMilheiro:     origemMilhas === "balcao" ? values.custoMilheiroBalcao : custoMedio,
      };

      const response = await api.post("/ServerPrincipal/InserirSaidaMilhas", payload);

      if (response.status === 200 || response.status === 201) {
        message.success(`Saída registrada! ${quantidade.toLocaleString("pt-BR")} pontos debitados`);
        form.resetFields();
        setQuantidade(0);
        setQuantidadeDisplay("");
        setPrecoPagante(0);
        setExtras(0);
        setCartaoSelecionado(null);
        setOrigemMilhas("proprias");
        setFileList([]);
      } else {
        message.error(response.data || "Erro ao registrar saída");
      }
    } catch (e) {
      message.error(e.response?.data || "Erro ao registrar saída");
    } finally {
      setLoading(false);
    }
  };

  const cartaoIdWatch   = Form.useWatch("cartaoId", form);
  const motivoWatch     = Form.useWatch("motivo", form);
  const fornecedorWatch = Form.useWatch("fornecedorNome", form);

  const isFormValid = origemMilhas === "proprias"
    ? !!cartaoIdWatch && !!motivoWatch && quantidade > 0
    : !!fornecedorWatch && !!motivoWatch && quantidade > 0;

  const motivosProprias = [
    { value: "ajuste_caixa",        label: "Ajuste de Caixa (não entra na economia)" },
    { value: "compra_produto",      label: "Compra de Produto" },
    { value: "desconto_fatura",     label: "Desconto na Fatura do Cartão de Crédito" },
    { value: "gift_card",           label: "Gift Card" },
    { value: "ingressos",           label: "Ingressos" },
    { value: "locacao_veiculo",     label: "Locação de Veículo" },
    { value: "hospedagem",          label: "Hospedagem" },
  ];

  // ── Styles ────────────────────────────────────────────────────────────────
  const pageStyle = {
    minHeight: "100vh",
    background: "#f0f2f5",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "32px 16px",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: 820,
    borderRadius: 8,
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    background: "#fff",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "18px 24px 14px",
    borderBottom: "1px solid #f0f0f0",
  };

  const labelStyle = {
    fontSize: 12,
    color: "#666",
    fontWeight: 500,
    marginBottom: 4,
    display: "block",
  };

  const inputStyle = {
    width: "100%",
    borderRadius: 4,
    border: "1px solid #d9d9d9",
    background: "#fafafa",
    height: 36,
    fontSize: 14,
  };

  const disabledInputStyle = {
    ...inputStyle,
    background: "#f5f5f5",
    color: "#888",
    cursor: "not-allowed",
  };

  const formItemStyle = { marginBottom: 14 };

  const submitBtnStyle = {
    height: 36,
    padding: "0 32px",
    background: isFormValid ? "#1677ff" : "#bfbfbf",
    border: "none",
    borderRadius: 4,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.05em",
    cursor: isFormValid ? "pointer" : "not-allowed",
    float: "right",
  };

  return (
    <div style={pageStyle}>
      <Spin spinning={loading}>
        <div style={cardStyle}>
          <div style={headerStyle}>
            <ArrowUpOutlined style={{ fontSize: 16, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>
              Saída Manual de Pontos
            </span>
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                origemMilhas: "proprias",
                dataOperacao: dayjs(),
              }}
            >
              {/* ── Origem das Milhas ── */}
              <div style={formItemStyle}>
                <label style={labelStyle}>Origem das Milhas:</label>
                <Form.Item name="origemMilhas" noStyle>
                  <Select
                    size="middle"
                    style={{ width: 220 }}
                    onChange={handleOrigemChange}
                  >
                    <Option value="proprias">Milhas Próprias</Option>
                    <Option value="balcao">Balcão de Milhas</Option>
                  </Select>
                </Form.Item>
              </div>

              {/* ── Bloco Milhas Próprias ── */}
              {origemMilhas === "proprias" && (
                <Row gutter={16} style={{ marginBottom: 14 }}>
                  <Col xs={24} sm={12}>
                    <div style={formItemStyle}>
                      <label style={labelStyle}>Titular/Conta da Operação</label>
                      <Form.Item
                        name="cartaoId"
                        noStyle
                        rules={[{ required: true, message: "Selecione a conta" }]}
                      >
                        <Select
                          size="middle"
                          style={{ width: "100%" }}
                          placeholder="Selecione a conta"
                          loading={loading}
                          onChange={handleCartaoChange}
                        >
                          {cartoes.map((c) => {
                            const programa = c.car_nome_programa || "";
                            const primeiroNome = (c.cli_nome || "").split(" ")[0];
                            return (
                              <Option key={c.car_id} value={c.car_id}>
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <LogoCircle nome={programa} size={20} />
                                  {primeiroNome} - {programa}
                                </span>
                              </Option>
                            );
                          })}
                        </Select>
                      </Form.Item>
                    </div>
                  </Col>
                  <Col xs={24} sm={6}>
                    <div style={formItemStyle}>
                      <label style={labelStyle}>Custo Médio</label>
                      <Input
                        size="middle"
                        style={disabledInputStyle}
                        readOnly
                        value={custoMedio > 0 ? formatLocaleNumber(custoMedio) : ""}
                        placeholder="0,00"
                        suffix={<span style={{ color: "#bbb" }}>$</span>}
                      />
                    </div>
                  </Col>
                  <Col xs={24} sm={6}>
                    <div style={formItemStyle}>
                      <label style={labelStyle}>Saldo Disponível</label>
                      <Input
                        size="middle"
                        style={disabledInputStyle}
                        readOnly
                        value={saldoDisp > 0 ? saldoDisp.toLocaleString("pt-BR") : ""}
                        placeholder="0"
                        suffix={<span style={{ color: "#bbb" }}>#</span>}
                      />
                    </div>
                  </Col>
                </Row>
              )}

              {/* ── Bloco Balcão de Milhas ── */}
              {origemMilhas === "balcao" && (
                <Row gutter={16} style={{ marginBottom: 14 }}>
                  <Col xs={24} sm={10}>
                    <div style={formItemStyle}>
                      <label style={labelStyle}>Nome do Fornecedor</label>
                      <Form.Item
                        name="fornecedorNome"
                        noStyle
                        rules={[{ required: true, message: "Informe o fornecedor" }]}
                      >
                        <Input
                          size="middle"
                          style={inputStyle}
                          placeholder="Ex: João Silva Milhas"
                        />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={formItemStyle}>
                      <label style={labelStyle}>Contato</label>
                      <Form.Item name="fornecedorContato" noStyle>
                        <Input
                          size="middle"
                          style={inputStyle}
                          placeholder="Telefone / WhatsApp"
                        />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col xs={24} sm={6}>
                    <div style={formItemStyle}>
                      <label style={labelStyle}>Custo do Milheiro (R$)</label>
                      <Form.Item name="custoMilheiroBalcao" noStyle>
                        <InputNumber
                          size="middle"
                          style={inputStyle}
                          min={0}
                          controls={false}
                          placeholder="0,00"
                          formatter={(v) =>
                            v !== undefined && v !== null
                              ? String(v).replace(".", ",")
                              : ""
                          }
                          parser={(v) => (v ? parseFloat(v.replace(",", ".")) || 0 : 0)}
                          suffix={<span style={{ color: "#bbb" }}>$</span>}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
              )}

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0 16px" }} />

              {/* ── Motivo + Data ── */}
              <Row gutter={16} style={{ marginBottom: 14 }}>
                <Col xs={24} sm={14}>
                  <div style={formItemStyle}>
                    <label style={labelStyle}>Motivo da Saída</label>
                    <Form.Item
                      name="motivo"
                      noStyle
                      rules={[{ required: true, message: "Selecione o motivo" }]}
                    >
                      <Select
                        size="middle"
                        style={{ width: "100%" }}
                        placeholder="Selecione o motivo"
                      >
                        {motivosProprias.map((m) => (
                          <Option key={m.value} value={m.value}>
                            {m.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={10}>
                  <div style={formItemStyle}>
                    <label style={labelStyle}>Data Operação</label>
                    <Form.Item name="dataOperacao" noStyle>
                      <DatePicker
                        style={inputStyle}
                        format="DD/MM/YYYY"
                        size="middle"
                        disabledDate={(c) => c && c > dayjs().endOf("day")}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              {/* ── Preço Pagante + Print + Extras + Quantidade ── */}
              <Row gutter={12} style={{ marginBottom: 4 }}>
                <Col xs={12} sm={6}>
                  <div style={formItemStyle}>
                    <label style={labelStyle}>Preço Pagante</label>
                    <InputNumber
                      size="middle"
                      style={inputStyle}
                      min={0}
                      controls={false}
                      onChange={(v) => setPrecoPagante(Number(v) || 0)}
                      placeholder="0,00"
                      formatter={(v) =>
                        v !== undefined && v !== null
                          ? String(v).replace(".", ",")
                          : ""
                      }
                      parser={(v) => (v ? parseFloat(v.replace(",", ".")) || 0 : 0)}
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={formItemStyle}>
                    <label style={labelStyle}>&nbsp;</label>
                    <Upload
                      fileList={fileList}
                      onChange={({ fileList: newList }) => setFileList(newList)}
                      beforeUpload={() => false}
                      maxCount={1}
                      showUploadList={false}
                    >
                      <Button
                        icon={<PrinterOutlined />}
                        style={{
                          width: "100%",
                          height: 36,
                          border: "1px solid #d9d9d9",
                          borderRadius: 4,
                          background: "#fafafa",
                          fontSize: 13,
                        }}
                      >
                        PRINT
                      </Button>
                    </Upload>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                      {fileList.length > 0 ? fileList[0].name : "Nenhum arquivo selecionado."}
                    </div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={formItemStyle}>
                    <label style={labelStyle}>Extras</label>
                    <InputNumber
                      size="middle"
                      style={inputStyle}
                      min={0}
                      controls={false}
                      onChange={(v) => setExtras(Number(v) || 0)}
                      placeholder="0,00"
                      formatter={(v) =>
                        v !== undefined && v !== null
                          ? String(v).replace(".", ",")
                          : ""
                      }
                      parser={(v) => (v ? parseFloat(v.replace(",", ".")) || 0 : 0)}
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={formItemStyle}>
                    <label style={labelStyle}>Quantidade</label>
                    <Input
                      size="middle"
                      style={inputStyle}
                      value={quantidadeDisplay}
                      onChange={(e) => handleQuantidadeChange(e.target.value)}
                      placeholder="0"
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
              </Row>

              {/* ── Preço em Milhas + Economia Gerada + Economia % ── */}
              <Row gutter={12} style={{ marginBottom: 14 }}>
                <Col xs={24} sm={8}>
                  <div style={formItemStyle}>
                    <label style={labelStyle}>Preço em Milhas</label>
                    <Input
                      size="middle"
                      style={disabledInputStyle}
                      readOnly
                      value={precoEmMilhas > 0 ? formatLocaleNumber(precoEmMilhas) : ""}
                      placeholder="0,00"
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={formItemStyle}>
                    <label style={labelStyle}>Economia Gerada</label>
                    <Input
                      size="middle"
                      style={disabledInputStyle}
                      readOnly
                      value={economiaGerada > 0 ? formatLocaleNumber(economiaGerada) : ""}
                      placeholder="0,00"
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={formItemStyle}>
                    <label style={labelStyle}>Economia em %</label>
                    <Input
                      size="middle"
                      style={disabledInputStyle}
                      readOnly
                      value={economiaPercent !== 0 ? economiaPercent : ""}
                      placeholder="0"
                      suffix={<span style={{ color: "#bbb" }}>%</span>}
                    />
                  </div>
                </Col>
              </Row>

              {/* ── Observações ── */}
              <div style={formItemStyle}>
                <label style={labelStyle}>Observações:</label>
                <Form.Item name="observacoes" noStyle>
                  <Input.TextArea
                    rows={4}
                    style={{
                      width: "100%",
                      borderRadius: 4,
                      border: "1px solid #d9d9d9",
                      fontSize: 13,
                      resize: "vertical",
                    }}
                  />
                </Form.Item>
              </div>

              {/* Submit */}
              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <button
                  type="submit"
                  style={submitBtnStyle}
                  disabled={loading || !isFormValid}
                >
                  {loading ? "PROCESSANDO..." : "REGISTRAR SAÍDA"}
                </button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Spin>
    </div>
  );
}