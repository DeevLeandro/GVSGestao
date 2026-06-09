import React, { useState, useEffect } from "react";
import { Select, Spin, message } from "antd";
import { CheckOutlined, MoreOutlined } from "@ant-design/icons";
import api from "../services/api";

const { Option } = Select;

// ── Helper FireDAC ─────────────────────────────────────────────────────
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

// ── Helpers de formatação (exibição) ──────────────────────────────────
const fmtNum = (v) =>
  v > 0
    ? Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0,00";

const fmtInt = (v) =>
  v > 0 ? Number(v).toLocaleString("pt-BR") : "0";

const fmtDate = (v) => {
  if (!v) return "";
  const s = String(v).trim();
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  const compMatch = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compMatch) return `${compMatch[3]}/${compMatch[2]}/${compMatch[1]}`;
  if (s.match(/^\d{2}\/\d{2}\/\d{4}/)) return s.slice(0, 10);
  return s;
};

// ── Helpers de formatação para o backend Delphi ───────────────────────
// SaldoMilhas → StrToFloat: inteiro puro "350000", decimal com vírgula "350000,50"
const toDelphiFloat = (value) => {
  const n = Number(value);
  if (isNaN(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

// ValorClube → StrToCurr com FS pt-BR: "49,90" ou "6.306,23"
const toDelphiCurr = (value) => {
  const n = Number(value);
  if (isNaN(n)) return "0,00";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function Compensar({ clienteId: clienteIdProp }) {
  const [loading, setLoading]     = useState(false);
  const [registros, setRegistros] = useState([]);
  const [titular, setTitular]     = useState(null);
  const [clienteId, setClienteId] = useState(null);

  // Filtros
  const [filtroTitular, setFiltroTitular] = useState(null);

  // ── Resolve clienteId ─────────────────────────────────────────────
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
    carregarDados();
  }, [clienteId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const res  = await api.get("/ServerPrincipal/PesquisaCompensa", { params: { Cliente: clienteId } });
      const rows = extractRows(res.data);
      setRegistros(rows);
    } catch (e) {
      message.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // ── Compensar ─────────────────────────────────────────────────────
  // Backend espera: IDCliente, IDCartao, IDClube, SaldoMilhas, NomePrograma, ValorClube
  const handleCompensar = async (reg) => {
    const carId       = reg.car_id          ?? reg.CAR_ID          ?? 0;
    const cliId       = reg.cli_id          ?? reg.CLI_ID          ?? clienteId;
    const clubeId     = reg.clu_id          ?? reg.CLU_ID          ?? 0;
    const pontos      = Number(reg.clu_pontos       ?? reg.CLU_PONTOS       ?? 0);
    const mensalidade = Number(reg.clu_vmensalidade ?? reg.CLU_VMENSALIDADE ?? 0);
    const prog        = reg.car_nome_programa ?? reg.CAR_NOME_PROGRAMA ?? "";

    const payload = {
      IDCliente:    cliId,
      IDCartao:     carId,
      IDClube:      clubeId,
      SaldoMilhas:  toDelphiFloat(pontos),     // "350000" ou "350000,50"
      NomePrograma: prog,
      ValorClube:   toDelphiCurr(mensalidade), // "49,90"
    };

    console.log("Payload InserirCompensa:", JSON.stringify(payload, null, 2));

    setLoading(true);
    try {
      await api.post("/ServerPrincipal/InserirCompensa", payload);
      message.success("Compensação realizada com sucesso!");
      carregarDados();
    } catch (e) {
      message.error(e.response?.data || "Erro ao compensar.");
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers para nome do titular e programa de cada registro ─────
  const getNomeTitular = (reg) =>
    reg.cli_nome ?? reg.CLI_NOME ?? titular?.cli_nome ?? "";

  const nomePrograma = (reg) =>
    reg.car_nome_programa ?? reg.CAR_NOME_PROGRAMA ?? "";

  // Titulares únicos para o filtro
  const titularesUnicos = [...new Set(
    registros.map((r) => getNomeTitular(r)).filter(Boolean)
  )];

  const registrosFiltrados = registros.filter((r) => {
    if (!filtroTitular) return true;
    return getNomeTitular(r) === filtroTitular;
  });

  const isVencido = (reg) => {
    const v = reg.clu_vencimento ?? reg.CLU_VENCIMENTO ?? "";
    if (!v) return false;
    try { return new Date(v) < new Date(); } catch { return false; }
  };

  // ── Estilos ───────────────────────────────────────────────────────
  const th = {
    padding: "10px 16px", fontSize: 12, fontWeight: 600,
    color: "#888", textAlign: "left",
    borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap",
  };
  const tdStyle = (vencido) => ({
    padding: "14px 16px", fontSize: 13,
    color: vencido ? "#e8003d" : "#333",
    borderBottom: "1px solid #f7f7f7", whiteSpace: "nowrap",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "24px 16px" }}>
      <Spin spinning={loading}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Título */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <CheckOutlined style={{ fontSize: 16, color: "#444" }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#222" }}>Compensação</span>
          </div>

          {/* Filtros */}
          <div style={{
            background: "#1e2a38", borderRadius: 8, padding: "16px 20px",
            marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: "#aab", marginBottom: 6 }}>Filtrar por Titular</div>
              <Select
                size="middle" style={{ width: "100%" }}
                placeholder="Todos os titulares"
                allowClear
                onChange={(v) => setFiltroTitular(v ?? null)}
                value={filtroTitular}
              >
                {titularesUnicos.map((nome) => (
                  <Option key={nome} value={nome}>{nome}</Option>
                ))}
              </Select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: "#aab", marginBottom: 6 }}>Filtrar por Tipo de Operação</div>
              <Select
                size="middle" style={{ width: "100%" }}
                placeholder="Todas operações"
                allowClear
                disabled
              />
            </div>
          </div>

          {/* Tabela */}
          <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={th}>Titular da Conta</th>
                  <th style={th}>Tipo da Operação</th>
                  <th style={th}>Data</th>
                  <th style={{ ...th, display: "flex", alignItems: "center", gap: 4 }}>
                    Compensação <span style={{ fontSize: 10, color: "#bbb" }}>▼</span>
                  </th>
                  <th style={{ ...th, textAlign: "right" }}>Quantidade</th>
                  <th style={{ ...th, textAlign: "right" }}>Valor</th>
                  <th style={{ ...th, textAlign: "center" }}>Compensar</th>
                  <th style={{ ...th, width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "#bbb", fontSize: 13 }}>
                      {loading ? "Carregando..." : "Nenhum registro encontrado"}
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map((reg, i) => {
                    const vencido     = isVencido(reg);
                    const prog        = nomePrograma(reg);
                    const nomeCliente = getNomeTitular(reg);
                    const titular_    = `${nomeCliente}${prog ? " - " + prog : ""}`;
                    const tipo        = prog ? `Clube ${prog}` : "Clube";
                    const data        = fmtDate(reg.clu_vencimento ?? reg.CLU_VENCIMENTO ?? "");
                    const comp        = fmtDate(reg.clu_vencimento ?? reg.CLU_VENCIMENTO ?? "");
                    const qtde        = Number(reg.clu_pontos       ?? reg.CLU_PONTOS       ?? 0);
                    const valor       = Number(reg.clu_vmensalidade ?? reg.CLU_VMENSALIDADE ?? 0);

                    return (
                      <tr key={reg.clu_id ?? i}
                        style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={tdStyle(vencido)}>{titular_}</td>
                        <td style={tdStyle(vencido)}>{tipo}</td>
                        <td style={tdStyle(vencido)}>{data}</td>
                        <td style={tdStyle(vencido)}>{comp}</td>
                        <td style={{ ...tdStyle(vencido), textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {fmtInt(qtde)}
                        </td>
                        <td style={{ ...tdStyle(vencido), textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {fmtNum(valor)}
                        </td>
                        <td style={{ ...tdStyle(false), textAlign: "center" }}>
                          <button
                            onClick={() => handleCompensar(reg)}
                            style={{
                              padding: "4px 14px",
                              background: "#fff",
                              border: "1px solid #f5a800",
                              borderRadius: 4,
                              color: "#f5a800",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            COMPENSAR
                          </button>
                        </td>
                        <td style={{ ...tdStyle(false), textAlign: "center", padding: "14px 8px" }}>
                          <MoreOutlined style={{ fontSize: 16, color: "#bbb", cursor: "pointer" }} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </Spin>
    </div>
  );
}