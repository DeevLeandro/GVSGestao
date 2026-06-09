import React, { useState, useEffect } from "react";
import {
  Form, Select, InputNumber, DatePicker,
  Row, Col, Spin, message, Input, Checkbox,
} from "antd";
import { SwapOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";

const { Option } = Select;

// ── LOGOS_MAP ──────────────────────────────────────────────────────────
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

// ── Helper FireDAC (padronizado) ─────────────────────────────────────
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

export default function PromocaoBumerangue({ clienteId: clienteIdProp }) {
  const [form] = Form.useForm();
  const [loading, setLoading]           = useState(false);
  const [cartoes, setCartoes]           = useState([]);
  const [cartoesCredito, setCartoesCredito] = useState([]);
  const [titulares, setTitulares]       = useState([]);  // ← array com todos titulares
  const [cartaoOrig, setCartaoOrig]     = useState(null);
  const [clienteId, setClienteId]       = useState(null);

  // Campos numéricos
  const [pontosConta, setPontosConta]       = useState(0);
  const [pontosCarrinho, setPontosCarrinho] = useState(0);
  const [custoCarrinho, setCustoCarrinho]   = useState(0);
  const [custoOrig, setCustoOrig]           = useState(0);
  const [custoDest, setCustoDest]           = useState(0);
  const [bIda, setBIda]                     = useState(40);
  const [bVolta, setBVolta]                 = useState(40);
  const [taxas, setTaxas]                   = useState(0);
  const [precoMilheiro, setPrecoMilheiro]   = useState(0);
  const [custoVolta, setCustoVolta]         = useState(0);

  // Carrinho
  const [carrinho, setCarrinho]             = useState(false);

  // Validade
  const [validadeSel, setValidadeSel]       = useState(24);
  const [validadeOutros, setValidadeOutros] = useState("");

  // ── Cálculos ──────────────────────────────────────────────────────────
  const totalMilhas  = pontosConta + (carrinho ? pontosCarrinho : 0);
  const mbi          = Math.round(totalMilhas * (bIda   / 100));
  const pbv          = Math.round(totalMilhas * (bVolta / 100));
  const totalPontos  = totalMilhas + mbi + pbv;

  const custoConta   = custoOrig > 0 ? (pontosConta / 1000) * custoOrig : 0;
  const custoTotal   = custoConta + (carrinho ? custoCarrinho : 0);
  const custoMilheiroReal = totalMilhas > 0 ? (custoTotal / totalMilhas) * 1000 : 0;
  const percentFinal = custoOrig > 0 && custoVolta > 0 ? (custoVolta / custoOrig) * 100 : 0;

  const formatLocaleNumber = (v) =>
    v > 0 ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

  const fmtCurr  = (v) => Number(v || 0).toFixed(2).replace(".", ",");
  const fmtFloat = (v) => Number(v || 0).toFixed(3).replace(".", ",");

  const ORIGENS_PERMITIDAS  = ["livelo","esfera"];
  const DESTINOS_BLOQUEADOS = ["esfera","all accor","allaccor","accor"];

  const cartoesOrigem = cartoes.filter((c) => {
    const nome = (c.car_nome_programa || c.nome_programa || "").toLowerCase();
    return ORIGENS_PERMITIDAS.some((p) => nome.includes(p));
  });

  const getCartoesDestino = (origemId) => {
    if (!origemId) return [];
    return cartoes.filter((c) => {
      if (c.car_id === origemId) return false;
      const nome = (c.car_nome_programa || c.nome_programa || "").toLowerCase();
      return !DESTINOS_BLOQUEADOS.some((p) => nome.includes(p));
    });
  };

  // ── Resolve clienteId ─────────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    if (!id) {
      try { const u = JSON.parse(localStorage.getItem("user") || "{}"); id = u.cli_id || u.id; } catch (e) {}
      if (!id) id = parseInt(localStorage.getItem("userID") || "0") || null;
    }
    if (id) { setClienteId(id); }
    else message.error("Usuário não autenticado.");
  }, [clienteIdProp]);

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
    } catch (e) {
      message.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrigemChange = (id) => {
    const cartao = cartoes.find((x) => x.car_id === id);
    setCartaoOrig(cartao || null);
    setCustoOrig(cartao ? Number(cartao.car_vunitario ?? 0) : 0);
    const destAtual = form.getFieldValue("cartaoDestinoId");
    if (destAtual && !getCartoesDestino(id).find((x) => x.car_id === destAtual))
      form.setFieldValue("cartaoDestinoId", undefined);
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    if (!clienteId)                     { message.error("Cliente não identificado."); return; }
    if (!totalMilhas || totalMilhas <= 0) { message.error("Informe a quantidade de milhas."); return; }
    if (!custoOrig || custoOrig <= 0)   { message.error("Custo do milheiro de origem não identificado."); return; }
    if (values.cartaoOrigemId === values.cartaoDestinoId) { message.error("Origem e destino devem ser diferentes."); return; }

    const validMeses = validadeSel === "outros" ? Number(validadeOutros) || 0 : Number(validadeSel) || 0;
    const temExpiracao = validMeses > 0;
    const dataExp = temExpiracao
      ? (() => {
          const d = new Date(); d.setMonth(d.getMonth() + validMeses);
          return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
        })()
      : "31/12/2099";

    setLoading(true);
    try {
      await api.post("/ServerPrincipal/InserirPromocaoBumerangue", {
        IDCliente:            clienteId,
        CartaoOrigemId:       values.cartaoOrigemId,
        CartaoDestinoId:      values.cartaoDestinoId,
        QtdeMilhas:           fmtFloat(totalMilhas),
        QtdeMilhasBonus:      fmtFloat(mbi + pbv),
        BonusIda:             bIda,
        BonusVolta:           bVolta,
        Porcentagem:          fmtFloat(bIda + bVolta),
        CustoMilheiroOrigem:  fmtCurr(custoOrig),
        CustoMilheiroDestino: fmtCurr(custoDest),
        CustoMilheiroVolta:   fmtCurr(custoVolta),
        CustoTotal:           fmtCurr(custoTotal),
        "Cobrança":           fmtCurr(custoTotal),
        Taxas:                fmtCurr(taxas),
        PrecoMilheiro:        fmtCurr(precoMilheiro),
        UsouCarrinho:         carrinho ? 1 : 0,
        PontosConta:          pontosConta,
        PontosCarrinho:       carrinho ? pontosCarrinho : 0,
        CustoCarrinho:        carrinho ? fmtCurr(custoCarrinho) : "0,00",
        IDCartaoCredito:      carrinho ? (values.cartaoCreditoId || 0) : 0,
        Parcelas:             carrinho ? (values.parcelas || 1) : 1,
        PercentualFinal:      fmtFloat(percentFinal),
        DataOperacao:         values.dataOperacao ? values.dataOperacao.format("DD/MM/YYYY") : dayjs().format("DD/MM/YYYY"),
        DataExpiracao:        dataExp,
        Expira:               temExpiracao ? "1" : "0",
        Observacoes:          values.observacoes || "",
        Tipo:                 "BUMERANGUE",
      });
      message.success(`Bumerangue realizada! Total: ${Math.round(totalPontos).toLocaleString("pt-BR")} pontos`);
      form.resetFields();
      setPontosConta(0); setPontosCarrinho(0); setCustoCarrinho(0);
      setCustoOrig(0); setCustoDest(0); setCustoVolta(0); setBIda(40); setBVolta(40);
      setCarrinho(false); setCartaoOrig(null); setTaxas(0); setPrecoMilheiro(0);
      setValidadeSel(24); setValidadeOutros("");
      carregarDados(clienteId);
    } catch (e) {
      message.error(e.response?.data || "Erro ao realizar operação");
    } finally {
      setLoading(false);
    }
  };

  const origemSel           = Form.useWatch("cartaoOrigemId", form);
  const destinoSel          = Form.useWatch("cartaoDestinoId", form);
  const destinosDisponiveis = getCartoesDestino(origemSel);
  const isFormValid         = totalMilhas > 0 && custoOrig > 0 && !!origemSel && !!destinoSel;

  const CartaoOpt = ({ c }) => {
    const prog         = c.car_nome_programa || "";
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

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
      <Spin spinning={loading}>
        <div style={{ width: "100%", maxWidth: 860, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", background: "#fff" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 24px 14px", borderBottom: "1px solid #f0f0f0" }}>
            <SwapOutlined style={{ fontSize: 17, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>Promoção Bumerangue</span>
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}
              initialValues={{ dataOperacao: dayjs(), bonusIda: 40, bonusVolta: 40, parcelas: 1 }}
            >

              {/* ── Origem → Destino ── */}
              <Row gutter={0} align="middle" style={{ marginBottom: 14 }}>
                <Col flex="1">
                  <label style={lbl}>Titular/Conta de Origem</label>
                  <Form.Item name="cartaoOrigemId" noStyle rules={[{ required: true }]}>
                    <Select size="middle" style={{ width: "100%" }}
                      placeholder="Apenas Livelo ou Esfera"
                      onChange={handleOrigemChange} loading={loading}
                    >
                      {cartoesOrigem.map((c) => (
                        <Option key={c.car_id} value={c.car_id}><CartaoOpt c={c} /></Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col style={{ padding: "18px 10px 0", color: "#aaa", fontSize: 18 }}>»</Col>
                <Col flex="1">
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
                </Col>
              </Row>

              {/* ── Saldo + Custo médio ── */}
              <Row gutter={16} style={{ marginBottom: 14 }}>
                <Col xs={12}>
                  <label style={lbl}>Saldo disponível</label>
                  <Input size="middle" readOnly style={dis}
                    value={cartaoOrig ? (cartaoOrig.car_saldo_milhas || 0).toLocaleString("pt-BR") : ""}
                    suffix={<span style={{ color: "#bbb" }}>#</span>}
                  />
                </Col>
                <Col xs={12}>
                  <label style={lbl}>Custo médio (R$/milheiro)</label>
                  <Input size="middle" readOnly style={dis}
                    value={custoOrig > 0 ? formatLocaleNumber(custoOrig) : ""}
                    placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>}
                  />
                </Col>
              </Row>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0 14px" }} />

              {/* ── Corpo (2 colunas) ── */}
              <Row gutter={0}>

                {/* ══ Coluna Esquerda ══ */}
                <Col xs={24} sm={13} style={{ paddingRight: 16 }}>

                  {/* Pontos Conta */}
                  <div style={fi}>
                    <label style={lbl}>Pontos Conta</label>
                    <InputNumber size="middle" style={inp} min={0} controls={false}
                      value={pontosConta || null}
                      max={cartaoOrig ? Number(cartaoOrig.car_saldo_milhas || 0) : undefined}
                      onChange={(v) => {
                        const saldo = cartaoOrig ? Number(cartaoOrig.car_saldo_milhas || 0) : Infinity;
                        const val   = Number(v) || 0;
                        setPontosConta(val > saldo ? saldo : val);
                      }}
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      parser={(v) => v ? v.replace(/\./g, "") : ""}
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                    {cartaoOrig && pontosConta > Number(cartaoOrig.car_saldo_milhas || 0) && (
                      <div style={{ fontSize: 11, color: "#ff4d4f", marginTop: 2 }}>
                        Máximo: {Number(cartaoOrig.car_saldo_milhas || 0).toLocaleString("pt-BR")}
                      </div>
                    )}
                  </div>

                  {/* Checkbox Carrinho */}
                  <div style={fi}>
                    <Checkbox checked={carrinho} onChange={(e) => {
                      setCarrinho(e.target.checked);
                      if (!e.target.checked) { setPontosCarrinho(0); setCustoCarrinho(0); }
                    }} style={{ fontSize: 12, color: "#555" }}>
                      Esta operação usou carrinho.
                    </Checkbox>
                  </div>

                  {/* Campos extras do carrinho */}
                  {carrinho && (
                    <>
                      <div style={fi}>
                        <Row gutter={8}>
                          <Col xs={12}>
                            <label style={lbl}>Pontos Carrinho</label>
                            <InputNumber size="middle" style={inp} min={0} controls={false}
                              value={pontosCarrinho || null}
                              onChange={(v) => setPontosCarrinho(Number(v) || 0)}
                              formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                              parser={(v) => v ? v.replace(/\./g, "") : ""}
                              suffix={<span style={{ color: "#bbb" }}>#</span>}
                            />
                          </Col>
                          <Col xs={12}>
                            <label style={lbl}>Custo Carrinho (R$)</label>
                            <InputNumber size="middle" style={inp} min={0} controls={false}
                              value={custoCarrinho || null}
                              onChange={(v) => setCustoCarrinho(Number(v) || 0)}
                              formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                              parser={(v) => v ? v.replace(/\./g, "") : ""}
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
                                  const label  = nome + (numero ? ` •••• ${numero}` : "");
                                  return <Option key={String(c.cre_id ?? "")} value={c.cre_id ?? c.CRE_ID}>{label}</Option>;
                                })}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col style={{ width: 80 }}>
                            <label style={lbl}>Parcelas</label>
                            <Form.Item name="parcelas" noStyle>
                              <Select size="middle" style={{ width: "100%" }}>
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                                  <Option key={n} value={n}>{n}x</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    </>
                  )}

                  {/* Total de Pontos */}
                  <div style={fi}>
                    <label style={lbl}>Total de Pontos do Bumerangue</label>
                    <InputNumber size="middle" style={dis} disabled value={Math.round(totalPontos) || null}
                      controls={false}
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>

                  {/* Bônus Ida */}
                  <div style={fi}>
                    <label style={lbl}>Bônus de Ida</label>
                    <Form.Item name="bonusIda" noStyle>
                      <InputNumber size="middle" style={inp} min={0} max={100} controls={false}
                        onChange={(v) => setBIda(Number(v) || 0)}
                        suffix={<span style={{ color: "#555" }}>%</span>}
                      />
                    </Form.Item>
                  </div>

                  {/* Bônus Volta */}
                  <div style={fi}>
                    <label style={lbl}>Bônus de Volta</label>
                    <Form.Item name="bonusVolta" noStyle>
                      <InputNumber size="middle" style={inp} min={0} max={100} controls={false}
                        onChange={(v) => setBVolta(Number(v) || 0)}
                        suffix={<span style={{ color: "#555" }}>%</span>}
                      />
                    </Form.Item>
                  </div>

                  {/* Taxas */}
                  <div style={fi}>
                    <label style={lbl}>Taxas (R$)</label>
                    <InputNumber size="middle" style={inp} min={0} controls={false}
                      value={taxas || null}
                      onChange={(v) => setTaxas(Number(v) || 0)}
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      parser={(v) => v ? v.replace(/\./g, "") : ""}
                      placeholder="0,00"
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>

                  {/* Preço Milheiro */}
                  <div style={fi}>
                    <label style={lbl}>Preço do Milheiro (R$/milheiro)</label>
                    <InputNumber size="middle" style={inp} min={0} controls={false}
                      value={precoMilheiro || null}
                      onChange={(v) => setPrecoMilheiro(Number(v) || 0)}
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      parser={(v) => v ? v.replace(/\./g, "") : ""}
                      placeholder="0,00"
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>

                  {/* Custo Total */}
                  <div style={fi}>
                    <label style={lbl}>Custo Total da Operação</label>
                    <Input size="middle" readOnly style={dis}
                      value={custoTotal > 0 ? formatLocaleNumber(custoTotal) : ""}
                      placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>

                  {/* Data da Operação */}
                  <div style={fi}>
                    <label style={lbl}>Data da Operação</label>
                    <Form.Item name="dataOperacao" noStyle>
                      <DatePicker style={inp} format="DD/MM/YYYY" size="middle"
                        disabledDate={(c) => c && c > dayjs().endOf("day")}
                      />
                    </Form.Item>
                  </div>

                  {/* Observações */}
                  <div style={fi}>
                    <label style={lbl}>Observações:</label>
                    <Form.Item name="observacoes" noStyle>
                      <Input.TextArea rows={4} style={{ fontSize: 13, resize: "vertical", width: "100%", borderRadius: 4, border: "1px solid #d9d9d9" }} />
                    </Form.Item>
                  </div>
                </Col>

                {/* Divisor vertical */}
                <Col xs={0} sm={1} style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ borderLeft: "1px solid #e8e8e8", height: "100%" }} />
                </Col>

                {/* ══ Coluna Direita ══ */}
                <Col xs={24} sm={10} style={{ paddingLeft: 12 }}>

                  {/* Custo Milheiro Origem */}
                  <div style={fi}>
                    <label style={lbl}>Custo Milheiro de Origem (R$/milheiro)</label>
                    <Input size="middle" readOnly style={dis}
                      value={custoOrig > 0 ? formatLocaleNumber(custoOrig) : ""}
                      placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>

                  {/* Custo Milheiro Destino (campo 1) */}
                  <div style={fi}>
                    <label style={lbl}>Custo Milheiro de Milhas (destino)</label>
                    <InputNumber size="middle" style={inp} min={0} controls={false}
                      value={custoDest || null}
                      onChange={(v) => setCustoDest(Number(v) || 0)}
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      parser={(v) => v ? v.replace(/\./g, "") : ""}
                      placeholder="0,00"
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>

                  {/* Custo Milheiro na Volta (campo 2) */}
                  <div style={fi}>
                    <label style={lbl}>Custo Milheiro de Pontos (na volta)</label>
                    <InputNumber size="middle" style={inp} min={0} controls={false}
                      value={custoVolta || null}
                      onChange={(v) => setCustoVolta(Number(v) || 0)}
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      parser={(v) => v ? v.replace(/\./g, "") : ""}
                      placeholder="0,00"
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>

                  {/* Milhas + Validade */}
                  <div style={fi}>
                    <Row gutter={8}>
                      <Col flex="1">
                        <label style={lbl}>Milhas</label>
                        <InputNumber size="middle" style={dis} disabled
                          value={totalMilhas || null} controls={false}
                          formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                          suffix={<span style={{ color: "#bbb" }}>#</span>}
                        />
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
                            onChange={(e) => setValidadeOutros(e.target.value.replace(/\D/g,""))}
                          />
                        )}
                      </Col>
                    </Row>
                  </div>

                  {/* Milhas Bônus (ida) + Validade */}
                  <div style={fi}>
                    <Row gutter={8}>
                      <Col flex="1">
                        <label style={lbl}>Milhas Bônus (ida)</label>
                        <InputNumber size="middle" style={dis} disabled value={mbi || null}
                          controls={false}
                          formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                          suffix={<span style={{ color: "#bbb" }}>#</span>}
                        />
                      </Col>
                      <Col>
                        <label style={lbl}>Validade</label>
                        <Form.Item name="validadeBonusIda" noStyle>
                          <Select size="middle" style={{ width: 110 }}>
                            {[6,12,24,36].map((n) => <Option key={n} value={n}>{n} meses</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  {/* Pontos Bônus (volta) + Validade */}
                  <div style={fi}>
                    <Row gutter={8}>
                      <Col flex="1">
                        <label style={lbl}>Pontos Bônus (volta)</label>
                        <InputNumber size="middle" style={dis} disabled value={pbv || null}
                          controls={false}
                          formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                          suffix={<span style={{ color: "#bbb" }}>#</span>}
                        />
                      </Col>
                      <Col>
                        <label style={lbl}>Validade</label>
                        <Form.Item name="validadeBonusVolta" noStyle>
                          <Select size="middle" style={{ width: 110 }}>
                            {[6,12,24,36].map((n) => <Option key={n} value={n}>{n} meses</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  {/* Percentual Final */}
                  <div style={fi}>
                    <label style={lbl}>Percentual Final da Operação</label>
                    <Input size="middle" readOnly style={dis}
                      value={percentFinal > 0 ? formatLocaleNumber(percentFinal) : "0,00"}
                      suffix={<span style={{ color: "#bbb" }}>%</span>}
                    />
                  </div>

                  {/* Data do Bônus */}
                  <div style={fi}>
                    <label style={lbl}>Data do Bônus</label>
                    <Form.Item name="dataBonus" noStyle>
                      <DatePicker style={inp} format="DD/MM/YYYY" size="middle" />
                    </Form.Item>
                  </div>

                </Col>
              </Row>

              {/* Submit */}
              <Form.Item style={{ marginBottom: 0 }}>
                <button type="submit" disabled={loading || !isFormValid}
                  style={{
                    width: "100%", height: 40,
                    background: isFormValid ? "#1677ff" : "#bfbfbf",
                    border: "none", borderRadius: 6, color: "#fff",
                    fontSize: 14, fontWeight: 600, letterSpacing: "0.05em",
                    cursor: isFormValid ? "pointer" : "not-allowed", marginTop: 8,
                  }}
                >
                  {loading ? "PROCESSANDO..." : isFormValid ? "CONFIRMAR BUMERANGUE" : "PREENCHA OS DADOS!"}
                </button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Spin>
    </div>
  );
}