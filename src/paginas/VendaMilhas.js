import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, InputNumber, DatePicker,
  Row, Col, Spin, message,
} from "antd";
import { SwapOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";

const { Option } = Select;

// ── LOGOS_MAP ──────────────────────────────────────────────────────────
const LOGOS_MAP = [
  { keys: ["livelo"],                    bg: "#e800aa", letra: "LV"  },
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

export default function VendaMilhas({ clienteId: clienteIdProp }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cartoes, setCartoes] = useState([]);
  const [titulares, setTitulares] = useState([]);  // ← array com todos titulares
  const [cartaoSelecionado, setCartaoSelecionado] = useState(null);
  const [clienteId, setClienteId] = useState(null);

  const [quantidade, setQuantidade] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [precoPorMilheiro, setPrecoPorMilheiro] = useState(0);

  const formatLocaleNumber = (value) => {
    if (!value && value !== 0) return "";
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const custoMedio   = cartaoSelecionado?.car_vunitario ?? cartaoSelecionado?.CAR_VUNITARIO ?? 0;
  const saldoDisp    = cartaoSelecionado?.car_saldo_milhas ?? 0;
  const lucroPercent =
    custoMedio > 0 && precoPorMilheiro > 0
      ? Math.round(((precoPorMilheiro - custoMedio) / custoMedio) * 100)
      : 0;

  useEffect(() => {
    const total = quantidade > 0 && precoPorMilheiro > 0
      ? (quantidade / 1000) * precoPorMilheiro : 0;
    setValorTotal(total);
    form.setFieldValue("valorTotal", total > 0 ? formatLocaleNumber(total) : "");
  }, [quantidade, precoPorMilheiro]);

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

  const handleCartaoChange = (id) => {
    const cartao = cartoes.find((x) => x.car_id === id);
    setCartaoSelecionado(cartao || null);
  };

  const handleSubmit = async (values) => {
    if (!clienteId)              { message.error("Cliente não identificado."); return; }
    if (!quantidade || quantidade <= 0) { message.error("Informe a quantidade."); return; }
    if (!values.intermediario)   { message.error("Selecione o intermediário."); return; }

    setLoading(true);
    try {
      await api.post("/ServerPrincipal/InserirVendas", {
        IDCliente:      clienteId,
        IDCartao:       values.cartaoId,
        QtdeMilhas:     quantidade,
        ValorUnitario:  precoPorMilheiro / 1000,
        ValorTotal:     valorTotal,
        FormaPagamento: values.intermediario,
        Observacoes:    values.observacoes || "",
        DataVenda:      values.dataVenda   ? values.dataVenda.format("YYYY-MM-DD")   : dayjs().format("YYYY-MM-DD"),
        Recebimento:    values.recebimento ? values.recebimento.format("YYYY-MM-DD") : null,
      });
      message.success(`Venda realizada! ${quantidade.toLocaleString("pt-BR")} milhas vendidas`);
      form.resetFields();
      setQuantidade(0); setValorTotal(0); setPrecoPorMilheiro(0); setCartaoSelecionado(null);
    } catch (e) {
      message.error(e.response?.data || "Erro ao realizar venda");
    } finally {
      setLoading(false);
    }
  };

  const cartaoIdSelecionado = Form.useWatch("cartaoId", form);
  const intermediarioWatch  = Form.useWatch("intermediario", form);
  const isFormValid         = !!cartaoIdSelecionado && !!intermediarioWatch && quantidade > 0;

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
            <SwapOutlined style={{ fontSize: 18, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>Venda de Milhas</span>
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}
              initialValues={{ dataVenda: dayjs() }}
            >

              {/* ── Linha 1: Titular + Custo Médio + Saldo ── */}
              <Row gutter={16} style={{ marginBottom: 14 }}>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Titular/Conta da Operação</label>
                    <Form.Item name="cartaoId" noStyle rules={[{ required: true, message: "Selecione a conta" }]}>
                      <Select size="middle" style={{ width: "100%" }}
                        placeholder="Selecione a conta" loading={loading}
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
                <Col xs={24} sm={6}>
                  <div style={fi}>
                    <label style={lbl}>Custo Médio</label>
                    <Input size="middle" style={dis} readOnly
                      value={custoMedio > 0 ? custoMedio : ""}
                      placeholder="0" suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={6}>
                  <div style={fi}>
                    <label style={lbl}>Saldo Disponível</label>
                    <Input size="middle" style={dis} readOnly
                      value={saldoDisp > 0 ? saldoDisp.toLocaleString("pt-BR") : ""}
                      placeholder="0" suffix={<span style={{ color: "#bbb" }}>#</span>}
                    />
                  </div>
                </Col>
              </Row>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0 16px" }} />

              {/* ── Intermediário ── */}
              <div style={fi}>
                <label style={lbl}>Intermediário</label>
                <Form.Item name="intermediario" noStyle rules={[{ required: true, message: "Campo obrigatório." }]}>
                  <Select size="middle" style={{ width: "100%" }} placeholder="Selecione o intermediário">
                    <Option value="maxmilhas">MaxMilhas</Option>
                    <Option value="123milhas">123Milhas</Option>
                    <Option value="melhores_destinos">Melhores Destinos</Option>
                    <Option value="travelex">Travelex</Option>
                    <Option value="passagens_promo">Passagens Promo</Option>
                    <Option value="esperto">Esperto</Option>
                    <Option value="direto">Direto (Sem Intermediário)</Option>
                  </Select>
                </Form.Item>
              </div>

              {/* ── Quantidade + Valor Total + Preço por Milheiro + Lucro ── */}
              <Row gutter={12} style={{ marginBottom: 14 }}>
                <Col xs={12} sm={6}>
                  <div style={fi}>
                    <label style={lbl}>Quantidade</label>
                    <Form.Item name="quantidade" noStyle>
                      <InputNumber size="middle" style={inp} min={0} controls={false}
                        onChange={(v) => setQuantidade(Number(v) || 0)}
                        formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                        parser={(v) => v ? v.replace(/\./g, "") : ""}
                        suffix={<span style={{ color: "#bbb" }}>#</span>}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={fi}>
                    <label style={lbl}>Valor Total da Venda</label>
                    <Input size="middle" style={dis} readOnly
                      value={valorTotal > 0 ? formatLocaleNumber(valorTotal) : ""}
                      placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={fi}>
                    <label style={lbl}>Preço por milheiro</label>
                    <InputNumber size="middle" style={inp} min={0} controls={false}
                      onChange={(v) => setPrecoPorMilheiro(Number(v) || 0)}
                      formatter={(v) => v !== undefined && v !== null ? String(v).replace(".", ",") : ""}
                      parser={(v) => v ? parseFloat(v.replace(",", ".")) || 0 : 0}
                      placeholder="0,00" suffix={<span style={{ color: "#bbb" }}>$</span>}
                    />
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={fi}>
                    <label style={lbl}>Lucro da Operação</label>
                    <Input size="middle" style={dis} readOnly
                      value={lucroPercent !== 0 ? lucroPercent : ""}
                      placeholder="0" suffix={<span style={{ color: "#bbb" }}>%</span>}
                    />
                  </div>
                </Col>
              </Row>

              {/* ── Datas ── */}
              <Row gutter={16} style={{ marginBottom: 14 }}>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Data da Venda</label>
                    <Form.Item name="dataVenda" noStyle>
                      <DatePicker style={inp} format="DD/MM/YYYY" size="middle"
                        disabledDate={(c) => c && c > dayjs().endOf("day")}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={fi}>
                    <label style={lbl}>Recebimento em</label>
                    <Form.Item name="recebimento" noStyle>
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
                    width: "100%", height: 36,
                    background: isFormValid ? "#1677ff" : "#bfbfbf",
                    border: "none", borderRadius: 4, color: "#fff",
                    fontSize: 13, fontWeight: 600, letterSpacing: "0.05em",
                    cursor: isFormValid ? "pointer" : "not-allowed",
                  }}
                >
                  {loading ? "PROCESSANDO..." : isFormValid ? "CONFIRMAR VENDA" : "PREENCHA OS DADOS!"}
                </button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Spin>
    </div>
  );
}