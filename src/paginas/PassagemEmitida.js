import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, InputNumber, DatePicker,
  Row, Col, Spin, message, Tag,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";

const { Option } = Select;

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

const resolverCpfs = (cartao) =>
  Number(cartao?.car_qtde_cpf ?? cartao?.CAR_QTDE_CPF ?? 1);

export default function PassagemEmitida({ clienteId: clienteIdProp }) {
  const [form] = Form.useForm();
  const [loading, setLoading]           = useState(false);
  const [cartoes, setCartoes]           = useState([]);
  const [titulares, setTitulares]       = useState([]);  // ← array com todos titulares
  const [clienteId, setClienteId]       = useState(null);
  const [cartaoSel, setCartaoSel]       = useState(null);
  const [emitidoPorList, setEmitidoPor] = useState([]);

  const cpfsDisponiveis = cartaoSel ? resolverCpfs(cartaoSel) : 0;
  const saldoDisp       = Number(cartaoSel?.car_saldo_milhas ?? 0);

  // ── Resolve clienteId ─────────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    if (!id) {
      try { const u = JSON.parse(localStorage.getItem("user") || "{}"); id = u.cli_id || u.id; } catch (e) {}
      if (!id) id = parseInt(localStorage.getItem("userID") || "0") || null;
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
            car_qtde_cpf:      c.car_qtde_cpf       ?? c.CAR_QTDE_CPF      ?? 0,
            cli_id:            tit.cli_id           ?? tit.CLI_ID,
            cli_nome:          tit.cli_nome         ?? tit.CLI_NOME        ?? "",
            cli_email:         tit.cli_email        ?? tit.CLI_EMAIL       ?? "",
            cli_cpf:           tit.cli_cpf          ?? tit.CLI_CPF         ?? "",
            cli_telefone:      tit.cli_telefone     ?? tit.CLI_TELEFONE    ?? "",
          });
        });
      });

      // 5. Busca cartões de crédito para "Emitido Por"
      const creRes = await api.get("/ServerPrincipal/PesquisaCartaoCredito", { params: { Cliente: id } }).catch(() => ({ data: [] }));
      const creRows = extractRows(creRes.data);

      setTitulares(titularesDeduplic);
      setCartoes(cartoesFlat);
      setEmitidoPor(creRows);
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

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    if (!clienteId)                         { message.error("Cliente não identificado."); return; }
    if (!values.cartaoId)                   { message.error("Selecione a conta."); return; }
    if (!values.milhasUtilizadas || values.milhasUtilizadas <= 0) { message.error("Informe as milhas utilizadas."); return; }
    if (!values.localizador)                { message.error("Localizador é obrigatório."); return; }

    setLoading(true);
    try {
      // Pega o titular selecionado para o LocalEmissao
      const titularInfo = titulares.find(t => String(t.cli_id) === String(cartaoSel?.cli_id)) || titulares[0];
      
      await api.post("/ServerPrincipal/InserirPassagens", {
        IDCliente:         clienteId,
        IDCartao:          values.cartaoId,
        Localizador:       values.localizador      || "",
        CompanhiaAerea:    values.emitidoPor       || "",
        Origem:            "",
        Destino:           "",
        ValorMilhas:       values.milhasUtilizadas,
        LocalEmissao:      titularInfo?.cli_nome   || "",
        QuantidadePessoas: values.cpfsUtilizados   || 1,
        DataViagem:        values.dataEmissao ? values.dataEmissao.format("DD/MM/YYYY") : "",
        DataChegada:       "",
        NumeroVoo:         "",
        Classe:            "ECONOMICA",
        ValorTaxas:        "0",
        ValorTotal:        String(values.milhasUtilizadas),
        Observacao:        values.observacoes      || "",
      });
      message.success("Passagem registrada com sucesso!");
      form.resetFields();
      setCartaoSel(null);
    } catch (e) {
      message.error(e.response?.data || "Erro ao registrar passagem.");
    } finally {
      setLoading(false);
    }
  };

  const cartaoIdWatch    = Form.useWatch("cartaoId", form);
  const emitidoPorWatch  = Form.useWatch("emitidoPor", form);
  const milhasWatch      = Form.useWatch("milhasUtilizadas", form);
  const localizadorWatch = Form.useWatch("localizador", form);
  const cpfsUtilWatch    = Number(Form.useWatch("cpfsUtilizados", form) || 0);
  const isFormValid      = !!cartaoIdWatch && !!emitidoPorWatch && !!milhasWatch && milhasWatch > 0 && !!localizadorWatch;
  const cpfsRestantes    = Math.max(0, cpfsDisponiveis - cpfsUtilWatch);

  // ── Styles ─────────────────────────────────────────────────────────────
  const lbl = { fontSize: 12, color: "#666", fontWeight: 500, marginBottom: 4, display: "block" };
  const inp = { width: "100%", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fafafa", height: 36, fontSize: 14 };
  const dis = { ...inp, background: "#f5f5f5", color: "#999", cursor: "not-allowed" };
  const fi  = { marginBottom: 14 };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
      <Spin spinning={loading}>
        <div style={{ width: "100%", maxWidth: 820, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", background: "#fff" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 24px 14px", borderBottom: "1px solid #f0f0f0" }}>
            <SendOutlined style={{ fontSize: 16, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>Registro de Passagem Emitida</span>
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}
              initialValues={{ dataEmissao: dayjs(), cpfsUtilizados: 1 }}
            >

              {/* ── Linha 1: Titular + CPFs Disponíveis ── */}
              <Row gutter={16}>
                <Col xs={24} sm={16}>
                  <div style={fi}>
                    <label style={lbl}>Titular/Conta da Operação</label>
                    <Form.Item name="cartaoId" noStyle rules={[{ required: true, message: "Selecione a conta" }]}>
                      <Select size="middle" style={{ width: "100%" }}
                        placeholder="Selecione o programa" loading={loading}
                        onChange={handleCartaoChange}
                      >
                        {cartoes.map((c) => {
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
                </Col>
                <Col xs={24} sm={8}>
                  <div style={fi}>
                    <label style={lbl}>
                      CPFs Disponíveis
                      {cartaoSel && (
                        <Tag color={cpfsRestantes > 5 ? "green" : cpfsRestantes > 0 ? "orange" : "red"}
                          style={{ marginLeft: 8, fontSize: 11 }}>
                          {cpfsRestantes} restantes
                        </Tag>
                      )}
                    </label>
                    <Input size="middle" style={dis} readOnly
                      value={cartaoSel ? cpfsDisponiveis : ""}
                      placeholder="—" suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
              </Row>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "0 0 16px" }} />

              {/* ── Linha 2: Emitido Por + Saldo + Milhas ── */}
              <Row gutter={16}>
                <Col xs={24} sm={10}>
                  <div style={fi}>
                    <label style={lbl}>Emitido Por</label>
                    <Form.Item name="emitidoPor" noStyle rules={[{ required: true, message: "Selecione" }]}>
                      <Select size="middle" style={{ width: "100%" }} placeholder="Selecione">
                        {emitidoPorList.map((c) => {
                          const band   = c.cre_bandeira    ?? c.CRE_BANDEIRA    ?? "";
                          const numero = c.cre_numero      ?? c.CRE_NUMERO      ?? "";
                          const nome   = c.cre_nome_cartao ?? c.CRE_NOME_CARTAO ?? band;
                          const label  = nome + (numero ? ` •••• ${numero}` : "");
                          return (
                            <Option key={String(c.cre_id ?? c.CRE_ID ?? "")} value={label}>
                              {label}
                            </Option>
                          );
                        })}
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={7}>
                  <div style={fi}>
                    <label style={lbl}>Saldo Disponível</label>
                    <Input size="middle" style={dis} readOnly
                      value={saldoDisp > 0 ? saldoDisp.toLocaleString("pt-BR") : ""}
                      placeholder="—" suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={7}>
                  <div style={fi}>
                    <label style={lbl}>Milhas Utilizadas na emissão</label>
                    <Form.Item name="milhasUtilizadas" noStyle rules={[{ required: true, message: "Informe as milhas" }]}>
                      <InputNumber size="middle" style={inp} min={0} controls={false}
                        formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                        parser={(v) => v ? v.replace(/\./g, "") : ""}
                        suffix={<span style={{ color: "#bbb" }}>#</span>}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              {/* ── Linha 3: Localizador + Nº CPFs + Data Emissão ── */}
              <Row gutter={16}>
                <Col xs={24} sm={10}>
                  <div style={fi}>
                    <label style={lbl}>Localizador</label>
                    <Form.Item name="localizador" noStyle rules={[{ required: true, message: "Informe o localizador" }]}>
                      <Input size="middle" style={inp} placeholder="Ex: ABC123" />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={7}>
                  <div style={fi}>
                    <label style={lbl}>Nº CPFs utilizados</label>
                    <Form.Item name="cpfsUtilizados" noStyle>
                      <InputNumber size="middle" style={inp} min={1}
                        max={cpfsDisponiveis || 99} controls={false}
                        suffix={<span style={{ color: "#bbb" }}>#</span>}
                      />
                    </Form.Item>
                    {cartaoSel && cpfsDisponiveis > 0 && (
                      <div style={{ marginTop: 6, display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {Array.from({ length: Math.min(cpfsDisponiveis, 30) }).map((_, i) => (
                          <div key={i}
                            title={i < cpfsUtilWatch ? `CPF ${i+1} utilizado` : `CPF ${i+1} disponível`}
                            style={{ width: 14, height: 14, borderRadius: 3,
                              background: i < cpfsUtilWatch ? "#ff4d4f" : "#52c41a",
                              transition: "background 0.2s" }}
                          />
                        ))}
                        {cpfsDisponiveis > 30 && (
                          <span style={{ fontSize: 11, color: "#aaa", alignSelf: "center" }}>+{cpfsDisponiveis - 30}</span>
                        )}
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={24} sm={7}>
                  <div style={fi}>
                    <label style={lbl}>Data Emissão</label>
                    <Form.Item name="dataEmissao" noStyle>
                      <DatePicker style={inp} format="DD/MM/YYYY" size="middle" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              {/* ── Observações ── */}
              <div style={fi}>
                <label style={lbl}>Observações:</label>
                <Form.Item name="observacoes" noStyle>
                  <Input.TextArea rows={4} style={{ width: "100%", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, resize: "vertical" }} />
                </Form.Item>
              </div>

              {/* Submit */}
              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <button type="submit" disabled={loading || !isFormValid}
                  style={{
                    height: 36, padding: "0 32px", float: "right",
                    background: isFormValid ? "#1677ff" : "#bfbfbf",
                    border: "none", borderRadius: 4, color: "#fff",
                    fontSize: 13, fontWeight: 600, letterSpacing: "0.05em",
                    cursor: isFormValid ? "pointer" : "not-allowed",
                  }}
                >
                  {loading ? "PROCESSANDO..." : isFormValid ? "REGISTRAR PASSAGEM" : "PREENCHA OS DADOS!"}
                </button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Spin>
    </div>
  );
}