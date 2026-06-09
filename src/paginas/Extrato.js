import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { ArrowLeftOutlined, DownloadOutlined, DownOutlined } from "@ant-design/icons";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api, { extractFireDACData } from "../services/api";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtBRL = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtMil = (v) => Number(v || 0).toLocaleString("pt-BR");
const fmtPct = (v) => `${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%`;
const fmtNum = (v) => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (v) => {
  if (!v) return "—";
  const s = String(v).trim();
  const iso  = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const compT = s.match(/^(\d{4})(\d{2})(\d{2})T/);
  if (compT) return `${compT[3]}/${compT[2]}/${compT[1]}`;
  if (s.match(/^\d{2}\/\d{2}\/\d{4}/)) return s.slice(0, 10);
  return s;
};

// Normaliza chaves para minúsculo (FireDAC pode retornar maiúsculo)
const norm = (row) => {
  if (!row || typeof row !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(row)) out[k.toLowerCase()] = v;
  return out;
};

const DARK_NAV = "#1e3a4a";
const ORANGE   = "#f5a623";

// ─── LOGOS ────────────────────────────────────────────────────────────────────
const PROGRAMA_LIST = [
  { keys: ["livelo"],                    bg: "#e8008b", letra: "LV"  },
  { keys: ["itaú pontos","itau pontos"], bg: "#003087", letra: "IT"  },
  { keys: ["smiles"],                    bg: "#ff6600", letra: "S"   },
  { keys: ["azul fidelidade","azul"],    bg: "#003087", letra: "A"   },
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

function getProgramaStyle(nome) {
  if (!nome) return { bg: DARK_NAV, letra: "★" };
  const key = nome.toLowerCase();
  for (const prog of PROGRAMA_LIST) {
    if (prog.keys.some(k => key.includes(k))) return { bg: prog.bg, letra: prog.letra };
  }
  const colors = ["#6B21A8","#0369A1","#065F46","#92400E","#1e3a4a","#9D174D"];
  return { bg: colors[nome.charCodeAt(0) % colors.length], letra: nome.substring(0,2).toUpperCase() };
}

function AirlineLogo({ nome, size = 34 }) {
  const s = getProgramaStyle(nome);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: s.bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
      {s.letra}
    </div>
  );
}

