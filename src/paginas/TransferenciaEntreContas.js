import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, InputNumber, DatePicker,
  Row, Col, Spin, message, Checkbox,
} from "antd";
import { PercentageOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";

const { Option } = Select;

// ── LOGOS_MAP (mantenha igual) ──────────────────────────────────────────
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

export default function TransferenciaEntreContas({ clienteId: clienteIdProp }) {
  const [form] = Form.useForm();
  const [loading, setLoading]               = useState(false);
  const [cartoes, setCartoes]               = useState([]);
  const [cartoesCredito, setCartoesCredito] = useState([]);
  const [titulares, setTitulares]           = useState([]);  // ← array com todos titulares
  const [cartaoOrig, setCartaoOrig]         = useState(null);
  const [clienteId, setClienteId]           = useState(null);

  const [pontosConta, setPontosConta]       = useState(0);
  const [pontosCarrinho, setPontosCarrinho] = useState(0);
  const [custoCarrinho, setCustoCarrinho]   = useState(0);
  const [bonus, setBonus]                   = useState(100);
  const [conversao, setConversao]           = useState(1);
  const [carrinho, setCarrinho]             = useState(false);
  const [taxas, setTaxas]                   = useState(0);

  const [validadeSel, setValidadeSel]       = useState(24);
  const [validadeOutros, setValidadeOutros] = useState("");

  // ── Cálculos ──────────────────────────────────────────────────────────
  const custoMilheiro = cartaoOrig
    ? Number(cartaoOrig.car_vunitario ?? cartaoOrig.CAR_VUNITARIO ?? 0)
    : 0;

  const totalMilhas = pontosConta + (carrinho ? pontosCarrinho : 0);
  const milhasBonusPuro = Math.round(totalMilhas * (bonus / 100));
  const milhasComBonus = totalMilhas + milhasBonusPuro;
  const totalTransf = Math.round(totalMilhas * conversao);

  const custoConta = custoMilheiro > 0 ? (pontosConta / 1000) * custoMilheiro : 0;
  const custoTotal = custoConta + (carrinho ? custoCarrinho : 0) + taxas;
  const custoMilheiroReal = milhasComBonus > 0 ? (custoTotal / milhasComBonus) * 1000 : 0;

  const fmtNum = (v) =>
    v > 0 ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

  const formatFloat = (value, decimals = 3) => {
    if (value === null || value === undefined || isNaN(value)) return "0";
    const num = Number(value);
    return num.toFixed(decimals).replace(".", ",");
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "0,00";
    const num = Number(value);
    return num.toFixed(2).replace(".", ",");
  };

  // ── REGRAS ──────────────────────────────────────────────────────────
  const ORIGENS_PERMITIDAS  = ["livelo","coopera","all accor","esfera","allaccor","accor","mileageplus","mileage plus","united"];
  const DESTINOS_BLOQUEADOS = ["livelo","coopera","all accor","esfera","allaccor","accor","mileageplus","mileage plus","united"];

  const cartoesOrigem = cartoes.filter((c) =>
    ORIGENS_PERMITIDAS.some((p) => (c.car_nome_programa || c.nome_programa || "").toLowerCase().includes(p))
  );

  const getCartoesDestino = (origemId) => {
    if (!origemId) return [];
    return cartoes.filter((c) => {
      if (c.car_id === origemId) return false;
      const n = (c.car_nome_programa || c.nome_programa || "").toLowerCase();
      return !DESTINOS_BLOQUEADOS.some((p) => n.includes(p));
    });
  };

  useEffect(() => {
    let id = clienteIdProp;
    if (!id) {
      try { const u = JSON.parse(localStorage.getItem("user") || "{}"); id = u.cli_id || u.id; } catch (e) {}
      if (!id) id = parseInt(localStorage.getItem("userID") || "0") || null;
    }
    if (id) { setClienteId(id); carregarDados(id); }
    else message.error("Usuário não autenticado.");
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

      // 5. Busca cartões de crédito
      const creRes = await api.get("/ServerPrincipal/PesquisaCartaoCredito", { params: { Cliente: id } }).catch(() => ({ data: [] }));
      const creRows = extractRows(creRes.data);

      setTitulares(titularesDeduplic);
      setCartoes(cartoesFlat);
      setCartoesCredito(creRows);
    } catch (e) {
      message.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrigemChange = (id) => {
    const cartao = cartoes.find((x) => x.car_id === id);
    setCartaoOrig(cartao || null);
    const destAtual = form.getFieldValue("cartaoDestinoId");
    if (destAtual && !getCartoesDestino(id).find((x) => x.car_id === destAtual))
      form.setFieldValue("cartaoDestinoId", undefined);
  };

  const handleSubmit = async (values) => {
    if (!clienteId)                       { message.error("Cliente não identificado."); return; }
    if (!values.cartaoOrigemId)           { message.error("Selecione a conta de origem."); return; }
    if (!values.cartaoDestinoId)          { message.error("Selecione a conta de destino."); return; }
    if (values.cartaoOrigemId === values.cartaoDestinoId) { message.error("Origem e destino devem ser diferentes."); return; }
    if (!totalMilhas || totalMilhas <= 0) { message.error("Informe os pontos da operação."); return; }

    const validMeses   = validadeSel === "outros" ? Number(validadeOutros) || 0 : Number(validadeSel) || 0;
    const temExpiracao = validMeses > 0;
    const dataExp      = temExpiracao
      ? (() => {
          const d = new Date(); d.setMonth(d.getMonth() + validMeses);
          return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
        })()
      : "31/12/2099";

    const payload = {
      IDCliente:       clienteId,
      CartaoOrigem:    values.cartaoOrigemId,
      CartaoDestino:   values.cartaoDestinoId,
      QtdeMilhas:      formatFloat(milhasComBonus, 0),
      QtdeMilhasBonus: formatFloat(milhasBonusPuro, 0),
      Tipo:            "TRANSFERENCIA",
      "Cobrança":      formatCurrency(custoTotal),
      Taxas:           formatCurrency(taxas),
      CustoTotal:      formatCurrency(custoTotal),
      Porcentagem:     formatFloat(bonus, 0),
      Observacoes:     values.observacoes || "",
      PrecoMilheiro:   formatCurrency(custoMilheiroReal),
      DataExpiracao:   dataExp,
      Expira:          temExpiracao ? "1" : "0",
      PontosCarinho:   formatFloat(pontosCarrinho,0),
    };

    setLoading(true);
    try {
      await api.post("/ServerPrincipal/InserirTransferencia", payload);
      message.success(`Transferência realizada! ${milhasComBonus.toLocaleString("pt-BR")} pontos transferidos`);
      form.resetFields();
      setPontosConta(0); setPontosCarrinho(0); setCustoCarrinho(0);
      setBonus(100); setConversao(1); setCarrinho(false); setCartaoOrig(null);
      setValidadeSel(24); setValidadeOutros(""); setTaxas(0);
    } catch (e) {
      const errMsg = e.response?.data || e.message || "Erro ao realizar transferência";
      message.error(String(errMsg));
    } finally {
      setLoading(false);
    }
  };

  const origemSel           = Form.useWatch("cartaoOrigemId", form);
  const destinoSel          = Form.useWatch("cartaoDestinoId", form);
  const destinosDisponiveis = getCartoesDestino(origemSel);
  const isFormValid         = totalMilhas > 0 && !!origemSel && !!destinoSel;

  const CartaoOpt = ({ c }) => {
    const prog = c.car_nome_programa || "";
    const primeiroNome = (c.cli_nome || "").split(" ")[0];
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LogoCircle nome={prog} size={20} />
        {primeiroNome} - {prog}
      </span>
    );
  };

  const lbl = { fontSize: 12, color: "#666", fontWeight: 500, marginBottom: 4, display: "block" };
  const inp = { width: "100%", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fafafa", height: 36, fontSize: 14 };
  const dis = { ...inp, background: "#f5f5f5", color: "#999", cursor: "not-allowed" };
  const fi  = { marginBottom: 14 };

  const fmtInt = {
    formatter: (v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "",
    parser:    (v) => v ? v.replace(/\./g, "") : "",
  };

  const fmtDec = {
    formatter: (v) => {
      if (!v && v !== 0) return "";
      const parts = String(v).split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return parts.length > 1 ? parts.join(",") : parts[0];
    },
    parser: (v) => v ? v.replace(/\./g, "").replace(",", ".") : "",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
      <Spin spinning={loading}>
        <div style={{ width: "100%", maxWidth: 860, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 24px 14px", borderBottom: "1px solid #f0f0f0" }}>
            <PercentageOutlined style={{ fontSize: 18, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>Transferência entre Contas</span>
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}
              initialValues={{ dataOperacao: dayjs(), bonus: 100, conversao: 1, parcelas: 1 }}
            >
              <Row gutter={16} align="middle" style={{ marginBottom: 14 }}>
                <Col xs={24} sm={11}>
                  <div style={fi}>
                    <label style={lbl}>Titular/Conta de Origem</label>
                    <Form.Item name="cartaoOrigemId" noStyle rules={[{ required: true }]}>
                      <Select size="middle" style={{ width: "100%" }}
                        placeholder="Livelo, Coopera, All Accor, MileagePlus..."
                        onChange={handleOrigemChange} loading={loading}
                      >
                        {cartoesOrigem.map((c) => (
                          <Option key={c.car_id} value={c.car_id}><CartaoOpt c={c} /></Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={2} style={{ textAlign: "center", paddingTop: 24 }}>
                  <span style={{ color: "#aaa", fontSize: 18 }}>»</span>
                </Col>
                <Col xs={24} sm={11}>
                  <div style={fi}>
                    <label style={lbl}>Titular/Conta de Destino</label>
                    <Form.Item name="cartaoDestinoId" noStyle rules={[{ required: true }]}>
                      <Select size="middle" style={{ width: "100%" }}
                        placeholder="Selecione o destino" loading={loading}
                      >
                        {destinosDisponiveis.map((c) => (
                          <Option key={c.car_id} value={c.car_id}><CartaoOpt c={c} /></Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginBottom: 14 }}>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Saldo disponível</label>
                    <Input size="middle" style={dis} readOnly
                      value={cartaoOrig ? (cartaoOrig.car_saldo_milhas || 0).toLocaleString("pt-BR") : ""}
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Custo médio (R$/milheiro)</label>
                    <Input size="middle" style={dis} readOnly
                      value={custoMilheiro > 0 ? fmtNum(custoMilheiro) : ""}
                      placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>
                </Col>
              </Row>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0 16px" }} />

              <Row gutter={24}>
                <Col xs={24} md={12} style={{ borderRight: "1px dashed #e0e0e0", paddingRight: 20 }}>
                  <div style={fi}>
                    <Row gutter={8}>
                      <Col flex="1">
                        <label style={lbl}>Pontos Conta</label>
                        <InputNumber size="middle"
                          style={{ ...inp, borderColor: cartaoOrig && pontosConta > Number(cartaoOrig.car_saldo_milhas || 0) ? "#ff4d4f" : undefined }}
                          min={0}
                          max={cartaoOrig ? Number(cartaoOrig.car_saldo_milhas || 0) : undefined}
                          controls={false}
                          value={pontosConta || null}
                          onChange={(v) => {
                            const saldo = cartaoOrig ? Number(cartaoOrig.car_saldo_milhas || 0) : Infinity;
                            const val   = Number(v) || 0;
                            setPontosConta(val > saldo ? saldo : val);
                          }}
                          {...fmtInt}
                          suffix={<span style={{ color: "#bbb" }}>#</span>}
                        />
                      </Col>
                      <Col style={{ width: 100 }}>
                        <label style={lbl}>Conversão</label>
                        <Form.Item name="conversao" noStyle>
                          <Select size="middle" style={{ width: "100%" }} onChange={(v) => setConversao(Number(v) || 1)}>
                            {[1,2,3,4,5].map((n) => <Option key={n} value={n}>{n}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  <div style={fi}>
                    <Checkbox checked={carrinho} onChange={(e) => {
                      setCarrinho(e.target.checked);
                      if (!e.target.checked) { setPontosCarrinho(0); setCustoCarrinho(0); }
                    }} style={{ fontSize: 12, color: "#555" }}>
                      Esta operação usou carrinho.
                    </Checkbox>
                  </div>

                  {carrinho && (
                    <>
                      <div style={fi}>
                        <Row gutter={8}>
                          <Col xs={12}>
                            <label style={lbl}>Pontos Carrinho</label>
                            <InputNumber size="middle" style={inp} min={0} controls={false}
                              value={pontosCarrinho || null}
                              onChange={(v) => setPontosCarrinho(Number(v) || 0)}
                              {...fmtInt}
                              suffix={<span style={{ color: "#bbb" }}>#</span>}
                            />
                          </Col>
                          <Col xs={12}>
                            <label style={lbl}>Custo Carrinho (R$)</label>
                            <InputNumber size="middle" style={inp} min={0} controls={false}
                              value={custoCarrinho || null}
                              onChange={(v) => setCustoCarrinho(Number(v) || 0)}
                              step={0.01}
                              {...fmtDec}
                              suffix={<span style={{ color: "#bbb" }}>$</span>}
                            />
                          </Col>
                        </Row>
                      </div>

                      <div style={fi}>
                        <Row gutter={8}>
                          <Col flex="1">
                            <label style={lbl}>Cartão de Crédito</label>
                            <Form.Item name="cartaoCreditoId" noStyle>
                              <Select size="middle" style={{ width: "100%" }} placeholder="Selecione">
                                {cartoesCredito.map((c) => {
                                  const band   = c.cre_bandeira    ?? c.CRE_BANDEIRA    ?? "";
                                  const numero = c.cre_numero      ?? c.CRE_NUMERO      ?? "";
                                  const nome   = c.cre_nome_cartao ?? c.CRE_NOME_CARTAO ?? band;
                                  return (
                                    <Option key={String(c.cre_id ?? "")} value={c.cre_id ?? c.CRE_ID}>
                                      {band} {numero ? `•••• ${numero}` : ""} {nome}
                                    </Option>
                                  );
                                })}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col style={{ width: 80 }}>
                            <label style={lbl}>Parcelas</label>
                            <Form.Item name="parcelas" noStyle>
                              <Select size="middle" style={{ width: "100%" }}>
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => <Option key={n} value={n}>{n}x</Option>)}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    </>
                  )}

                  <div style={fi}>
                    <label style={lbl}>Total de Pontos da Transferência</label>
                    <InputNumber size="middle" style={dis} disabled value={totalTransf || null} controls={false} {...fmtInt} suffix={<span style={{ color: "#bbb" }}>#</span>} />
                  </div>

                  <div style={fi}>
                    <label style={lbl}>Bônus (%)</label>
                    <Form.Item name="bonus" noStyle>
                      <InputNumber size="middle" style={inp} min={0} max={500} controls={false}
                        onChange={(v) => setBonus(Number(v) || 0)}
                        suffix={<span style={{ color: "#555" }}>%</span>}
                      />
                    </Form.Item>
                  </div>

                  <div style={fi}>
                    <label style={lbl}>Taxas (R$)</label>
                    <InputNumber size="middle" style={inp} min={0} controls={false}
                      value={taxas || null}
                      onChange={(v) => setTaxas(Number(v) || 0)}
                      step={0.01}
                      {...fmtDec}
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>

                  <div style={fi}>
                    <label style={lbl}>Custo Total da Operação</label>
                    <Input size="middle" style={dis} readOnly value={custoTotal > 0 ? fmtNum(custoTotal) : ""} placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>} />
                  </div>

                  <div style={fi}>
                    <label style={lbl}>Data da Operação</label>
                    <Form.Item name="dataOperacao" noStyle>
                      <DatePicker style={inp} format="DD/MM/YYYY" size="middle" disabledDate={(c) => c && c > dayjs().endOf("day")} />
                    </Form.Item>
                  </div>

                  <div style={fi}>
                    <label style={lbl}>Observações:</label>
                    <Form.Item name="observacoes" noStyle>
                      <Input.TextArea rows={4} style={{ width: "100%", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, resize: "vertical" }} />
                    </Form.Item>
                  </div>
                </Col>

                <Col xs={24} md={12} style={{ paddingLeft: 20 }}>
                  <div style={fi}>
                    <label style={lbl}>Custo Milheiro Real (R$/milheiro)</label>
                    <Input size="middle" style={dis} readOnly value={custoMilheiroReal > 0 ? fmtNum(custoMilheiroReal) : ""} placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>} />
                  </div>

                  <div style={fi}>
                    <Row gutter={8}>
                      <Col flex="1">
                        <label style={lbl}>Milhas (Base)</label>
                        <InputNumber size="middle" style={dis} disabled value={totalMilhas || null} controls={false} {...fmtInt} suffix={<span style={{ color: "#bbb" }}>#</span>} />
                      </Col>
                      <Col style={{ width: 130 }}>
                        <label style={lbl}>Validade</label>
                        <Select size="middle" style={{ width: "100%" }}
                          value={validadeSel}
                          onChange={(v) => { setValidadeSel(v); if (v !== "outros") setValidadeOutros(""); }}
                        >
                          <Option value={0}>Não Expira</Option>
                          <Option value={12}>12 meses</Option>
                          <Option value={24}>24 meses</Option>
                          <Option value={36}>36 meses</Option>
                          <Option value={48}>48 meses</Option>
                          <Option value={60}>60 meses</Option>
                          <Option value="outros">Outros:</Option>
                        </Select>
                        {validadeSel === "outros" && (
                          <Input size="middle" style={{ marginTop: 6, ...inp }}
                            placeholder="Meses" value={validadeOutros}
                            onChange={(e) => setValidadeOutros(e.target.value.replace(/\D/g, ""))}
                          />
                        )}
                      </Col>
                    </Row>
                  </div>

                  <div style={fi}>
                    <Row gutter={8}>
                      <Col flex="1">
                        <label style={lbl}>Milhas Bônus</label>
                        <InputNumber size="middle" style={dis} disabled value={milhasBonusPuro || null} controls={false} {...fmtInt} suffix={<span style={{ color: "#bbb" }}>#</span>} />
                      </Col>
                      <Col style={{ width: 130 }}>
                        <label style={lbl}>Validade Bônus</label>
                        <Form.Item name="validadeBonus" noStyle>
                          <Select size="middle" style={{ width: "100%" }}>
                            {[6,12,24,36].map((n) => <Option key={n} value={n}>{n} meses</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  <div style={fi}>
                    <label style={lbl}>Milhas Total (com bônus)</label>
                    <InputNumber size="middle" style={dis} disabled value={milhasComBonus || null} controls={false} {...fmtInt} suffix={<span style={{ color: "#bbb" }}>#</span>} />
                  </div>

                  <div style={fi}>
                    <label style={lbl}>Data do Bônus</label>
                    <Form.Item name="dataBonus" noStyle>
                      <DatePicker style={inp} format="DD/MM/YYYY" size="middle" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
                <button type="submit" disabled={loading || !isFormValid}
                  style={{
                    width: "100%", height: 36,
                    background: isFormValid ? "#1677ff" : "#bfbfbf",
                    border: "none", borderRadius: 4, color: "#fff",
                    fontSize: 13, fontWeight: 600, letterSpacing: "0.05em",
                    cursor: isFormValid ? "pointer" : "not-allowed",
                  }}
                >
                  {loading ? "PROCESSANDO..." : isFormValid ? "CONFIRMAR TRANSFERÊNCIA" : "PREENCHA OS DADOS!"}
                </button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Spin>
    </div>
  );
}