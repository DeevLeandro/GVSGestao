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
} from "antd";
import { ShoppingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const { Option } = Select;

// ── Logos programas ─────────────────────────────────────────────────────
const LOGOS_MAP = [
  { keys: ["livelo"],                    bg: "#e800b2", letra: "LV"  },
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
  { keys: ["átomos","atomos"],           bg: "#000000", letra: "ÁT"  },
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

// ─── FUNÇÃO AUXILIAR PARA EXTRAIR DADOS (padronizada) ─────────────────────
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

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function Compra() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cartoes, setCartoes] = useState([]);
  const [cartoesCredito, setCartoesCredito] = useState([]);
  const [titulares, setTitulares] = useState([]);  // ← array com todos titulares
  const [saldo, setSaldo] = useState(null);
  const [qtd, setQtd] = useState(null);
  const [precoMilheiro, setPrecoMilheiro] = useState(null);
  const [custoTotal, setCustoTotal] = useState(null);
  const [editando, setEditando] = useState(null);
  const [clienteId, setClienteId] = useState(null);

  const parseLocaleNumber = (value) => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    const str = String(value).replace(/\./g, "").replace(",", ".");
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const formatLocaleNumber = (value) => {
    if (!value && value !== 0) return "";
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calcularPrecoMilheiro = (q, c) => (!q || q <= 0 || !c || c <= 0) ? null : c / (q / 1000);
  const calcularCustoTotal = (q, p) => (!q || q <= 0 || !p || p <= 0) ? null : (q / 1000) * p;

  // Carrega o ID do cliente do localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedUserId = localStorage.getItem("userID");
    let userId = null;
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userId = user.cli_id || user.id;
      } catch (e) {}
    }
    if (!userId && storedUserId) userId = parseInt(storedUserId);
    
    if (userId) {
      setClienteId(userId);
    } else {
      message.error("Usuário não autenticado. Faça login novamente.");
    }
  }, []);

  useEffect(() => {
    if (editando === "custo") {
      const q = Number(qtd) || 0, c = Number(custoTotal) || 0;
      if (q > 0 && c > 0) {
        const p = calcularPrecoMilheiro(q, c);
        setPrecoMilheiro(p);
        form.setFieldValue("precoMilheiro", formatLocaleNumber(p));
      } else {
        setPrecoMilheiro(null);
        form.setFieldValue("precoMilheiro", null);
      }
    }
  }, [qtd, custoTotal, editando]);

  useEffect(() => {
    if (editando === "preco") {
      const q = Number(qtd) || 0, p = Number(precoMilheiro) || 0;
      if (q > 0 && p > 0) {
        const c = calcularCustoTotal(q, p);
        setCustoTotal(c);
        form.setFieldValue("custoTotal", formatLocaleNumber(c));
      } else {
        setCustoTotal(null);
        form.setFieldValue("custoTotal", null);
      }
    }
  }, [qtd, precoMilheiro, editando]);

  useEffect(() => {
    if (!clienteId) return;
    carregarDados(clienteId);
  }, [clienteId]);

  const carregarDados = async (id) => {
    setLoading(true);
    try {
      // 1. Busca todos os titulares do gestor (PesquisaTitular)
      const titRes = await api.get("/ServerPrincipal/PesquisaTitular", { params: { Cliente: id } });
      const titRows = extractRows(titRes.data);

      // 2. Deduplica titulares pelo cli_id
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

      // 5. Busca cartões de crédito
      const creRes = await api.get("/ServerPrincipal/PesquisaCartaoCredito", { params: { Cliente: id } }).catch(() => ({ data: [] }));
      const creRows = extractRows(creRes.data);

      setTitulares(titularesDeduplic);
      setCartoes(cartoesFlat);
      setCartoesCredito(creRows);
      
      if (cartoesFlat.length > 0) {
        form.setFieldValue("cartaoId", cartoesFlat[0].car_id);
        setSaldo(cartoesFlat[0].car_saldo_milhas ?? null);
      }
    } catch (e) {
      message.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustoTotalChange = (value) => {
    setEditando("custo");
    const n = parseLocaleNumber(value);
    setCustoTotal(n);
    const q = Number(qtd) || 0;
    if (q > 0 && n > 0) {
      const p = calcularPrecoMilheiro(q, n);
      setPrecoMilheiro(p);
      form.setFieldValue("precoMilheiro", formatLocaleNumber(p));
    } else {
      setPrecoMilheiro(null);
      form.setFieldValue("precoMilheiro", null);
    }
  };

  const handlePrecoMilheiroChange = (value) => {
    setEditando("preco");
    const n = parseLocaleNumber(value);
    setPrecoMilheiro(n);
    const q = Number(qtd) || 0;
    if (q > 0 && n > 0) {
      const c = calcularCustoTotal(q, n);
      setCustoTotal(c);
      form.setFieldValue("custoTotal", formatLocaleNumber(c));
    } else {
      setCustoTotal(null);
      form.setFieldValue("custoTotal", null);
    }
  };

  const handleQuantidadeChange = (value) => {
    const q = Number(value) || 0;
    setQtd(q);
    if (custoTotal > 0 && editando === "custo") {
      const p = calcularPrecoMilheiro(q, custoTotal);
      setPrecoMilheiro(p);
      form.setFieldValue("precoMilheiro", formatLocaleNumber(p));
    } else if (precoMilheiro > 0 && editando === "preco") {
      const c = calcularCustoTotal(q, precoMilheiro);
      setCustoTotal(c);
      form.setFieldValue("custoTotal", formatLocaleNumber(c));
    }
  };

  const handleSubmit = async (values) => {
    if (!clienteId) {
      message.error("Cliente não identificado.");
      return;
    }
    if (!qtd || qtd <= 0) {
      message.error("Informe uma quantidade válida");
      return;
    }
    
    let valorUnitarioPorMilha, valorTotal;
    
    if (custoTotal && custoTotal > 0) {
      valorTotal = custoTotal;
      valorUnitarioPorMilha = valorTotal / qtd;
    } else if (precoMilheiro && precoMilheiro > 0) {
      valorUnitarioPorMilha = precoMilheiro / 1000;
      valorTotal = qtd * valorUnitarioPorMilha;
    } else {
      message.error("Informe o Custo Total ou o Preço do Milheiro");
      return;
    }
    
    valorUnitarioPorMilha = Math.round(valorUnitarioPorMilha * 100000) / 100000;
    valorTotal = Math.round(valorTotal * 100) / 100;
    
    setLoading(true);
    
    try {
      let dataExpiracao = null;
      let expira = 0;
      
      if (values.prazo && values.prazo > 0) {
        expira = values.prazo;
        dataExpiracao = dayjs().add(values.prazo, 'month').format("YYYY-MM-DD");
      }
      
      const response = await api.post("/ServerPrincipal/InserirCompras", {
        IDCliente: clienteId,
        IDCartao: values.cartaoId,
        Qtde: qtd,
        Univalor: valorUnitarioPorMilha.toFixed(6).replace(".", ","),
        Totvalor: valorTotal.toFixed(2).replace(".", ","),
        Codigo: values.formaPagamento || "CARTAO_CREDITO",
        Observacoes: values.observacoes || "",
        DataCompra: values.dataCompra ? values.dataCompra.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        ValidadeMeses: values.prazo || 0,
        DataExpiracao: dataExpiracao || "",
        Expira: expira,
        Parcelas: values.parcelas || 1,
      });
      
      if (response.status === 200 || response.status === 201) {
        message.success(`Compra realizada! R$ ${valorTotal.toFixed(2).replace(".", ",")}`);
        
        form.resetFields(["quantidade", "precoMilheiro", "custoTotal", "observacoes"]);
        setQtd(null);
        setPrecoMilheiro(null);
        setCustoTotal(null);
        setEditando(null);
        
        // Recarregar dados para atualizar saldo
        carregarDados(clienteId);
      } else {
        message.error("Erro ao realizar compra");
      }
    } catch (error) {
      message.error(error.response?.data || "Erro ao realizar compra");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = qtd && qtd > 0 && ((custoTotal && custoTotal > 0) || (precoMilheiro && precoMilheiro > 0));

  // ─── Styles ───────────────────────────────────────────────────────────────
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
    maxWidth: 700,
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

  const saldoInputStyle = {
    width: "100%",
    borderRadius: 4,
    border: "1px solid #d9d9d9",
    background: "#f5f5f5",
    height: 36,
    fontSize: 14,
    color: "#999",
    cursor: "not-allowed",
  };

  const submitBtnStyle = {
    width: "100%",
    height: 40,
    background: isFormValid ? "#1677ff" : "#bfbfbf",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.05em",
    cursor: isFormValid ? "pointer" : "not-allowed",
  };

  return (
    <div style={pageStyle}>
      <Spin spinning={loading}>
        <div style={cardStyle}>
          <div style={headerStyle}>
            <ShoppingOutlined style={{ fontSize: 17, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>
              Compra de Pontos
            </span>
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                dataCompra: dayjs(),
                prazo: 24,
                formaPagamento: "CARTAO_CREDITO",
                parcelas: 1,
              }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={14}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Titular/Conta da Operação</label>
                    <Form.Item name="cartaoId" noStyle>
                      <Select
                        size="middle"
                        style={{ width: "100%" }}
                        onChange={id => {
                          const c = cartoes.find(x => x.car_id === id);
                          if (c) setSaldo(c.car_saldo_milhas ?? null);
                        }}
                        placeholder="Selecione uma conta"
                      >
                        {cartoes.map(c => {
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
                <Col xs={24} sm={10}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Saldo Disponível</label>
                    <Input
                      style={saldoInputStyle}
                      value={saldo !== null ? saldo.toLocaleString("pt-BR") : ""}
                      readOnly
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
              </Row>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0 14px" }} />

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Pontos</label>
                    <Form.Item name="quantidade" noStyle>
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder="0"
                        min={0}
                        controls={false}
                        size="middle"
                        onChange={handleQuantidadeChange}
                        formatter={v => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                        parser={v => v ? v.replace(/\./g, "") : ""}
                        suffix={<span style={{ color: "#bbb" }}>#</span>}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Custo Total (R$)</label>
                    <Form.Item name="custoTotal" noStyle>
                      <Input
                        style={{ width: "100%" }}
                        placeholder="0,00"
                        size="middle"
                        onChange={e => handleCustoTotalChange(e.target.value)}
                        suffix={<span style={{ color: "#bbb" }}>$</span>}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Preço do Milheiro (R$)</label>
                    <Form.Item name="precoMilheiro" noStyle>
                      <Input
                        style={{ width: "100%" }}
                        placeholder="0,00"
                        size="middle"
                        onChange={e => handlePrecoMilheiroChange(e.target.value)}
                        suffix={<span style={{ color: "#bbb" }}>$</span>}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Data Operação</label>
                    <Form.Item name="dataCompra" noStyle>
                      <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        size="middle"
                        disabledDate={c => c && c > dayjs().endOf("day")}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Validade (Meses)</label>
                    <Form.Item name="prazo" noStyle>
                      <Select size="middle" style={{ width: "100%" }}>
                        <Option value={0}>Não Expira</Option>
                        <Option value={6}>6 meses</Option>
                        <Option value={12}>12 meses</Option>
                        <Option value={18}>18 meses</Option>
                        <Option value={24}>24 meses</Option>
                        <Option value={36}>36 meses</Option>
                        <Option value={60}>60 meses</Option>
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Cartão de Crédito</label>
                    <Form.Item name="formaPagamento" noStyle>
                      <Select size="middle" style={{ width: "100%" }} placeholder="Selecione um cartão">
                        {cartoesCredito.length > 0 ? (
                          cartoesCredito.map(c => (
                            <Option key={c.cre_id || c.id} value={c.cre_nome_cartao || c.nome_cartao}>
                              {c.cre_nome_cartao || c.nome_cartao}
                            </Option>
                          ))
                        ) : (
                          <Option value="CARTAO_CREDITO">Nenhum cartão associado</Option>
                        )}
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Parcelas</label>
                    <Form.Item name="parcelas" noStyle>
                      <Select size="middle" style={{ width: "100%" }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                          <Option key={n} value={n}>{n}x</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Data de Expiração</label>
                    <Form.Item name="dataExpiracao" noStyle>
                      <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        size="middle"
                        placeholder="Calculada automaticamente"
                        disabled
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Observações:</label>
                <Form.Item name="observacoes" noStyle>
                  <Input.TextArea
                    rows={3}
                    style={{ fontSize: 13, resize: "vertical" }}
                    placeholder="Observações adicionais..."
                  />
                </Form.Item>
              </div>

              <Form.Item style={{ marginBottom: 0 }}>
                <button
                  type="submit"
                  style={submitBtnStyle}
                  disabled={loading || !isFormValid}
                >
                  {loading ? "PROCESSANDO..." : "CONFIRMAR COMPRA"}
                </button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Spin>
    </div>
  );
}