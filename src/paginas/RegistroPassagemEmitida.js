import React, { useState, useEffect } from "react";
import {
  Layout, Form, Input, Button, Select,
  InputNumber, DatePicker, message,
  Row, Col, Tag, Spin,
} from "antd";
import {
  SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";

const { Content } = Layout;
const { Option } = Select;

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

const fld = (obj, key, fb = "") =>
  obj?.[key] ?? obj?.[key?.toUpperCase()] ?? fb;

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

// ══════════════════════════════════════════════════════════════════════
export default function RegistroPassagemEmitida({ clienteId: clienteIdProp }) {
  const [form] = Form.useForm();
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [cartoes, setCartoes]         = useState([]);
  const [titulares, setTitulares]     = useState([]);  // ← array com todos titulares
  const [clienteId, setClienteId]     = useState(null);
  const [cartaoSel, setCartaoSel]     = useState(null);

  // ── Resolve clienteId ──────────────────────────────────────────────
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

      setTitulares(titularesDeduplic);
      setCartoes(cartoesFlat);
    } catch (e) {
      message.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // ── Submit cadastro ───────────────────────────────────────────────
  const handleCadastrar = async (values) => {
    if (!values.cartaoId)       { message.error("Selecione a conta.");    return; }
    if (!values.ValorMilhas)    { message.error("Informe as milhas.");     return; }
    if (!values.Localizador)    { message.error("Informe o localizador."); return; }
    setSaving(true);
    try {
      // Pega o titular selecionado para o LocalEmissao
      const titularInfo = titulares.find(t => String(t.cli_id) === String(cartaoSel?.cli_id)) || titulares[0];
      
      await api.post("/ServerPrincipal/InserirPassagens", {
        IDCliente:         clienteId,
        IDCartao:          values.cartaoId,
        Localizador:       values.Localizador     || "",
        CompanhiaAerea:    values.CompanhiaAerea  || "",
        Origem:            values.Origem          || "",
        Destino:           values.Destino         || "",
        ValorMilhas:       values.ValorMilhas,
        LocalEmissao:      titularInfo?.cli_nome  || "",
        QuantidadePessoas: values.QuantidadePessoas || 1,
        DataViagem:        values.DataViagem ? values.DataViagem.format("DD/MM/YYYY") : "",
        DataChegada:       values.DataChegada ? values.DataChegada.format("DD/MM/YYYY") : "",
        NumeroVoo:         values.NumeroVoo       || "",
        Classe:            values.Classe          || "ECONOMICA",
        ValorTaxas:        String(values.ValorTaxas || 0),
        ValorTotal:        String(values.ValorMilhas),
        Observacao:        values.Observacao      || "",
      });
      message.success("Passagem registrada com sucesso!");
      form.resetFields();
      setCartaoSel(null);
    } catch (e) {
      message.error(e.response?.data || "Erro ao registrar passagem.");
    } finally {
      setSaving(false);
    }
  };

  // Campos do formulário
  const inp = { width: "100%", borderRadius: 4 };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "32px 16px", background: "#f0f2f5", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 860, background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 24px 14px", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: 16 }}>✈</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>Registro de Passagem Emitida</span>
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
          <Form form={form} layout="vertical" onFinish={handleCadastrar}
            initialValues={{ Classe: "ECONOMICA", QuantidadePessoas: 1 }}
          >
            {/* Conta + Companhia */}
            <Row gutter={12}>
              <Col xs={24} sm={14}>
                <Form.Item label="Titular/Conta da Operação" name="cartaoId" rules={[{ required: true }]}>
                  <Select placeholder="Selecione o programa" onChange={(id) => {
                    const c = cartoes.find((x) => x.car_id === id);
                    setCartaoSel(c || null);
                  }}>
                    {cartoes.map((c) => {
                      const prog = c.car_nome_programa || "";
                      const nome = (c.cli_nome || "").split(" ")[0];
                      return (
                        <Option key={c.car_id} value={c.car_id}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <LogoCircle nome={prog} size={18} />
                            {nome} - {prog}
                          </span>
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item label="Companhia Aérea" name="CompanhiaAerea">
                  <Input placeholder="Ex: LATAM, GOL, AZUL" style={inp} />
                </Form.Item>
              </Col>
            </Row>

            {/* Localizador + Nº Voo */}
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item label="Localizador" name="Localizador" rules={[{ required: true }]}>
                  <Input placeholder="Ex: ABC123" style={inp} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Número do Voo" name="NumeroVoo">
                  <Input placeholder="Ex: LA3057" style={inp} />
                </Form.Item>
              </Col>
            </Row>

            {/* Origem + Destino */}
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item label="Origem" name="Origem">
                  <Input placeholder="Ex: GRU" style={inp} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Destino" name="Destino">
                  <Input placeholder="Ex: MIA" style={inp} />
                </Form.Item>
              </Col>
            </Row>

            {/* Data Viagem + Data Chegada */}
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item label="Data da Viagem" name="DataViagem">
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Data de Chegada" name="DataChegada">
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>

            {/* Milhas + Taxas + Pessoas */}
            <Row gutter={12}>
              <Col xs={24} sm={8}>
                <Form.Item label="Milhas Utilizadas" name="ValorMilhas" rules={[{ required: true }]}>
                  <InputNumber style={{ width: "100%" }} min={0} controls={false}
                    formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                    parser={(v) => v ? v.replace(/\./g, "") : ""}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Valor das Taxas (R$)" name="ValorTaxas">
                  <InputNumber style={{ width: "100%" }} min={0} controls={false} placeholder="0,00" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Qtde Pessoas" name="QuantidadePessoas">
                  <InputNumber style={{ width: "100%" }} min={1} max={9} controls={false} />
                </Form.Item>
              </Col>
            </Row>

            {/* Classe */}
            <Form.Item label="Classe" name="Classe">
              <Select>
                <Option value="ECONOMICA">Econômica</Option>
                <Option value="PREMIUM_ECONOMY">Premium Economy</Option>
                <Option value="EXECUTIVA">Executiva</Option>
                <Option value="PRIMEIRA_CLASSE">Primeira Classe</Option>
              </Select>
            </Form.Item>

            {/* Observações */}
            <Form.Item label="Observações" name="Observacao">
              <Input.TextArea rows={3} />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Button type="primary" htmlType="submit" loading={saving}
                style={{ background: "#1e3a4a", border: "none", height: 36, padding: "0 32px", fontWeight: 600 }}>
                {saving ? "PROCESSANDO..." : "REGISTRAR PASSAGEM"}
              </Button>
            </div>
          </Form>
          </div>
        </div>
      </Content>
    </Layout>
  );
}