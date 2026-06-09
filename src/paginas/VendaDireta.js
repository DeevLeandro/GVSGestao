import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, InputNumber, DatePicker,
  Row, Col, Spin, message, Upload, Button,
} from "antd";
import { PaperClipOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";

const { Option } = Select;

// ── Helper FireDAC robusto ───────────────────────────────────────────────
const extractRows = (data) => {
  if (!data) return [];
  if (data.FDBS) {
    try {
      const mgr    = data.FDBS.Manager ?? data.FDBS.manager;
      const tables = mgr?.TableList ?? mgr?.tablelist ?? [];
      if (tables.length > 0) {
        const rowList = tables[0].RowList ?? tables[0].rowlist ?? [];
        if (rowList.length > 0)
          return rowList.map((r) => r.Original ?? r.Current ?? r);
      }
    } catch (e) {}
  }
  if (data.Table && Array.isArray(data.Table)) return data.Table;
  if (Array.isArray(data)) return data;
  return [];
};

const normalize = (row) => {
  if (!row || typeof row !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(row)) out[k.toLowerCase()] = v;
  return out;
};

// ── Serialização para o Delphi ───────────────────────────────────────────
// StrToCurr no Delphi (locale pt-BR) exige vírgula decimal: "1234,56"
const toDelphiCurr = (v) => {
  const n = Number(v) || 0;
  return n.toFixed(2).replace(".", ",");
};

// StrToInt no Delphi não aceita pontos de milhar ("9.813.000" EXPLODE)
const toDelphiInt = (v) => String(Math.round(Number(v) || 0));

// ── InputNumber: formatter/parser padrão brasileiro ──────────────────────
//
// Regra de ouro do Ant Design InputNumber:
//   • formatter: recebe o valor INTERNO (sempre com ponto decimal, ex: "341.84")
//                e devolve a string de exibição ("341,84")
//   • parser:    recebe qualquer string que o usuário digitou
//                e devolve o número JS (341.84)
//
// Problema clássico: o usuário digita "341,84" mas o Ant também chama
// o formatter com a string interna "341.84". O formatter precisa tratar
// os dois formatos sem entrar em loop.
//
const fmtBRL = (v) => {
  if (v === "" || v === undefined || v === null) return "";
  const str = String(v);

  // Se o usuário está digitando e já tem vírgula no campo (ex: "341,8" em progresso)
  if (str.includes(",")) {
    const [intPart, decPart] = str.split(",");
    const intClean = intPart.replace(/\./g, "");
    const intFmt   = intClean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return decPart !== undefined ? `${intFmt},${decPart}` : intFmt;
  }

  // Valor interno do Ant: sempre usa ponto como decimal (ex: "78428" ou "341.84")
  if (str.includes(".")) {
    const partes      = str.split(".");
    const ultimaParte = partes[partes.length - 1];

    if (ultimaParte.length === 3) {
      // Ant passou "78.428" onde ponto é decimal de 3 casas — não é o nosso caso
      // mas pode acontecer: trata como inteiro + formata milhar
      const inteiro = str.replace(/\./g, "");
      return inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Caso normal: "341.84" → "341,84" | "78428.00" → "78.428,00"
    const [intPart, decPart] = str.split(".");
    const intFmt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${intFmt},${decPart}`;
  }

  // Número inteiro puro: "78428" → "78.428"
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseBRL = (v) => {
  if (!v && v !== 0) return "";
  const str = String(v).trim();
  if (!str) return "";

  const hasComa = str.includes(",");
  const hasDot  = str.includes(".");

  let normalized;

  if (hasComa && hasDot) {
    // "1.500,84" → ponto é milhar, vírgula é decimal
    normalized = str.replace(/\./g, "").replace(",", ".");
  } else if (hasComa) {
    // "341,84" → vírgula é decimal
    normalized = str.replace(",", ".");
  } else if (hasDot) {
    // Ponto sozinho: decide pelo número de dígitos após o ponto
    // Se tem exatamente 3 dígitos após o ponto → é separador de milhar: "78.428" = 78428
    // Se tem 1 ou 2 dígitos após o ponto → é decimal: "78.4" = 78.4 ou "78.42" = 78.42
    const partes = str.split(".");
    const ultimaParte = partes[partes.length - 1];
    if (ultimaParte.length === 3) {
      // Trata todos os pontos como separador de milhar
      normalized = str.replace(/\./g, "");
    } else {
      // Trata o último ponto como decimal
      normalized = str.replace(/\.(?=.*\.)/g, ""); // remove pontos extras exceto o último
    }
  } else {
    // "78428" → número puro
    normalized = str;
  }

  const n = parseFloat(normalized);
  return isNaN(n) ? "" : n;
};

// Versão para campos de quantidade inteira (milhas) — sem decimais
const fmtMilhas = (v) => {
  if (v === "" || v === undefined || v === null) return "";
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
const parseMilhas = (v) => {
  if (!v) return 0;
  const n = parseInt(String(v).replace(/\./g, ""), 10);
  return isNaN(n) ? 0 : n;
};

// ── Logos ────────────────────────────────────────────────────────────────
const LOGOS_MAP = [
  { keys: ["livelo"],              bg: "#e8003d", letra: "LV"  },
  { keys: ["itaú","itau"],        bg: "#003087", letra: "IT"  },
  { keys: ["smiles"],              bg: "#ff6600", letra: "S"   },
  { keys: ["azul"],                bg: "#003087", letra: "A"   },
  { keys: ["coopera pj"],          bg: "#007b5e", letra: "CPJ" },
  { keys: ["coopera"],             bg: "#007b5e", letra: "COO" },
  { keys: ["latam"],               bg: "#e31837", letra: "L"   },
  { keys: ["tap"],                 bg: "#009900", letra: "TAP" },
  { keys: ["max milhas"],          bg: "#1e3a6e", letra: "MM"  },
  { keys: ["hotmilhas"],           bg: "#cc3300", letra: "HM"  },
  { keys: ["esfera empresas"],     bg: "#8b0000", letra: "EE"  },
  { keys: ["esfera"],              bg: "#8b0000", letra: "E_"  },
  { keys: ["nubank"],              bg: "#820ad1", letra: "NU"  },
  { keys: ["membership","amex"],   bg: "#006fcf", letra: "MR"  },
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
    }}>{letra}</span>
  );
};

export default function EmissaoUsoProprioVenda({ clienteId: clienteIdProp }) {
  const [form] = Form.useForm();
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [cartoes, setCartoes]         = useState([]);
  const [passageiros, setPassageiros] = useState([]);
  const [titulares, setTitulares]     = useState([]);
  const [clienteId, setClienteId]     = useState(null);

  const [origemMilhas, setOrigemMilhas]               = useState("proprias");
  const [nomeFornecedor, setNomeFornecedor]           = useState("");
  const [contatoFornecedor, setContatoFornecedor]     = useState("");
  const [custoMilheiroBalcao, setCustoMilheiroBalcao] = useState(0);
  const [nomeConsolidadora, setNomeConsolidadora]     = useState("");
  const [precoConsolidadora, setPrecoConsolidadora]   = useState(0);

  const [cartaoSel, setCartaoSel]       = useState(null);
  const [precoPagante, setPrecoPagante] = useState(0);
  const [milhasUtil, setMilhasUtil]     = useState(0);
  const [taxas, setTaxas]               = useState(0);
  const [bagagem, setBagagem]           = useState(0);
  const [fileList, setFileList]         = useState([]);
  const [passagSel, setPassagSel]       = useState([]);
  const [buscaPassag, setBuscaPassag]   = useState("");

  // custoMedio = R$ por MILHEIRO (ex: 18,00 = R$18 por 1.000 milhas)
  const custoMedio = cartaoSel ? Number(cartaoSel.car_vunitario ?? 0) : 0;
  const saldoDisp  = cartaoSel ? Number(cartaoSel.car_saldo_milhas ?? 0) : 0;
  const cpfsLivres = cartaoSel ? Number(cartaoSel.car_qtde_cpf ?? 1) : 0;

  // custoCalc = custo do MILHEIRO para a operação atual
  const custoCalc = origemMilhas === "balcao" ? custoMilheiroBalcao : custoMedio;

  // precoEmMilhas = R$ real gasto nas milhas
  const precoEmMilhas = custoCalc > 0 && milhasUtil > 0
    ? parseFloat(((custoCalc / 1000) * milhasUtil).toFixed(2))
    : 0;

  const baseDesconto = origemMilhas === "consolidadora" ? precoConsolidadora : precoEmMilhas;

  // Economia = (preço pagante + taxas + bagagem) - custo real em milhas
  // Taxas e bagagem SÃO parte do custo total da viagem pagante,
  // portanto somam ao pagante e NÃO reduzem a economia.
  const economiaGerada = precoPagante > 0 && baseDesconto > 0
    ? parseFloat(((precoPagante + taxas + bagagem) - baseDesconto).toFixed(2))
    : 0;
  // % de economia = economia / total pagante (com taxas e bagagem) * 100
  const totalPagante = precoPagante + taxas + bagagem;
  const economiaPct = totalPagante > 0 && economiaGerada > 0
    ? parseFloat(((economiaGerada / totalPagante) * 100).toFixed(2))
    : 0;

  useEffect(() => {
    let id = clienteIdProp;
    if (!id) {
      try { const u = JSON.parse(localStorage.getItem("user") || "{}"); id = u.cli_id || u.id; } catch (e) {}
    }
    if (!id) id = parseInt(localStorage.getItem("userID") || "0") || null;
    if (id) { setClienteId(id); carregarDados(id); }
    else message.error("Usuário não autenticado.");
  }, [clienteIdProp]);

  const carregarDados = async (id) => {
    setLoading(true);
    try {
      const titRes  = await api.get("/ServerPrincipal/PesquisaTitular", { params: { Cliente: id } });
      const titRows = extractRows(titRes.data).map(normalize);

      const seen = new Set();
      const titDeduplic = titRows.filter((t) => {
        const k = String(t.cli_id ?? "");
        if (!k || k === "0" || seen.has(k)) return false;
        seen.add(k); return true;
      });

      const titFinais = titDeduplic.length > 0
        ? titDeduplic
        : [{ cli_id: id, cli_nome: "Titular Principal" }];

      const carResArr = await Promise.all(
        titFinais.map((t) =>
          api.get("/ServerPrincipal/PesquisaCartoes", { params: { Cliente: t.cli_id } })
            .then((res) => ({ rows: extractRows(res.data).map(normalize), tit: t }))
            .catch(() => ({ rows: [], tit: t }))
        )
      );

      const cartoesFlat = [];
      const seenCar = new Set();
      carResArr.forEach(({ rows, tit }) => {
        rows.forEach((c) => {
          const carKey = String(c.car_id ?? "");
          if (!carKey || carKey === "0" || seenCar.has(carKey)) return;
          seenCar.add(carKey);
          cartoesFlat.push({
            car_id:            c.car_id ?? 0,
            car_nome_programa: c.car_nome_programa ?? "",
            car_saldo_milhas:  Number(c.car_saldo_milhas ?? 0),
            car_vunitario:     Number(c.car_vunitario    ?? 0),
            car_qtde_cpf:      Number(c.car_qtde_cpf     ?? 0),
            cli_id:            tit.cli_id,
            cli_nome:          tit.cli_nome ?? "",
          });
        });
      });

      const passRes  = await api.get("/ServerPrincipal/PesquisaPassageiros", { params: { Cliente: id } }).catch(() => ({ data: [] }));
      const passRows = extractRows(passRes.data).map(normalize);

      setTitulares(titFinais);
      setCartoes(cartoesFlat);
      setPassageiros(passRows);
    } catch (e) {
      message.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleCartaoChange = (id) => {
    const c = cartoes.find((x) => x.car_id === id);
    setCartaoSel(c || null);
  };

  const handleOrigemChange = (v) => {
    setOrigemMilhas(v);
    setCartaoSel(null);
    setNomeFornecedor(""); setContatoFornecedor(""); setCustoMilheiroBalcao(0);
    setNomeConsolidadora(""); setPrecoConsolidadora(0);
    form.setFieldValue("cartaoId", undefined);
  };

  const passageirosFiltrados = passageiros.filter((p) =>
    !buscaPassag || (p.pag_nome || "").toLowerCase().includes(buscaPassag.toLowerCase())
  );

  const adicionarPassageiro = (p) => {
    if (passagSel.find((x) => x.pag_id === p.pag_id)) return;
    const primeiroNomeTit = (titulares[0]?.cli_nome || "").toLowerCase().split(" ")[0];
    const isTitular = !!primeiroNomeTit && (p.pag_nome || "").toLowerCase().startsWith(primeiroNomeTit);
    setPassagSel([...passagSel, { ...p, _isTitular: isTitular }]);
    setBuscaPassag("");
  };

  const removerPassageiro = (id) => setPassagSel(passagSel.filter((p) => p.pag_id !== id));

  // ── SUBMIT ────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    if (!clienteId)                    { message.error("Cliente não identificado."); return; }
    if (!values.localizador)           { message.error("Localizador é obrigatório."); return; }
    if (!milhasUtil || milhasUtil <= 0) { message.error("Informe as milhas utilizadas."); return; }
    if (!cartaoSel)                    { message.error("Selecione a conta/programa."); return; }

    setSaving(true);
    try {
      /*
       * CONTRATO COM O BACKEND DELPHI (PostInserirVendas):
       *
       * QtdeMilhas → StrToInt()  → NUNCA enviar "9.813.000" (explode)
       *                         → enviar "9813000"
       *
       * ValorUnitario → ConverterParaFloat() → backend faz: vPrecoMilheiro = vValorUnitario * 1000
       *                         → enviamos o valor POR MILHA (não por milheiro)
       *                         → ex: R$18/milheiro → enviar "0,018"
       *
       * Economia / Taxas / Bagagem → StrToCurr()
       *                         → Delphi locale pt-BR: decimal = VÍRGULA
       *                         → enviar "1234,56" (não "1234.56")
       */
      const valorPorMilha = custoCalc > 0 ? custoCalc / 1000 : 0;

      const payload = {
        IDCliente:       clienteId,
        IDCartao:        cartaoSel.car_id,

        // ← CRÍTICO: StrToInt não aceita pontos de milhar
        QtdeMilhas:      toDelphiInt(milhasUtil),

        // ← backend faz *1000 → enviamos por milha
        ValorUnitario:   toDelphiCurr(valorPorMilha),

        // ← preço da passagem pagante (referência de economia)
        ValorTotal:      toDelphiCurr(precoPagante),

        FormaPagamento:  origemMilhas,
        Observacoes:     values.observacoes || "",
        Status:          1,
        QtdePassageiros: String(passagSel.length || 0),

        // ← todos com vírgula decimal para StrToCurr
        Economia:        toDelphiCurr(economiaGerada),
        PEconomia:       toDelphiCurr(economiaPct),
        Taxas:           toDelphiCurr(taxas),
        Bagagem:         toDelphiCurr(bagagem),

        Localizador:     values.localizador || "",
        Origem:          values.origem      || "",
        Destino:         values.destino     || "",
        OrigemMilhas:    origemMilhas,
        DataVoo:         values.dataVoo
          ? values.dataVoo.format("DD/MM/YYYY HH:mm:ss")
          : dayjs().add(1, "day").format("DD/MM/YYYY HH:mm:ss"),
      };

      console.log("[InserirVendas] payload →", payload);

      await api.post("/ServerPrincipal/InserirVendas", payload);

      message.success("Emissão registrada com sucesso!");
      form.resetFields();
      setPrecoPagante(0); setMilhasUtil(0); setTaxas(0); setBagagem(0);
      setCartaoSel(null); setPassagSel([]); setFileList([]);
      setOrigemMilhas("proprias");
      setNomeFornecedor(""); setContatoFornecedor(""); setCustoMilheiroBalcao(0);
      setNomeConsolidadora(""); setPrecoConsolidadora(0);
    } catch (e) {
      const errMsg = e?.response?.data || e?.message || "Erro ao registrar emissão";
      message.error(String(errMsg));
      console.error("[InserirVendas] ERRO →", e?.response?.status, e?.response?.data);
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = milhasUtil > 0 && !!cartaoSel;
  const fmt = (v) => v > 0 ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

  const s = {
    card:    { background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
    header:  { display: "flex", alignItems: "center", gap: 8, padding: "16px 20px 14px", borderBottom: "1px solid #f0f0f0" },
    body:    { padding: "20px 24px 24px" },
    lbl:     { fontSize: 12, color: "#555", fontWeight: 500, marginBottom: 4, display: "block" },
    inp:     { width: "100%", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fafafa", height: 36, fontSize: 14 },
    dis:     { width: "100%", borderRadius: 4, border: "1px solid #e8e8e8", background: "#f5f5f5", height: 36, fontSize: 14, color: "#888" },
    fi:      { marginBottom: 14 },
    divider: { borderTop: "1px dashed #e0e0e0", margin: "16px 0" },
    submitBtn: {
      width: "100%", height: 36,
      background: isFormValid ? "#1677ff" : "#bfbfbf",
      border: "none", borderRadius: 4, color: "#fff",
      fontSize: 13, fontWeight: 600, letterSpacing: "0.05em",
      cursor: isFormValid ? "pointer" : "not-allowed",
    },
  };

  const renderCamposOrigem = () => {
    if (origemMilhas === "balcao") return (
      <>
        <div style={s.fi}>
          <label style={s.lbl}>Nome do Fornecedor:</label>
          <Input size="middle" style={s.inp} placeholder="Nome do fornecedor"
            value={nomeFornecedor} onChange={(e) => setNomeFornecedor(e.target.value)} />
        </div>
        <Row gutter={10} style={{ marginBottom: 14 }}>
          <Col xs={14}>
            <label style={s.lbl}>Contato do Fornecedor:</label>
            <Input size="middle" style={s.inp} placeholder="(XX) XXXXX-XXXXX"
              value={contatoFornecedor} onChange={(e) => setContatoFornecedor(e.target.value)}
              suffix={<span style={{ color: "#bbb", fontSize: 13 }}>📞</span>} />
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>Campo opcional.</div>
          </Col>
          <Col xs={10}>
            <label style={s.lbl}>Custo do Milheiro</label>
            <InputNumber size="middle" style={s.inp} min={0} controls={false} placeholder="0,00"
              precision={2}
              value={custoMilheiroBalcao || undefined}
              onChange={(v) => setCustoMilheiroBalcao(Number(v) || 0)}
              formatter={fmtBRL}
              parser={parseBRL}
              suffix={<span style={{ color: "#bbb" }}>$</span>} />
          </Col>
        </Row>
        <div style={s.divider} />
      </>
    );

    if (origemMilhas === "consolidadora") return (
      <>
        <Row gutter={10} style={{ marginBottom: 14 }}>
          <Col xs={16}>
            <label style={s.lbl}>Nome da Consolidadora:</label>
            <Input size="middle" style={s.inp} placeholder="Nome da consolidadora"
              value={nomeConsolidadora} onChange={(e) => setNomeConsolidadora(e.target.value)} />
          </Col>
          <Col xs={8}>
            <label style={s.lbl}>Preço da Consolidadora</label>
            <InputNumber size="middle" style={s.inp} min={0} controls={false} placeholder="0,00"
              precision={2}
              value={precoConsolidadora || undefined}
              onChange={(v) => setPrecoConsolidadora(Number(v) || 0)}
              formatter={fmtBRL}
              parser={parseBRL}
              suffix={<span style={{ color: "#bbb" }}>$</span>} />
          </Col>
        </Row>
        <div style={s.divider} />
      </>
    );

    return null;
  };

  return (
    <Spin spinning={loading}>
      <div style={s.card}>
        <div style={s.header}>
          <span style={{ fontSize: 16 }}>✈</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Emissões para Uso Próprio</span>
        </div>

        <div style={s.body}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}
            initialValues={{ dataEmissao: dayjs(), objetivoEmissao: "uso_proprio" }}>
            <Row gutter={24}>

              {/* ══ COLUNA ESQUERDA ══ */}
              <Col xs={24} md={13} style={{ borderRight: "1px dashed #e0e0e0", paddingRight: 24 }}>

                <div style={s.fi}>
                  <label style={s.lbl}>Origem das Milhas:</label>
                  <Form.Item name="origemMilhas" noStyle initialValue="proprias">
                    <Select size="middle" style={{ width: 220 }} onChange={handleOrigemChange}>
                      <Option value="proprias">Milhas Próprias</Option>
                      <Option value="balcao">Balcão de Milhas</Option>
                      <Option value="consolidadora">Consolidadora</Option>
                    </Select>
                  </Form.Item>
                </div>

                {renderCamposOrigem()}

                {origemMilhas !== "consolidadora" && (
                  <Row gutter={10} style={{ marginBottom: 14 }}>
                    <Col xs={24} sm={10}>
                      <label style={s.lbl}>Titular/Conta da Operação</label>
                      <Form.Item name="cartaoId" noStyle rules={[{ required: true, message: "Selecione" }]}>
                        <Select size="middle" style={{ width: "100%" }} placeholder="Selecione o programa"
                          loading={loading} onChange={handleCartaoChange}>
                          {cartoes.map((c) => (
                            <Option key={c.car_id} value={c.car_id}>
                              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <LogoCircle nome={c.car_nome_programa} size={20} />
                                {(c.cli_nome || "").split(" ")[0]} - {c.car_nome_programa}
                              </span>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={8} sm={5}>
                      <label style={s.lbl}>Saldo disponível</label>
                      <Input size="middle" style={s.dis} readOnly
                        value={saldoDisp > 0 ? saldoDisp.toLocaleString("pt-BR") : ""}
                        placeholder="0" suffix={<span style={{ color: "#bbb" }}>#</span>} />
                    </Col>
                    <Col xs={8} sm={5}>
                      <label style={s.lbl}>Custo Médio</label>
                      <Input size="middle" style={s.dis} readOnly
                        value={custoMedio > 0 ? fmt(custoMedio) : ""}
                        placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>} />
                    </Col>
                    <Col xs={8} sm={4}>
                      <label style={s.lbl}>CPFs Livres</label>
                      <Input size="middle" style={s.dis} readOnly
                        value={cartaoSel ? cpfsLivres : ""} placeholder="0"
                        suffix={<span style={{ color: "#bbb" }}>#</span>} />
                    </Col>
                  </Row>
                )}

                {origemMilhas === "consolidadora" && (
                  <div style={s.fi}>
                    <label style={s.lbl}>Titular/Conta da Operação</label>
                    <Form.Item name="cartaoId" noStyle rules={[{ required: true, message: "Selecione" }]}>
                      <Select size="middle" style={{ width: "100%" }} placeholder="Selecione o programa"
                        loading={loading} onChange={handleCartaoChange}>
                        {cartoes.map((c) => (
                          <Option key={c.car_id} value={c.car_id}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <LogoCircle nome={c.car_nome_programa} size={20} />
                              {(c.cli_nome || "").split(" ")[0]} - {c.car_nome_programa}
                            </span>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                )}

                <div style={s.divider} />

                <Row gutter={10} style={{ marginBottom: 4 }}>
                  <Col xs={14}>
                    <label style={s.lbl}>Preço da Passagem Pagante</label>
                    <InputNumber size="middle" style={s.inp} min={0} controls={false}
                      precision={2}
                      onChange={(v) => setPrecoPagante(Number(v) || 0)}
                      formatter={fmtBRL}
                      parser={parseBRL}
                      suffix={<span style={{ color: "#bbb" }}>$</span>} />
                  </Col>
                  <Col xs={10}>
                    <label style={s.lbl}>&nbsp;</label>
                    <Upload fileList={fileList}
                      beforeUpload={(file) => {
                        const fd = new FormData();
                        fd.append("file", file);
                        api.post("/upload/images", fd, { headers: { "Content-Type": "multipart/form-data" } }).catch(() => {});
                        setFileList([file]);
                        return false;
                      }}
                      maxCount={1} showUploadList={false} accept="image/*,.pdf">
                      <Button icon={<PaperClipOutlined />}
                        style={{ width: "100%", height: 36, border: "1px solid #d9d9d9", borderRadius: 4, background: "#fafafa", fontSize: 13 }}>
                        PRINT VÔO
                      </Button>
                    </Upload>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                      {fileList.length > 0 ? fileList[0].name : "Nenhum arquivo selecionado."}
                    </div>
                  </Col>
                </Row>

                {origemMilhas !== "consolidadora" && (
                  <div style={s.fi}>
                    <label style={s.lbl}>Milhas Utilizadas</label>
                    <InputNumber size="middle" style={s.inp} min={0} controls={false}
                      onChange={(v) => setMilhasUtil(Number(v) || 0)}
                      formatter={fmtMilhas}
                      parser={parseMilhas}
                      suffix={<span style={{ color: "#bbb" }}>#</span>} />
                  </div>
                )}

                {origemMilhas !== "consolidadora" && (
                  <div style={s.fi}>
                    <label style={s.lbl}>Preço em Milhas</label>
                    <Input size="middle" style={s.dis} readOnly value={fmt(precoEmMilhas)}
                      placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>} />
                  </div>
                )}

                <Row gutter={10} style={{ marginBottom: 14 }}>
                  <Col xs={12}>
                    <label style={s.lbl}>Taxas</label>
                    <InputNumber size="middle" style={s.inp} min={0} controls={false}
                      precision={2}
                      onChange={(v) => setTaxas(Number(v) || 0)}
                      formatter={fmtBRL}
                      parser={parseBRL}
                      placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>} />
                  </Col>
                  <Col xs={12}>
                    <label style={s.lbl}>Bagagem/Extras</label>
                    <InputNumber size="middle" style={s.inp} min={0} controls={false}
                      precision={2}
                      onChange={(v) => setBagagem(Number(v) || 0)}
                      formatter={fmtBRL}
                      parser={parseBRL}
                      placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>} />
                  </Col>
                </Row>

                <Row gutter={10} style={{ marginBottom: 14 }}>
                  <Col xs={12}>
                    <label style={s.lbl}>Economia Gerada</label>
                    <Input size="middle" style={s.dis} readOnly value={fmt(economiaGerada)}
                      placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>} />
                  </Col>
                  <Col xs={12}>
                    <label style={s.lbl}>Economia em %</label>
                    <Input size="middle" style={s.dis} readOnly
                      value={economiaPct > 0 ? fmt(economiaPct) : ""}
                      placeholder="0" suffix={<span style={{ color: "#bbb" }}>%</span>} />
                  </Col>
                </Row>

                <Row gutter={10} style={{ marginBottom: 14 }}>
                  <Col xs={12}>
                    <label style={s.lbl}>Localizador do Vôo</label>
                    <Form.Item name="localizador" noStyle rules={[{ required: true, message: "Campo obrigatório." }]}>
                      <Input size="middle" style={s.inp} />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <label style={s.lbl}>Data do Vôo</label>
                    <Form.Item name="dataVoo" noStyle>
                      <DatePicker style={s.inp} format="DD/MM/YYYY" size="middle" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={10} style={{ marginBottom: 14 }}>
                  <Col xs={12}>
                    <label style={s.lbl}>Origem do Vôo</label>
                    <Form.Item name="origem" noStyle>
                      <Input size="middle" style={s.inp} />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <label style={s.lbl}>Destino do Vôo</label>
                    <Form.Item name="destino" noStyle>
                      <Input size="middle" style={s.inp} />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={s.fi}>
                  <label style={s.lbl}>Data da Emissão</label>
                  <Form.Item name="dataEmissao" noStyle>
                    <DatePicker style={s.inp} format="DD/MM/YYYY" size="middle"
                      disabledDate={(c) => c && c > dayjs().endOf("day")} />
                  </Form.Item>
                </div>

                <div style={s.fi}>
                  <label style={s.lbl}>Objetivo da Emissão</label>
                  <Form.Item name="objetivoEmissao" noStyle>
                    <Select size="middle" style={{ width: "100%" }}>
                      <Option value="uso_proprio">Uso Próprio</Option>
                      <Option value="presente">Presente</Option>
                      <Option value="venda">Venda</Option>
                      <Option value="outro">Outro</Option>
                    </Select>
                  </Form.Item>
                </div>

                <div style={s.fi}>
                  <label style={s.lbl}>Observações:</label>
                  <Form.Item name="observacoes" noStyle>
                    <Input.TextArea rows={4}
                      style={{ width: "100%", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, resize: "vertical" }} />
                  </Form.Item>
                </div>
              </Col>

              {/* ══ COLUNA DIREITA: Passageiros ══ */}
              <Col xs={24} md={11} style={{ paddingLeft: 24 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>Registro de Passageiros</span>
                <p style={{ fontSize: 12, color: "#888", marginTop: 4, marginBottom: 12 }}>
                  Você pode registrar até {cpfsLivres} passageiros nesta operação.
                </p>

                <div style={{ position: "relative", marginBottom: 12 }}>
                  <Input size="middle" placeholder="Digite algum dado do passageiro"
                    value={buscaPassag} onChange={(e) => setBuscaPassag(e.target.value)}
                    suffix={<SearchOutlined style={{ color: "#bbb" }} />} style={{ borderRadius: 4 }} />
                  {buscaPassag.length > 0 && (
                    <div style={{ position: "absolute", top: 38, left: 0, right: 0, zIndex: 100, background: "#fff", borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.14)", maxHeight: 200, overflowY: "auto" }}>
                      {passageirosFiltrados.length === 0
                        ? <div style={{ padding: "10px 14px", fontSize: 13, color: "#999" }}>Nenhum passageiro encontrado</div>
                        : passageirosFiltrados.map((p) => (
                          <div key={p.pag_id}
                            style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                            onClick={() => adicionarPassageiro(p)}
                          >{p.pag_nome}</div>
                        ))
                      }
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, color: "#888", padding: "4px 0 8px", borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>Nome</div>

                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {passagSel.length === 0
                    ? <div style={{ padding: "16px 12px", background: "#fafafa", borderRadius: 4, border: "1px solid #f0f0f0", color: "#aaa", fontSize: 13, textAlign: "center" }}>
                        Utilize o campo acima para adicionar passageiros ao vôo.
                      </div>
                    : passagSel.map((p) => (
                      <div key={p.pag_id}
                        style={{ padding: "8px 10px", marginBottom: 6, borderRadius: 4, background: "#f9f9f9", border: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{p.pag_nome}</div>
                          {p._isTitular
                            ? <div style={{ fontSize: 11, color: "#1677ff", marginTop: 2 }}>Este passageiro é o titular da conta.</div>
                            : <div style={{ fontSize: 11, color: "#52c41a", marginTop: 2 }}>CPF contabilizado nesta emissão.</div>
                          }
                        </div>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: "0 4px", fontSize: 14 }}
                          onClick={() => removerPassageiro(p.pag_id)}>×</button>
                      </div>
                    ))
                  }
                </div>

                {passagSel.length === 0 && (
                  <div style={{ marginTop: 8, color: "#ff4d4f", fontSize: 12 }}>Inclua pelo menos um passageiro.</div>
                )}

                <div style={{ marginTop: 16, padding: "10px 12px", background: "#f9f9f9", borderRadius: 4, border: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 12, color: "#555" }}>CPFs limitados pelo programa: <strong>{cpfsLivres}</strong></div>
                  <div style={{ fontSize: 12, color: "#555" }}>CPFs desta emissão: <strong>{passagSel.length}</strong></div>
                </div>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
              <button type="submit" style={s.submitBtn} disabled={saving || !isFormValid}>
                {saving ? "PROCESSANDO..." : isFormValid ? "CONFIRMAR EMISSÃO" : "PREENCHA OS DADOS!"}
              </button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Spin>
  );
}