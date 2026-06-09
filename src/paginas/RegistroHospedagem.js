import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, InputNumber, DatePicker,
  Row, Col, Spin, message, Upload, Button,
} from "antd";
import { PaperClipOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";

const { Option } = Select;

// ── Helper FireDAC (padronizado) ────────────────────────────────────────
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

// ── Logos programas ─────────────────────────────────────────────────────
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

const LogoCircle = ({ nome, size = 28 }) => {
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

// CPFs disponíveis vêm do banco (car_qtde_cpf)
const resolverCpfs = (cartao) => {
  if (!cartao) return 1;
  return Number(cartao.car_qtde_cpf ?? cartao.CAR_QTDE_CPF ?? 1);
};

export default function EmissaoHospedagem({ clienteId: clienteIdProp }) {
  const [form] = Form.useForm();
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [cartoes, setCartoes]           = useState([]);
  const [titulares, setTitulares]       = useState([]);  // ← array com todos titulares
  const [clienteId, setClienteId]       = useState(null);

  // Origem das milhas
  const [origemMilhas, setOrigemMilhas] = useState("proprias");
  const [cartaoSel, setCartaoSel]       = useState(null);

  // Campos numéricos
  const [precoReservaPagante, setPrecoReservaPagante] = useState(0);
  const [milhasUtil, setMilhasUtil]     = useState(0);
  const [taxas, setTaxas]               = useState(0);
  const [extras, setExtras]             = useState(0);
  const [fileList, setFileList]         = useState([]);

  // Hóspedes (input livre, sem busca no banco)
  const [nomeHospedeInput, setNomeHospedeInput] = useState("");
  const [hospedesSel, setHospedesSel]           = useState([]);
  const [erroHospede, setErroHospede]           = useState(false);

  // Cálculos derivados
  const custoMedio    = cartaoSel ? Number(cartaoSel.car_vunitario ?? cartaoSel.CAR_VUNITARIO ?? 0) : 0;
  const saldoDisp     = cartaoSel ? Number(cartaoSel.car_saldo_milhas ?? 0) : 0;
  const cpfsLivres    = cartaoSel ? resolverCpfs(cartaoSel) : 0;
  const precoEmMilhas = custoMedio > 0 && milhasUtil > 0
    ? parseFloat(((custoMedio / 1000) * milhasUtil).toFixed(2))
    : 0;

  const economiaGerada = precoReservaPagante > 0 && precoEmMilhas > 0
    ? parseFloat((precoReservaPagante - precoEmMilhas - taxas - extras).toFixed(2))
    : 0;
  const economiaPct = precoReservaPagante > 0 && economiaGerada > 0
    ? parseFloat(((economiaGerada / precoReservaPagante) * 100).toFixed(2))
    : 0;

  // ── Resolve clienteId ──────────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    if (!id) {
      const storedUser   = localStorage.getItem("user");
      const storedUserId = localStorage.getItem("userID");
      if (storedUser) {
        try { const u = JSON.parse(storedUser); id = u.cli_id || u.id; } catch (e) {}
      }
      if (!id && storedUserId) id = parseInt(storedUserId);
    }
    if (id) {
      setClienteId(id);
      carregarDados(id);
    } else {
      message.error("Usuário não autenticado.");
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
            car_qtde_cpf:      c.car_qtde_cpf       ?? c.CAR_QTDE_CPF      ?? 0,
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
    const c = cartoes.find((x) => x.car_id === id);
    setCartaoSel(c ? { ...c, car_vunitario: Number(c.car_vunitario ?? 0) } : null);
  };

  const handleOrigemChange = (v) => {
    setOrigemMilhas(v);
    setCartaoSel(null);
    form.setFieldValue("cartaoId", undefined);
  };

  // ── Hóspedes (digitação livre) ─────────────────────────────────────────
  const adicionarHospede = () => {
    const nome = nomeHospedeInput.trim();
    if (!nome) return;
    if (hospedesSel.find((h) => h.nome.toLowerCase() === nome.toLowerCase())) {
      setNomeHospedeInput("");
      return;
    }
    setHospedesSel([...hospedesSel, { id: Date.now(), nome }]);
    setNomeHospedeInput("");
    setErroHospede(false);
  };

  const removerHospede = (id) => {
    setHospedesSel(hospedesSel.filter((h) => h.id !== id));
  };

  const handleHospedeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarHospede();
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    if (!clienteId) { message.error("Cliente não identificado."); return; }
    if (!values.voucherReserva) { message.error("Voucher da Reserva é obrigatório."); return; }
    if (!milhasUtil || milhasUtil <= 0) { message.error("Informe as milhas utilizadas."); return; }
    if (hospedesSel.length === 0) {
      setErroHospede(true);
      message.error("Inclua pelo menos um hóspede.");
      return;
    }

    setSaving(true);
    const fmtDelphi = (v) => Number(v || 0).toFixed(2).replace(".", ",");

    try {
      await api.post("/ServerPrincipal/InserirHospedagem", {
        IDCliente:        clienteId,
        IDCartao:         values.cartaoId || 0,
        QtdeMilhas:       String(milhasUtil),
        ValorUnitario:    fmtDelphi(custoMedio / 1000),
        ValorTotal:       fmtDelphi(precoReservaPagante),
        ValorCusto:       fmtDelphi(precoEmMilhas),
        ValorReserva:     fmtDelphi(precoReservaPagante),
        ValorTaxa:        fmtDelphi(taxas),
        ValorMilhas:      fmtDelphi(precoEmMilhas),
        FormaPagamento:   origemMilhas,
        Observacoes:      values.observacoes || "",
        Status:           1,
        QtdeCpf:          String(hospedesSel.length),
        Economia:         fmtDelphi(economiaGerada),
        PEconomia:        fmtDelphi(economiaPct),
        VoucherReserva:   values.voucherReserva || "",
        NomeHospedagem:   values.nomeHospedagem || "",
        ObjetivoEmissao:  values.objetivoEmissao || "uso_proprio",
        DataCheckIn:      values.dataCheckIn ? values.dataCheckIn.format("DD/MM/YYYY HH:mm:ss") : "",
      });

      message.success("Reserva de hospedagem registrada com sucesso!");
      form.resetFields();
      setPrecoReservaPagante(0); setMilhasUtil(0); setTaxas(0); setExtras(0);
      setCartaoSel(null); setHospedesSel([]); setFileList([]);
      setOrigemMilhas("proprias");
    } catch (e) {
      message.error(e.response?.data || "Erro ao registrar hospedagem");
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = milhasUtil > 0 && cartaoSel && hospedesSel.length > 0;

  const fmt = (v) => v > 0
    ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";

  // ── Styles ────────────────────────────────────────────────────────────
  const s = {
    page:   { minHeight: "100vh", background: "#f0f2f5", padding: "24px" },
    card:   { background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
    header: { display: "flex", alignItems: "center", gap: 8, padding: "16px 20px 14px", borderBottom: "1px solid #f0f0f0" },
    body:   { padding: "20px 24px 24px" },
    lbl:    { fontSize: 12, color: "#555", fontWeight: 500, marginBottom: 4, display: "block" },
    inp:    { width: "100%", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fafafa", height: 36, fontSize: 14 },
    dis:    { width: "100%", borderRadius: 4, border: "1px solid #e8e8e8", background: "#f5f5f5", height: 36, fontSize: 14, color: "#888" },
    fi:     { marginBottom: 14 },
    divider:{ borderTop: "1px dashed #e0e0e0", margin: "16px 0" },
    submitBtn: {
      width: "100%", height: 36,
      background: isFormValid ? "#1677ff" : "#bfbfbf",
      border: "none", borderRadius: 4, color: "#fff",
      fontSize: 13, fontWeight: 600, letterSpacing: "0.05em",
      cursor: isFormValid ? "pointer" : "not-allowed",
    },
  };

  return (
    <div style={s.page}>
      <Spin spinning={loading}>
        <div style={s.card}>
          {/* Header */}
          <div style={s.header}>
            <span style={{ fontSize: 16 }}>🏨</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Emissões para Uso Próprio</span>
          </div>

          <div style={s.body}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}
              initialValues={{ dataEmissao: dayjs(), objetivoEmissao: "uso_proprio" }}
            >
              <Row gutter={24}>
                {/* ── COLUNA ESQUERDA ── */}
                <Col xs={24} md={13} style={{ borderRight: "1px dashed #e0e0e0", paddingRight: 24 }}>

                  {/* Origem das Milhas */}
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

                  {/* Titular + Saldo + Custo Médio */}
                  <Row gutter={10} style={{ marginBottom: 14 }}>
                    <Col xs={24} sm={12}>
                      <label style={s.lbl}>Titular/Conta da Operação</label>
                      <Form.Item name="cartaoId" noStyle rules={[{ required: true, message: "Selecione" }]}>
                        <Select
                          size="middle" style={{ width: "100%" }}
                          placeholder="Selecione o programa"
                          loading={loading}
                          onChange={handleCartaoChange}
                        >
                          {cartoes.map((c) => {
                            const prog = c.car_nome_programa || "";
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
                    </Col>
                    <Col xs={12} sm={6}>
                      <label style={s.lbl}>Saldo disponível</label>
                      <Input size="middle" style={s.dis} readOnly
                        value={saldoDisp > 0 ? saldoDisp.toLocaleString("pt-BR") : ""}
                        placeholder="0"
                        suffix={<span style={{ color: "#bbb" }}>#</span>}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <label style={s.lbl}>Custo Médio</label>
                      <Input size="middle" style={s.dis} readOnly
                        value={custoMedio > 0 ? fmt(custoMedio) : ""}
                        placeholder="0,00"
                        suffix={<span style={{ color: "#bbb" }}>$</span>}
                      />
                    </Col>
                  </Row>

                  <div style={s.divider} />

                  {/* Preço da Reserva Pagante + Print Recibo */}
                  <Row gutter={10} style={{ marginBottom: 4 }}>
                    <Col xs={14} sm={14}>
                      <label style={s.lbl}>Preço da Reserva Pagante</label>
                      <InputNumber
                        size="middle" style={s.inp} min={0} controls={false}
                        onChange={(v) => setPrecoReservaPagante(Number(v) || 0)}
                        formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                        parser={(v) => v ? v.replace(/\./g, "") : ""}
                        suffix={<span style={{ color: "#bbb" }}>$</span>}
                      />
                    </Col>
                    <Col xs={10} sm={10}>
                      <label style={s.lbl}>&nbsp;</label>
                      <Upload
                        fileList={fileList}
                        beforeUpload={(file) => {
                          const formData = new FormData();
                          formData.append("file", file);
                          api.post("/upload/images", formData, {
                            headers: { "Content-Type": "multipart/form-data" },
                          }).catch(() => {});
                          setFileList([file]);
                          return false;
                        }}
                        maxCount={1}
                        showUploadList={false}
                        accept="image/*,.pdf"
                      >
                        <Button
                          icon={<PaperClipOutlined />}
                          style={{ width: "100%", height: 36, border: "1px solid #d9d9d9", borderRadius: 4, background: "#fafafa", fontSize: 13 }}
                        >
                          PRINT RECIBO
                        </Button>
                      </Upload>
                      <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                        {fileList.length > 0 ? fileList[0].name : "Nenhum arquivo selecionado."}
                      </div>
                    </Col>
                  </Row>

                  {/* Milhas Utilizadas */}
                  <div style={s.fi}>
                    <label style={s.lbl}>Milhas Utilizadas</label>
                    <InputNumber
                      size="middle" style={s.inp} min={0} controls={false}
                      onChange={(v) => setMilhasUtil(Number(v) || 0)}
                      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      parser={(v) => v ? v.replace(/\./g, "") : ""}
                      suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>

                  {/* Preço em Milhas (calculado) */}
                  <div style={s.fi}>
                    <label style={s.lbl}>Preço em Milhas</label>
                    <Input size="middle" style={s.dis} readOnly
                      value={fmt(precoEmMilhas)}
                      placeholder="0,00"
                      suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>

                  {/* Taxas + Extras */}
                  <Row gutter={10} style={{ marginBottom: 14 }}>
                    <Col xs={12}>
                      <label style={s.lbl}>Taxas</label>
                      <InputNumber
                        size="middle" style={s.inp} min={0} controls={false}
                        onChange={(v) => setTaxas(Number(v) || 0)}
                        formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                        parser={(v) => v ? v.replace(/\./g, "") : ""}
                        placeholder="0,00"
                        suffix={<span style={{ color: "#bbb" }}>$</span>}
                      />
                    </Col>
                    <Col xs={12}>
                      <label style={s.lbl}>Extras</label>
                      <InputNumber
                        size="middle" style={s.inp} min={0} controls={false}
                        onChange={(v) => setExtras(Number(v) || 0)}
                        formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                        parser={(v) => v ? v.replace(/\./g, "") : ""}
                        placeholder="0,00"
                        suffix={<span style={{ color: "#bbb" }}>$</span>}
                      />
                    </Col>
                  </Row>

                  {/* Economia Gerada + Economia % */}
                  <Row gutter={10} style={{ marginBottom: 14 }}>
                    <Col xs={12}>
                      <label style={s.lbl}>Economia Gerada</label>
                      <Input size="middle" style={s.dis} readOnly
                        value={fmt(economiaGerada)} placeholder="0,00"
                        suffix={<span style={{ color: "#bbb" }}>$</span>}
                      />
                    </Col>
                    <Col xs={12}>
                      <label style={s.lbl}>Economia em %</label>
                      <Input size="middle" style={s.dis} readOnly
                        value={economiaPct > 0 ? fmt(economiaPct) : ""}
                        placeholder="0"
                        suffix={<span style={{ color: "#bbb" }}>%</span>}
                      />
                    </Col>
                  </Row>

                  {/* Voucher da Reserva + Data do Check-In */}
                  <Row gutter={10} style={{ marginBottom: 14 }}>
                    <Col xs={12}>
                      <label style={s.lbl}>Voucher da Reserva</label>
                      <Form.Item name="voucherReserva" noStyle rules={[{ required: true, message: "Campo obrigatório." }]}>
                        <Input size="middle" style={s.inp} />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <label style={s.lbl}>Data do Check-In</label>
                      <Form.Item name="dataCheckIn" noStyle>
                        <DatePicker style={s.inp} format="DD/MM/YYYY" size="middle" />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Nome da Hospedagem */}
                  <div style={s.fi}>
                    <label style={s.lbl}>Nome da Hospedagem</label>
                    <Form.Item name="nomeHospedagem" noStyle>
                      <Input size="middle" style={s.inp} />
                    </Form.Item>
                  </div>

                  {/* Data da Emissão */}
                  <div style={s.fi}>
                    <label style={s.lbl}>Data da Emissão</label>
                    <Form.Item name="dataEmissao" noStyle>
                      <DatePicker style={s.inp} format="DD/MM/YYYY" size="middle"
                        disabledDate={(c) => c && c > dayjs().endOf("day")}
                      />
                    </Form.Item>
                  </div>

                  {/* Objetivo da Emissão */}
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

                  {/* Observações */}
                  <div style={s.fi}>
                    <label style={s.lbl}>Observações:</label>
                    <Form.Item name="observacoes" noStyle>
                      <Input.TextArea rows={4} style={{ width: "100%", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, resize: "vertical" }} />
                    </Form.Item>
                  </div>
                </Col>

                {/* ── COLUNA DIREITA: Hóspedes ── */}
                <Col xs={24} md={11} style={{ paddingLeft: 24 }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>Registro de Hóspedes</span>

                    {/* Input de nome do hóspede */}
                    <div style={{ marginTop: 12, marginBottom: 4 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Input
                          size="middle"
                          placeholder="Digite o nome do hóspede"
                          value={nomeHospedeInput}
                          onChange={(e) => {
                            setNomeHospedeInput(e.target.value);
                            if (e.target.value) setErroHospede(false);
                          }}
                          onKeyDown={handleHospedeKeyDown}
                          style={{ borderRadius: 4, flex: 1, borderColor: erroHospede ? "#ff4d4f" : undefined }}
                          suffix={
                            <PlusOutlined
                              style={{ color: "#1677ff", cursor: "pointer", fontSize: 16 }}
                              onClick={adicionarHospede}
                            />
                          }
                        />
                      </div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                        Pressione 'Enter' ou clique no <PlusOutlined style={{ fontSize: 10 }} /> para adicionar.
                      </div>
                      <div style={{ fontSize: 11, color: "#1677ff", marginTop: 2 }}>
                        Não é necessário um registro prévio do hóspede!
                      </div>
                      {erroHospede && (
                        <div style={{ fontSize: 11, color: "#ff4d4f", marginTop: 4 }}>
                          Inclua pelo menos um hóspede.
                        </div>
                      )}
                    </div>

                    {/* Header tabela hóspedes */}
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#888", padding: "8px 0 8px", borderBottom: "1px solid #f0f0f0", marginTop: 12, marginBottom: 8 }}>
                      Nome
                    </div>

                    {/* Lista de hóspedes ou placeholder */}
                    <div style={{ maxHeight: 280, overflowY: "auto" }}>
                      {hospedesSel.length === 0 ? (
                        <div style={{
                          padding: "20px 14px", fontSize: 12, color: "#aaa",
                          background: "#fafafa", borderRadius: 4, textAlign: "center",
                          border: "1px dashed #e0e0e0",
                        }}>
                          Utilize o campo acima para adicionar os nomes dos hóspedes.
                        </div>
                      ) : (
                        hospedesSel.map((h) => (
                          <div
                            key={h.id}
                            style={{
                              padding: "8px 10px", marginBottom: 6, borderRadius: 4,
                              background: "#f9f9f9", border: "1px solid #f0f0f0",
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{h.nome}</span>
                            <button
                              type="button"
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: "0 4px", fontSize: 14 }}
                              onClick={() => removerHospede(h.id)}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Resumo hóspedes */}
                    <div style={{ marginTop: 16, padding: "10px 12px", background: "#f9f9f9", borderRadius: 4, border: "1px solid #f0f0f0" }}>
                      <div style={{ fontSize: 12, color: "#555" }}>CPFs limitados pelo programa: <strong>{cpfsLivres}</strong></div>
                      <div style={{ fontSize: 12, color: "#555" }}>CPFs que já voaram: <strong>0</strong></div>
                      <div style={{ fontSize: 12, color: "#555" }}>Hóspedes desta reserva: <strong>{hospedesSel.length}</strong></div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Submit */}
              <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                <button type="submit" style={s.submitBtn} disabled={saving || !isFormValid}>
                  {saving ? "PROCESSANDO..." : isFormValid ? "CONFIRMAR HOSPEDAGEM" : "PREENCHA OS DADOS!"}
                </button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Spin>
    </div>
  );
}