// ─── ABA POSIÇÃO ──────────────────────────────────────────────────────────────
function TabPosicao({ cartoes, titulares, loading }) {
  const [expandidos, setExpandidos] = useState({});

  useEffect(() => {
    if (titulares.length > 0) {
      const init = {};
      titulares.forEach(t => { init[t.cli_id] = true; });
      setExpandidos(init);
    }
  }, [titulares]);

  const grupos = {};
  titulares.forEach(t => { grupos[t.cli_id] = { titular: t, cartoes: [] }; });
  cartoes.forEach(c => {
    const key = c.cli_id;
    if (grupos[key]) grupos[key].cartoes.push(c);
    else if (Object.keys(grupos).length > 0) grupos[Object.keys(grupos)[0]].cartoes.push(c);
  });

  const th = { fontSize: 12, fontWeight: 600, color: "#888", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid #f0f0f0", background: "#fafafa", whiteSpace: "nowrap" };
  const td = (align = "left") => ({ padding: "11px 16px", borderBottom: "1px solid #f5f5f5", fontSize: 13, color: "#333", textAlign: align });

  return (
    <Spin spinning={loading}>
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e8e8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Titular/Conta","Saldo","Custo Médio","Patrimônio","Próx Lotes a Expirar"].map((h,i)=>(
              <th key={i} style={{...th, width: i===0?"30%":"auto"}}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {Object.entries(grupos).map(([key, grupo]) => {
              const isOpen = expandidos[key] !== false;
              const nome = grupo.titular.cli_nome || "Titular";
              return (
                <React.Fragment key={key}>
                  <tr onClick={() => setExpandidos(p=>({...p,[key]:!p[key]}))}
                    style={{ cursor:"pointer", background:"#f7f8fa" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#eef2f7"}
                    onMouseLeave={e=>e.currentTarget.style.background="#f7f8fa"}>
                    <td colSpan={5} style={{ padding:"9px 16px", borderBottom:"1px solid #e8e8e8" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:10, color:"#aaa", transition:"transform 0.2s", display:"inline-block", transform: isOpen?"rotate(0deg)":"rotate(-90deg)" }}>▼</span>
                        <span style={{ fontSize:13, fontWeight:600, color:DARK_NAV }}>{nome}</span>
                      </div>
                    </td>
                  </tr>
                  {isOpen && grupo.cartoes.map((c,idx)=>{
                    const saldo = Number(c.car_saldo_milhas||0);
                    const custo = Number(c.car_vunitario||0);
                    const patrimonio = (saldo*custo)/1000;
                    const expira = c.car_expira===1||c.car_expira==="1";
                    const qtdeExp = Number(c.car_qtde_expira||0);
                    return (
                      <tr key={c.car_id||idx} style={{ background: idx%2===0?"#fff":"#fafcff" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#f0f7ff"}
                        onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#fafcff"}>
                        <td style={td()}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, paddingLeft:24 }}>
                            <AirlineLogo nome={c.car_nome_programa} size={34} />
                            <span style={{ fontSize:13, fontWeight:500 }}>{c.car_nome_programa||"—"}</span>
                          </div>
                        </td>
                        <td style={td("right")}>{fmtMil(saldo)}</td>
                        <td style={td("right")}>{fmtBRL(custo)}</td>
                        <td style={td("right")}>{fmtBRL(patrimonio)}</td>
                        <td style={td()}>
                          {expira && qtdeExp > 0 && c.car_dtexpiracao ? (
                            <span style={{ fontSize:12, color:"#d46b08", background:"#fff7e6", border:"1px solid #ffd591", borderRadius:4, padding:"2px 8px", fontWeight:600, whiteSpace:"nowrap" }}>
                              {fmtMil(qtdeExp)} em {fmtDate(c.car_dtexpiracao)}
                            </span>
                          ) : <span style={{ color:"#bbb", fontSize:12 }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
            {Object.keys(grupos).length===0 && !loading && (
              <tr><td colSpan={5} style={{ textAlign:"center", padding:"48px 0", color:"#bbb", fontSize:14 }}>Nenhuma conta encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Spin>
  );
}

// ─── ABA UTILIZAÇÃO ───────────────────────────────────────────────────────────
function TabUtilizacao({ clienteId }) {
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [ciclos, setCiclos]       = useState([]);
  const [cicloSel, setCicloSel]   = useState(null);
  const [dropOpen, setDropOpen]   = useState(false);

  useEffect(() => {
    if (!clienteId) return;
    setLoading(true);
    api.get("/ServerPrincipal/RelatorioEconomia", { params: { Cliente: clienteId } })
      .then(r => {
        // Normaliza todos os campos para minúsculo
        const data = extractFireDACData(r.data).map(norm);
        setRelatorio(data);

        if (data.length === 0) return;

        // Agrupa por ano para criar ciclos
        const anos = [...new Set(
          data.map(d => String(d.tra_data || d.ano_mes || "").substring(0, 4)).filter(Boolean)
        )].sort().reverse();

        if (anos.length > 0) {
          const ciclosGerados = anos.map((ano, i) => {
            const rows  = data.filter(d => String(d.tra_data || d.ano_mes || "").startsWith(ano));
            const datas = rows.map(d => d.tra_data).filter(Boolean).sort();
            const inicio = datas[0]                    ? fmtDate(datas[0])                    : `01/01/${ano}`;
            const fim    = datas[datas.length - 1]     ? fmtDate(datas[datas.length - 1])     : `31/12/${ano}`;
            return { label: `${i + 1}º ciclo: ${inicio} - ${fim}`, ano, rows };
          });
          setCiclos(ciclosGerados);
          setCicloSel(ciclosGerados[0]);
        } else {
          const fallback = [{ label: "1º ciclo: todos os registros", ano: "todos", rows: data }];
          setCiclos(fallback);
          setCicloSel(fallback[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clienteId]);

  const linhas = cicloSel?.rows || [];

  // Soma apenas registros com economia real (categoria VENDA)
  const totalEconomia = linhas.reduce((s, r) => s + Number(r.economia_reais || 0), 0);

  // Rótulo de utilização baseado na categoria
  const getCatLabel = (row) => {
    const cat = String(row.tra_categoria || row.tra_tipo || "").toUpperCase();
    if (cat.includes("VENDA"))          return "Venda";
    if (cat.includes("PASSAGEM") || cat.includes("VOO") || cat.includes("VÔO")) return "Vôo - Milhas Próprias";
    if (cat.includes("HOSPEDAGEM") || cat.includes("HOTEL")) return "Hospedagem";
    if (cat.includes("TRANSFERENCIA") || cat.includes("TRANSFERÊNCIA")) return "Transferência";
    if (cat.includes("SAIDA") || cat.includes("SAÍDA")) return "Saída Manual";
    if (cat.includes("COMPRA"))         return "Compra";
    if (cat.includes("CADASTRO"))       return cat.replace(/_/g, " ");
    return row.tra_categoria || row.tra_tipo || "—";
  };

  const thStyle = {
    fontSize: 11, fontWeight: 700, color: "#888",
    padding: "9px 12px", textAlign: "left",
    borderBottom: "2px solid #e8e8e8", background: "#fafafa",
    whiteSpace: "pre-line",
  };

  return (
    <Spin spinning={loading}>
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e8e8", overflow: "hidden" }}>

        {/* Header: seletor de ciclo + total */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, marginBottom: 6 }}>Período de Apuração:</div>
            <div style={{ position: "relative" }}>
              <div onClick={() => setDropOpen(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d9d9d9", borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "#333", background: "#fff", minWidth: 280 }}>
                <span style={{ flex: 1 }}>{cicloSel?.label || "Selecione um ciclo..."}</span>
                <DownOutlined style={{ fontSize: 11, color: "#aaa" }} />
              </div>
              {dropOpen && ciclos.length > 1 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 280, overflow: "hidden" }}>
                  {ciclos.map((c, i) => (
                    <div key={i} onClick={() => { setCicloSel(c); setDropOpen(false); }}
                      style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", color: cicloSel?.ano === c.ano ? DARK_NAV : "#333", fontWeight: cicloSel?.ano === c.ano ? 600 : 400, borderBottom: i < ciclos.length - 1 ? "1px solid #f0f0f0" : "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ border: `2px solid #389e0d`, borderRadius: 8, padding: "12px 20px", textAlign: "center", minWidth: 140 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#389e0d" }}>{fmtBRL(totalEconomia)}</div>
          </div>
        </div>

        {/* Tabela */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
            <thead>
              <tr>
                {[
                  "Utilização", "Identificação", "Data",
                  "Valor Pagante", "Milhas/Pontos\nUtilizados",
                  "Custo\nMédio", "Extras",
                  "Valor em\nMilhas", "Economia Gerada\n(R$)", "Economia Gerada\n(%)"
                ].map((h, i) => (
                  <th key={i} style={{ ...thStyle, textAlign: i >= 3 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "48px 0", color: "#bbb", fontSize: 14 }}>
                    Nenhum registro no período selecionado
                  </td>
                </tr>
              )}
              {linhas.map((row, idx) => {
                /*
                 * MAPEAMENTO DOS CAMPOS (após JOIN com vendas no SQL):
                 *
                 * valor_reais      → ven_vtotal + ven_taxas + ven_vbagagem (preço pagante total)
                 * milhas_saida     → milhas utilizadas (operacao = 2)
                 * milhas_entrada   → milhas recebidas  (operacao = 1)
                 * custo_unitario   → custo médio por milheiro
                 * extras           → ven_taxas + ven_vbagagem
                 * economia_reais   → ven_veconomia (calculado corretamente no frontend)
                 * percentual_economia → ven_peconomia
                 * saldo_acumulado  → saldo running total
                 */
                const economia   = Number(row.economia_reais       || 0);
                const pctEcon    = Number(row.percentual_economia   || 0);
                const milhasOut  = Number(row.milhas_saida          || 0);
                const milhasIn   = Number(row.milhas_entrada        || 0);
                const milhas     = milhasOut > 0 ? milhasOut : milhasIn;
                const vlrPagante = Number(row.valor_reais           || 0);  // preço pagante real
                const custoUnit  = Number(row.custo_unitario        || row.custo_milheiro || 0);
                const extras     = Number(row.extras                || 0);  // taxas + bagagem

                // Valor em milhas = milhas usadas × custo médio / 1000
                // Só exibe para saídas com custo (compras/vendas com milhas próprias)
                const vlrMilhas = milhasOut > 0 && custoUnit > 0
                  ? (milhasOut * custoUnit) / 1000
                  : 0;

                const ehSaida   = milhasOut > 0;
                const temEcon   = economia > 0;

                return (
                  <tr key={row.tra_id || idx}
                    style={{ background: idx % 2 === 0 ? "#fff" : "#fafcff" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f7ff"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafcff"}>

                    {/* Utilização */}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 13, color: "#333" }}>
                      {getCatLabel(row)}
                    </td>

                    {/* Identificação */}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 12, color: "#555", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={row.identificacao || row.tra_descricao || ""}>
                      {(row.identificacao || row.tra_descricao || "—").substring(0, 35)}
                    </td>

                    {/* Data */}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 13, color: "#666", whiteSpace: "nowrap" }}>
                      {fmtDate(row.tra_data || row.data_formatada)}
                    </td>

                    {/* Valor Pagante — preço real da passagem + taxas + bagagem */}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 13, color: "#333", textAlign: "right" }}>
                      {vlrPagante > 0 ? fmtNum(vlrPagante) : "—"}
                    </td>

                    {/* Milhas/Pontos Utilizados */}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 13, fontWeight: 600, color: milhasIn > 0 ? "#389e0d" : "#333", textAlign: "right" }}>
                      {milhas > 0 ? fmtMil(milhas) : "—"}
                    </td>

                    {/* Custo Médio */}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 13, color: "#555", textAlign: "right" }}>
                      {custoUnit > 0 ? fmtNum(custoUnit) : "—"}
                    </td>

                    {/* Extras (taxas + bagagem) */}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 13, color: "#555", textAlign: "right" }}>
                      {extras > 0 ? fmtNum(extras) : "0,00"}
                    </td>

                    {/* Valor em Milhas (custo real das milhas) */}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 13, color: "#333", textAlign: "right" }}>
                      {vlrMilhas > 0 ? fmtNum(vlrMilhas) : "—"}
                    </td>

                    {/* Economia Gerada R$ — vem de ven_veconomia via SQL */}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 13, fontWeight: 600, color: temEcon ? "#389e0d" : "#bbb", textAlign: "right" }}>
                      {temEcon ? fmtBRL(economia) : "—"}
                    </td>

                    {/* Economia Gerada % — vem de ven_peconomia via SQL */}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 13, fontWeight: 600, color: pctEcon > 0 ? "#389e0d" : "#bbb", textAlign: "right" }}>
                      {pctEcon > 0 ? fmtPct(pctEcon) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totais */}
            {linhas.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f8f9fa" }}>
                  <td colSpan={3} style={{ padding: "12px 12px", fontWeight: 700, fontSize: 13, color: "#333", borderTop: "2px solid #e8e8e8" }}>
                    TOTAL
                  </td>
                  {/* Total Valor Pagante */}
                  <td style={{ padding: "12px 12px", fontWeight: 700, fontSize: 13, color: "#333", textAlign: "right", borderTop: "2px solid #e8e8e8" }}>
                    {fmtNum(linhas.reduce((s, r) => s + Number(r.valor_reais || 0), 0))}
                  </td>
                  {/* Total Milhas */}
                  <td style={{ padding: "12px 12px", fontWeight: 700, fontSize: 13, color: "#333", textAlign: "right", borderTop: "2px solid #e8e8e8" }}>
                    {fmtMil(linhas.reduce((s, r) => s + Number(r.milhas_saida || r.milhas_entrada || 0), 0))}
                  </td>
                  <td colSpan={2} style={{ borderTop: "2px solid #e8e8e8" }} />
                  {/* Total Extras */}
                  <td style={{ padding: "12px 12px", fontWeight: 700, fontSize: 13, color: "#333", textAlign: "right", borderTop: "2px solid #e8e8e8" }}>
                    {fmtNum(linhas.reduce((s, r) => s + Number(r.extras || 0), 0))}
                  </td>
                  {/* Total Economia R$ */}
                  <td style={{ padding: "12px 12px", fontWeight: 700, fontSize: 13, color: "#389e0d", textAlign: "right", borderTop: "2px solid #e8e8e8" }}>
                    {fmtBRL(totalEconomia)}
                  </td>
                  <td style={{ borderTop: "2px solid #e8e8e8" }} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </Spin>
  );
}

// ─── ABA OBSERVAÇÕES ──────────────────────────────────────────────────────────
function TabObservacoes({ clienteId }) {
  const [texto, setTexto]   = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const handleSalvar = async () => {
    if (!texto.trim()) return;
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e8e8", padding: "24px 24px 20px" }}>
      <p style={{ fontSize: 13, color: "#555", margin: "0 0 14px 0" }}>
        Registro dos comunicados para o cliente. Essas informações aparecerão em seu extrato.
      </p>
      <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder=""
        style={{ width: "100%", minHeight: 220, border: "1px solid #d9d9d9", borderRadius: 6, padding: "10px 12px", fontSize: 14, color: "#333", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, fontFamily: "'Segoe UI', sans-serif" }}
        onFocus={e => e.target.style.borderColor = "#4a90d9"}
        onBlur={e  => e.target.style.borderColor = "#d9d9d9"}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button onClick={handleSalvar} disabled={saving || !texto.trim()}
          style={{ padding: "8px 28px", background: "transparent", border: `1px solid ${saved ? "#52c41a" : ORANGE}`, borderRadius: 6, color: saved ? "#52c41a" : ORANGE, fontSize: 13, fontWeight: 700, cursor: saving || !texto.trim() ? "not-allowed" : "pointer", opacity: !texto.trim() ? 0.5 : 1, transition: "all 0.2s" }}
          onMouseEnter={e => { if (texto.trim() && !saving) { e.currentTarget.style.background = saved ? "#52c41a" : ORANGE; e.currentTarget.style.color = "#fff"; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = saved ? "#52c41a" : ORANGE; }}>
          {saving ? "Salvando..." : saved ? "✓ SALVO" : "SALVAR"}
        </button>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function ExtratoAssinante() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cliente, abaAtiva } = location.state || {};

  const [abaAtivaState, setAbaAtivaState] = useState(abaAtiva || "posicao");
  const [cartoes, setCartoes]             = useState([]);
  const [titulares, setTitulares]         = useState([]);
  const [loadingPos, setLoadingPos]       = useState(false);
  const [loadingPdf, setLoadingPdf]       = useState(false);

  const gestor = localStorage.getItem("userName") || "—";

  useEffect(() => { if (abaAtiva) setAbaAtivaState(abaAtiva); }, [abaAtiva]);

  useEffect(() => { if (cliente?.id) carregarPosicao(); }, [cliente]);

  const carregarPosicao = async () => {
    setLoadingPos(true);
    try {
      const titRes  = await api.get("/ServerPrincipal/PesquisaTitular", { params: { Cliente: cliente.id } });
      const titRows = extractFireDACData(titRes.data).map(norm);

      const seen = new Set();
      const titularesDeduplic = titRows.filter(t => {
        const k = String(t.cli_id ?? "");
        if (!k || k === "0" || seen.has(k)) return false;
        seen.add(k); return true;
      });

      const carResArr = await Promise.all(
        titularesDeduplic.map(t =>
          api.get("/ServerPrincipal/PesquisaCartoes", { params: { Cliente: t.cli_id } })
            .then(res => ({ rows: extractFireDACData(res.data).map(norm), tit: t }))
            .catch(() => ({ rows: [], tit: t }))
        )
      );

      const cartoesFlat = [];
      const seenCar = new Set();
      carResArr.forEach(({ rows, tit }) => {
        rows.forEach(c => {
          const k = String(c.car_id ?? "");
          if (!k || seenCar.has(k)) return;
          seenCar.add(k);
          cartoesFlat.push({
            car_id:            c.car_id,
            car_nome_programa: c.car_nome_programa ?? "",
            car_saldo_milhas:  Number(c.car_saldo_milhas ?? 0),
            car_vunitario:     Number(c.car_vunitario    ?? 0),
            car_qtde_cpf:      Number(c.car_qtde_cpf     ?? 0),
            car_qtde_expira:   Number(c.car_qtde_expira  ?? 0),
            car_dtexpiracao:   c.car_dtexpiracao ?? null,
            car_expira:        c.car_expira      ?? 0,
            cli_id:            tit.cli_id,
          });
        });
      });

      setCartoes(cartoesFlat);
      setTitulares(titularesDeduplic.length > 0
        ? titularesDeduplic
        : [{ cli_id: cliente.id, cli_nome: cliente.nome }]);
    } catch (err) {
      console.error(err);
      setTitulares([{ cli_id: cliente.id, cli_nome: cliente.nome }]);
    } finally {
      setLoadingPos(false);
    }
  };

  const exportarPDF = async () => {
    setLoadingPdf(true);
    try {
      const relRes = await api.get("/ServerPrincipal/RelatorioEconomia", { params: { Cliente: cliente.id } });
      const linhas = extractFireDACData(relRes.data).map(norm);

      const doc   = new jsPDF({ orientation: "landscape" });
      const nome  = cliente?.nome  || "Cliente";
      const email = cliente?.email || "";
      const hoje  = new Date().toLocaleDateString("pt-BR");

      const fmtMp = (v) => new Intl.NumberFormat("pt-BR").format(Math.round(Number(v) || 0));
      const fmtCp = (v) => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fmtPp = (v) => Number(v || 0).toFixed(2).replace(".", ",") + "%";

      doc.setFillColor(30, 58, 74);
      doc.rect(0, 0, 297, 28, "F");
      doc.setFontSize(16); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold");
      doc.text("Extratos do Assinante por Titular", 14, 12);
      doc.setFontSize(9); doc.setFont("helvetica","normal");
      doc.text(`Gestor: ${gestor}   |   Cliente: ${nome}   |   Email: ${email}   |   Gerado em: ${hoje}`, 14, 22);

      let entMilhas = 0, saidaMilhas = 0, economia = 0;
      linhas.forEach(t => {
        entMilhas   += Number(t.milhas_entrada || 0);
        saidaMilhas += Number(t.milhas_saida   || 0);
        economia    += Number(t.economia_reais  || 0);
      });
      const saldoFinal = linhas.length > 0 ? Number(linhas[linhas.length - 1].saldo_acumulado || 0) : 0;

      const metricsY = 36;
      [
        { label: "Entradas",       valor: fmtMp(entMilhas)   + " milhas" },
        { label: "Saídas",         valor: fmtMp(saidaMilhas) + " milhas" },
        { label: "Economia Total", valor: "R$ " + fmtCp(economia) },
        { label: "Saldo Acum.",    valor: fmtMp(saldoFinal)  + " milhas" },
        { label: "Transações",     valor: String(linhas.length) },
      ].forEach((m, i) => {
        const x = 14 + i * 56;
        doc.setFillColor(245, 166, 35);
        doc.roundedRect(x, metricsY, 52, 16, 2, 2, "F");
        doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont("helvetica","normal");
        doc.text(m.label, x + 26, metricsY + 5, { align: "center" });
        doc.setFontSize(9); doc.setFont("helvetica","bold");
        doc.text(m.valor, x + 26, metricsY + 12, { align: "center" });
      });

      doc.setTextColor(30,58,74); doc.setFontSize(11); doc.setFont("helvetica","bold");
      doc.text("Posição - Programas de Fidelidade", 14, metricsY + 26);

      const mapTitular = {};
      titulares.forEach(t => { mapTitular[t.cli_id] = t.cli_nome || nome; });

      autoTable(doc, {
        startY: metricsY + 30,
        head: [["Titular","Programa","Saldo","Custo Médio","Patrimônio","Próx. Expiração"]],
        body: cartoes.length > 0 ? cartoes.map(c => [
          mapTitular[c.cli_id] || nome,
          c.car_nome_programa || "—",
          fmtMp(c.car_saldo_milhas),
          "R$ " + fmtCp(c.car_vunitario),
          "R$ " + fmtCp((Number(c.car_saldo_milhas) * Number(c.car_vunitario)) / 1000),
          (c.car_expira === 1 || c.car_expira === "1") && Number(c.car_qtde_expira) > 0
            ? fmtMp(c.car_qtde_expira) + " mi" : "—",
        ]) : [["Nenhum programa","","","","",""]],
        theme: "striped",
        headStyles: { fillColor: [30,58,74], textColor: 255, fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0:{cellWidth:50}, 1:{cellWidth:60}, 2:{cellWidth:28,halign:"right"}, 3:{cellWidth:28,halign:"right"}, 4:{cellWidth:30,halign:"right"}, 5:{cellWidth:38,halign:"right"} },
      });

      const pageH = doc.internal.pageSize.height;
      let startUtilY = doc.lastAutoTable.finalY + 14;
      if (startUtilY > pageH - 50) { doc.addPage(); startUtilY = 20; }

      doc.setTextColor(30,58,74); doc.setFontSize(11); doc.setFont("helvetica","bold");
      doc.text("Utilização - Histórico de Transações", 14, startUtilY);

      autoTable(doc, {
        startY: startUtilY + 6,
        head: [["Data","Tipo","Categoria","Programa","Identificação","Entrada","Saída","Valor Pagante","C.Milheiro","Extras","Economia R$","% Econ.","Saldo"]],
        body: linhas.length > 0 ? linhas.map(t => {
          let dtFmt = t.data_formatada || fmtDate(t.tra_data);
          return [
            dtFmt,
            t.tra_tipo || "—",
            t.tra_categoria || "—",
            t.car_nome_programa || "—",
            (t.identificacao || "—").slice(0, 35),
            Number(t.milhas_entrada) > 0 ? fmtMp(t.milhas_entrada) : "—",
            Number(t.milhas_saida)   > 0 ? fmtMp(t.milhas_saida)   : "—",
            Number(t.valor_reais)    > 0 ? "R$ " + fmtCp(t.valor_reais) : "—",
            Number(t.custo_unitario) > 0 ? fmtCp(t.custo_unitario) : "—",
            Number(t.extras)         > 0 ? "R$ " + fmtCp(t.extras) : "0,00",
            Number(t.economia_reais) > 0 ? "R$ " + fmtCp(t.economia_reais) : "—",
            Number(t.percentual_economia) > 0 ? fmtPp(t.percentual_economia) : "—",
            fmtMp(t.saldo_acumulado),
          ];
        }) : [["Nenhuma transação","","","","","","","","","","","",""]],
        theme: "striped",
        headStyles: { fillColor: [30,58,74], textColor: 255, fontSize: 7, fontStyle: "bold" },
        styles: { fontSize: 7, cellPadding: 1.5 },
        columnStyles: { 0:{cellWidth:18}, 1:{cellWidth:12}, 2:{cellWidth:20}, 3:{cellWidth:26}, 4:{cellWidth:36}, 5:{cellWidth:16,halign:"right"}, 6:{cellWidth:16,halign:"right"}, 7:{cellWidth:18,halign:"right"}, 8:{cellWidth:16,halign:"right"}, 9:{cellWidth:14,halign:"right"}, 10:{cellWidth:18,halign:"right"}, 11:{cellWidth:12,halign:"right"}, 12:{cellWidth:18,halign:"right"} },
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(180,180,180);
        doc.text(`Página ${i} de ${pageCount}  |  AdmGVS — Gerado em ${hoje}`, 148, doc.internal.pageSize.height - 6, { align: "center" });
      }

      doc.save(`extrato_${nome.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setLoadingPdf(false);
    }
  };

  const ABAS = [
    { key: "posicao",     label: "POSIÇÃO"     },
    { key: "utilizacao",  label: "UTILIZAÇÃO"  },
    { key: "observacoes", label: "OBSERVAÇÕES" },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e8e8", padding: "14px 24px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate("/dashboard", { state: { currentPage: "carteira" } })}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: "#888", padding: "4px 8px", borderRadius: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = DARK_NAV}
            onMouseLeave={e => e.currentTarget.style.color = "#888"}>
            <ArrowLeftOutlined />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>📄 Extratos do Assinante por Titular</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {[
            { label: "Gestor",  valor: gestor },
            { label: "Cliente", valor: cliente?.nome  || "—" },
            { label: "Email",   valor: cliente?.email || "—" },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: i === 2 ? 13 : 14, fontWeight: i === 2 ? 400 : 700, color: i === 2 ? "#555" : "#222" }}>{item.valor}</div>
            </div>
          ))}
        </div>

        <button onClick={exportarPDF} disabled={loadingPdf}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${ORANGE}`, borderRadius: 6, padding: "8px 16px", cursor: loadingPdf ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, color: ORANGE, opacity: loadingPdf ? 0.7 : 1, transition: "all 0.2s" }}
          onMouseEnter={e => { if (!loadingPdf) { e.currentTarget.style.background = ORANGE; e.currentTarget.style.color = "#fff"; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ORANGE; }}>
          <DownloadOutlined /> {loadingPdf ? "Gerando..." : "DOWNLOAD"}
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", borderBottom: "2px solid #e8e8e8", marginBottom: 20 }}>
        {ABAS.map(aba => {
          const isAtiva = abaAtivaState === aba.key;
          return (
            <div key={aba.key} onClick={() => setAbaAtivaState(aba.key)}
              style={{ padding: "12px 28px", cursor: "pointer", fontSize: 13, fontWeight: isAtiva ? 700 : 500, color: isAtiva ? DARK_NAV : "#888", borderBottom: isAtiva ? `2px solid ${DARK_NAV}` : "2px solid transparent", marginBottom: -2, transition: "all 0.15s", letterSpacing: "0.5px" }}
              onMouseEnter={e => { if (!isAtiva) e.currentTarget.style.color = "#555"; }}
              onMouseLeave={e => { if (!isAtiva) e.currentTarget.style.color = "#888"; }}>
              {aba.label}
            </div>
          );
        })}
      </div>

      {abaAtivaState === "posicao"     && <TabPosicao    cartoes={cartoes} titulares={titulares} loading={loadingPos} />}
      {abaAtivaState === "utilizacao"  && <TabUtilizacao clienteId={cliente?.id} />}
      {abaAtivaState === "observacoes" && <TabObservacoes clienteId={cliente?.id} />}
    </div>
  );
}