import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, InputNumber, DatePicker,
  Row, Col, Spin, message,
} from "antd";
import { RocketOutlined } from "@ant-design/icons";
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

export default function CompraTurbinada({ clienteId: clienteIdProp }) {
  const [form] = Form.useForm();
  const [loading, setLoading]               = useState(false);
  const [cartoesMilhas, setCartoesMilhas]   = useState([]);
  const [cartoesCredito, setCartoesCredito] = useState([]);
  const [titulares, setTitulares]           = useState([]);  // ← array com todos titulares
  const [precoProduto, setPrecoProduto]     = useState(0);
  const [custoMilheiro, setCustoMilheiro]   = useState(0);
  const [clienteId, setClienteId]           = useState(null);
  const [bonusPercentual, setBonusPercentual] = useState(0);
  const [pontosBonus, setPontosBonus]       = useState(0);
  const [validadeSel, setValidadeSel]       = useState(24);
  const [validadeOutros, setValidadeOutros] = useState("");
  const [codigoPagamento, setCodigoPagamento] = useState("");
  const [milhasOfertadas, setMilhasOfertadas] = useState(0);

  const formatLocaleNumber = (value) => {
    if (!value && value !== 0) return "";
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const custoTotal  = (precoProduto / 1000) * custoMilheiro || 0;
  const milhasBonus = (precoProduto * bonusPercentual) / 100 || 0;
  const milhasTotal = precoProduto + milhasBonus;

  // ── Resolve clienteId ─────────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    if (!id) {
      try { const u = JSON.parse(localStorage.getItem("user") || "{}"); id = u.cli_id || u.id; } catch (e) {}
      if (!id) id = parseInt(localStorage.getItem("userID") || "0") || null;
    }
    if (id) setClienteId(id);
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
      setCartoesMilhas(cartoesFlat);
      setCartoesCredito(creRows);
    } catch (e) {
      message.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bonus = (precoProduto * bonusPercentual) / 100;
    setPontosBonus(isNaN(bonus) ? 0 : bonus);
  }, [precoProduto, bonusPercentual]);

  const handlePrecoProdutoChange = (value) => {
    const v = Number(value) || 0;
    setPrecoProduto(v);
    if (custoMilheiro > 0)
      form.setFieldValue("custoTotal", formatLocaleNumber((v / 1000) * custoMilheiro));
  };

  const handleCustoMilheiroChange = (value) => {
    const v = Number(value) || 0;
    setCustoMilheiro(v);
    if (precoProduto > 0)
      form.setFieldValue("custoTotal", formatLocaleNumber((precoProduto / 1000) * v));
  };

  const handleBonusChange = (value) => {
    const v = Number(value) || 0;
    setBonusPercentual(v);
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    if (!clienteId)                 { message.error("Cliente não identificado."); return; }
    if (!precoProduto || precoProduto <= 0) { message.error("Informe o preço do produto."); return; }
    if (!custoMilheiro || custoMilheiro <= 0) { message.error("Informe o custo do milheiro."); return; }
    setLoading(true);
    try {
      const bonusVal       = Number(values.bonus) || 0;
      const milhasBonusCalc = (precoProduto * bonusVal) / 100;
      const milhasTotalCalc = precoProduto + milhasBonusCalc;
      const valorTotal      = (precoProduto / 1000) * custoMilheiro;
      
      const validMeses = validadeSel === "outros" ? Number(validadeOutros) || 0 : Number(validadeSel) || 0;
      const temExpiracao = validMeses > 0;
      const dataExp = temExpiracao
        ? (() => {
            const d = new Date(); d.setMonth(d.getMonth() + validMeses);
            return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
          })()
        : "31/12/2099";

      await api.post("/ServerPrincipal/InserirCompraTurbinada", {
        IDCliente:       clienteId,
        Produto:         values.produto || "",
        LojaParceira:    values.lojaParceira || "",
        IDCartao:        String(values.cartaoMilhasId),
        IDCartaoCredito: String(values.cartaoCreditoId || 0),
        Qtde:            String(precoProduto),
        QtdeTotal:       String(milhasTotalCalc),
        Univalor:        (custoMilheiro / 1000).toFixed(4).replace(".", ","),
        Totvalor:        valorTotal.toFixed(2).replace(".", ","),
        Parcelas:        values.parcelas,
        Observacoes:     values.observacoes || "",
        DataCompra:      values.dataOperacao ? values.dataOperacao.format("DD/MM/YYYY") : dayjs().format("DD/MM/YYYY"),
        bonus:           String(bonusVal),
        milhasBonus:     String(milhasBonusCalc),
        milhasOfertadas: String(milhasOfertadas),
        destinoProduto:  values.destinoProduto || "",
        pacote:          "bronze",
        Codigo:          codigoPagamento || "",
        DataExpiracao:   dataExp,
        Expira:          temExpiracao ? "1" : "0",
      });
      message.success(`Compra Turbinada realizada! Total: ${Math.round(milhasTotalCalc).toLocaleString("pt-BR")} milhas`);
      form.resetFields(["precoProduto","custoMilheiro","observacoes"]);
      setPrecoProduto(0); setCustoMilheiro(0); setBonusPercentual(0); setPontosBonus(0);
      setCodigoPagamento(""); setMilhasOfertadas(0); setValidadeSel(24); setValidadeOutros("");
    } catch (e) {
      message.error(e.response?.data || "Erro ao realizar compra");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = precoProduto > 0 && custoMilheiro > 0;

  const lbl = { fontSize: 12, color: "#666", fontWeight: 500, marginBottom: 4, display: "block" };
  const inp = { width: "100%" };
  const dis = { width: "100%", background: "#f5f5f5", color: "#999" };
  const fi  = { marginBottom: 14 };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
      <Spin spinning={loading}>
        <div style={{ width: "100%", maxWidth: 820, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", background: "#fff" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 24px 14px", borderBottom: "1px solid #f0f0f0" }}>
            <RocketOutlined style={{ fontSize: 17, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>Compra Turbinada</span>
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}
              initialValues={{ parcelas: 1, dataOperacao: dayjs(), validadeMeses: 24, destinoProduto: "Uso Próprio" }}
            >

              {/* ── Titular/Conta da Operação ── */}
              <div style={fi}>
                <label style={lbl}>Titular/Conta da Operação</label>
                <Form.Item name="cartaoMilhasId" noStyle rules={[{ required: true }]}>
                  <Select size="middle" style={{ width: "100%" }} placeholder="Selecione uma conta" loading={loading}>
                    {cartoesMilhas.map((c) => {
                      const prog         = c.car_nome_programa || "";
                      const primeiroNome = (c.cli_nome || "").split(" ")[0];
                      return (
                        <Option key={c.car_id} value={c.car_id}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <LogoCircle nome={prog} size={20} />
                            {primeiroNome} - {prog}
                          </span>
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </div>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0 14px" }} />

              {/* ── Cartão de Crédito + Parcelas ── */}
              <Row gutter={16}>
                <Col xs={24} sm={14}>
                  <div style={fi}>
                    <label style={lbl}>Cartão de Crédito</label>
                    <Form.Item name="cartaoCreditoId" noStyle>
                      <Select size="middle" style={{ width: "100%" }} placeholder="Selecione um cartão">
                        {cartoesCredito.length > 0 ? (
                          cartoesCredito.map((c) => {
                            const band   = c.cre_bandeira    ?? c.CRE_BANDEIRA    ?? "";
                            const numero = c.cre_numero      ?? c.CRE_NUMERO      ?? "";
                            const nome   = c.cre_nome_cartao ?? c.CRE_NOME_CARTAO ?? band;
                            const label  = nome + (numero ? ` •••• ${numero}` : "");
                            return <Option key={String(c.cre_id ?? "")} value={c.cre_id}>{label}</Option>;
                          })
                        ) : (
                          <Option value="">Nenhum cartão associado</Option>
                        )}
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={10}>
                  <div style={fi}>
                    <label style={lbl}>Parcelas</label>
                    <Form.Item name="parcelas" noStyle>
                      <Select size="middle" style={{ width: "100%" }}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => <Option key={n} value={n}>{n}x</Option>)}
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              {/* ── Produto + Loja parceira ── */}
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Produto</label>
                    <Form.Item name="produto" noStyle>
                      <Input size="middle" style={inp} placeholder="Nome do produto" />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Loja parceira</label>
                    <Form.Item name="lojaParceira" noStyle>
                      <Select size="middle" style={{ width: "100%" }} placeholder="Selecione a loja">
                        <Option value="Booking">Booking</Option>
                        <Option value="Camicado">Camicado</Option>
                        <Option value="Casas Bahia">Casas Bahia</Option>
                        <Option value="Extra">Extra</Option>
                        <Option value="Fast Shop">Fast Shop</Option>
                        <Option value="Localiza">Localiza</Option>
                        <Option value="Luxury Loyalty">Luxury Loyalty</Option>
                        <Option value="Magalu">Magalu</Option>
                        <Option value="Netshoes">Netshoes</Option>
                        <Option value="Ponto Frio">Ponto Frio</Option>
                        <Option value="Renner">Renner</Option>
                        <Option value="Riachuelo">Riachuelo</Option>
                        <Option value="Shoptime">Shoptime</Option>
                        <Option value="Submarino">Submarino</Option>
                        <Option value="Tok&Stok">Tok&Stok</Option>
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              {/* ── Preço + Pontos Bônus/R$ + Bônus + Validade ── */}
              <Row gutter={16}>
                <Col xs={12} sm={6}>
                  <div style={fi}>
                    <label style={lbl}>Preço do Produto (R$)</label>
                    <Form.Item name="precoProduto" noStyle>
                      <InputNumber style={inp} placeholder="0,00" min={0} step={0.01} precision={2}
                        controls={false} size="middle" onChange={handlePrecoProdutoChange}
                        suffix={<span style={{ color: "#bbb" }}>$</span>}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={fi}>
                    <label style={lbl}>Pontos Bônus/R$</label>
                    <InputNumber size="middle" style={dis} disabled value={bonusPercentual || null}
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={fi}>
                    <label style={lbl}>Bônus (%)</label>
                    <Form.Item name="bonus" noStyle>
                      <InputNumber style={inp} placeholder="0" min={0} max={100}
                        controls={false} size="middle" onChange={handleBonusChange}
                        suffix={<span style={{ color: "#555" }}>%</span>}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={fi}>
                    <label style={lbl}>Validade (Meses)</label>
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
                        placeholder="Informe os meses"
                        value={validadeOutros}
                        onChange={(e) => setValidadeOutros(e.target.value.replace(/\D/g,""))}
                      />
                    )}
                  </div>
                </Col>
              </Row>

              {/* ── Destino + Custo Milheiro ── */}
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Destino do Produto</label>
                    <Form.Item name="destinoProduto" noStyle>
                      <Select size="middle" style={{ width: "100%" }}>
                        <Option value="Uso Próprio">Uso Próprio</Option>
                        <Option value="Revenda">Revenda</Option>
                        <Option value="Transferência">Transferência</Option>
                        <Option value="Presente">Presente</Option>
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Custo Milheiro (Bônus) (R$)</label>
                    <Form.Item name="custoMilheiro" noStyle>
                      <InputNumber style={inp} placeholder="0,00" min={0} step={0.01} precision={2}
                        controls={false} size="middle" onChange={handleCustoMilheiroChange}
                        suffix={<span style={{ color: "#bbb" }}>$</span>}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              {/* ── Custo Total + Data Operação + Data Bônus ── */}
              <Row gutter={16} align="bottom">
                <Col xs={24} sm={8}>
                  <div style={fi}>
                    <label style={lbl}>Custo Total R$</label>
                    <InputNumber style={dis} value={custoTotal > 0 ? parseFloat(custoTotal.toFixed(2)) : null}
                      disabled precision={2} controls={false} size="middle"
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={fi}>
                    <label style={lbl}>Data Operação</label>
                    <Form.Item name="dataOperacao" noStyle>
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" size="middle"
                        disabledDate={(c) => c && c > dayjs().endOf("day")}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={fi}>
                    <label style={lbl}>Data do Bônus</label>
                    <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" size="middle" disabled />
                  </div>
                </Col>
              </Row>

              {/* ── Milhas + Milhas Bônus + Milhas Total ── */}
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <div style={fi}>
                    <label style={lbl}>Milhas</label>
                    <InputNumber style={dis} disabled value={precoProduto > 0 ? precoProduto : null}
                      controls={false} size="middle"
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={fi}>
                    <label style={lbl}>Milhas Bônus</label>
                    <InputNumber style={dis} disabled value={pontosBonus > 0 ? Math.round(pontosBonus) : null}
                      controls={false} size="middle"
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={fi}>
                    <label style={lbl}>Milhas Total</label>
                    <InputNumber style={dis} disabled value={milhasTotal > 0 ? Math.round(milhasTotal) : null}
                      controls={false} size="middle"
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
              </Row>

              {/* ── Código + Milhas Ofertadas ── */}
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Código de Pagamento</label>
                    <Input size="middle" style={inp} placeholder="Código / referência"
                      value={codigoPagamento}
                      onChange={(e) => setCodigoPagamento(e.target.value)}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Milhas Ofertadas</label>
                    <InputNumber size="middle" style={inp} min={0} controls={false}
                      value={milhasOfertadas || null}
                      onChange={(v) => setMilhasOfertadas(Number(v) || 0)}
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      parser={(v) => v ? v.replace(/\./g, "") : ""}
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
              </Row>

              {/* ── Observações ── */}
              <div style={fi}>
                <label style={lbl}>Observações:</label>
                <Form.Item name="observacoes" noStyle>
                  <Input.TextArea rows={3} style={{ fontSize: 13, resize: "vertical" }} placeholder="Observações adicionais..." />
                </Form.Item>
              </div>

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