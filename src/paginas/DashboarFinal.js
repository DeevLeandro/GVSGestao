import React, { useState, useEffect } from "react";
import { Select, Spin, message } from "antd";
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

// ── Logos reais dos programas ──────────────────────────────────────────
const LOGOS_MAP = [
  { keys: ["livelo"],                        bg: "#e80097", letra: "LV"  },
  { keys: ["itaú pontos","itau pontos"],      bg: "#003087", letra: "IT"  },
  { keys: ["smiles"],                        bg: "#ff6600", letra: "S"   },
  { keys: ["azul"],                          bg: "#003087", letra: "A"   },
  { keys: ["coopera pj"],                    bg: "#007b5e", letra: "CPJ" },
  { keys: ["coopera"],                       bg: "#007b5e", letra: "COO" },
  { keys: ["latam"],                         bg: "#e31837", letra: "L"   },
  { keys: ["tap"],                           bg: "#009900", letra: "TAP" },
  { keys: ["max milhas"],                    bg: "#1e3a6e", letra: "MM"  },
  { keys: ["hotmilhas"],                     bg: "#cc3300", letra: "HM"  },
  { keys: ["ipiranga"],                      bg: "#f5a800", letra: "IP"  },
  { keys: ["esfera empresas"],               bg: "#8b0000", letra: "EE"  },
  { keys: ["esfera"],                        bg: "#8b0000", letra: "E_"  },
  { keys: ["bank milhas"],                   bg: "#0066cc", letra: "BM"  },
  { keys: ["cash milhas"],                   bg: "#5a5a5a", letra: "CM"  },
  { keys: ["curtaí","curtai"],               bg: "#e8a000", letra: "CT"  },
  { keys: ["compro suas milhas"],            bg: "#1e3a4a", letra: "CSM" },
  { keys: ["átomos","atomos"],               bg: "#444",    letra: "ÁT"  },
  { keys: ["gpa"],                           bg: "#00aa44", letra: "GPA" },
  { keys: ["pontos caixa"],                  bg: "#007b5e", letra: "PC"  },
  { keys: ["caixa empresas"],                bg: "#007b5e", letra: "CE"  },
  { keys: ["sicredi empresarial"],           bg: "#009900", letra: "SCE" },
  { keys: ["sicredi"],                       bg: "#009900", letra: "SC"  },
  { keys: ["dotz"],                          bg: "#ff6600", letra: "DZ"  },
  { keys: ["porto plus"],                    bg: "#0057a8", letra: "PP"  },
  { keys: ["inter loop"],                    bg: "#ff6b00", letra: "IL"  },
  { keys: ["inter empresas"],                bg: "#ff6b00", letra: "IE"  },
  { keys: ["volare"],                        bg: "#c8102e", letra: "VL"  },
  { keys: ["membership","amex"],             bg: "#006fcf", letra: "MR"  },
  { keys: ["safra"],                         bg: "#003366", letra: "SR"  },
  { keys: ["suma"],                          bg: "#1e3a4a", letra: "SU"  },
  { keys: ["cressol"],                       bg: "#007b5e", letra: "CR"  },
  { keys: ["banrisul"],                      bg: "#003087", letra: "BR"  },
  { keys: ["unicred"],                       bg: "#009900", letra: "UC"  },
  { keys: ["milhas plus"],                   bg: "#e8a000", letra: "M+"  },
  { keys: ["xp pontos"],                     bg: "#1a1a2e", letra: "XP"  },
  { keys: ["nubank"],                        bg: "#820ad1", letra: "NU"  },
  { keys: ["ailos"],                         bg: "#007b5e", letra: "AI"  },
  { keys: ["banestes"],                      bg: "#003087", letra: "BN"  },
  { keys: ["bb empresas"],                   bg: "#f5a800", letra: "BB"  },
  { keys: ["itaú empresas","itau empresas"], bg: "#003087", letra: "ITE" },
  { keys: ["pontos btg"],                    bg: "#1a1a2e", letra: "BTG" },
  { keys: ["iberia"],                        bg: "#cc0000", letra: "IB"  },
  { keys: ["mileageplus","united"],          bg: "#002244", letra: "UA"  },
  { keys: ["all accor","accor"],             bg: "#c8102e", letra: "AL"  },
  { keys: ["ihg"],                           bg: "#6a0dad", letra: "IHG" },
  { keys: ["aadvantage","american"],         bg: "#0078d2", letra: "AA"  },
  { keys: ["flying blue"],                   bg: "#003087", letra: "FB"  },
  { keys: ["british"],                       bg: "#2b4090", letra: "BA"  },
  { keys: ["qatar"],                         bg: "#5c0632", letra: "QR"  },
  { keys: ["aeroplan"],                      bg: "#c8102e", letra: "AP"  },
  { keys: ["copa","connectmiles"],           bg: "#0033a0", letra: "CM"  },
  { keys: ["delta"],                         bg: "#c8102e", letra: "DL"  },
  { keys: ["emirates"],                      bg: "#c8102e", letra: "EK"  },
  { keys: ["virgin","flying club"],          bg: "#e8003d", letra: "VS"  },
  { keys: ["finnair"],                       bg: "#003580", letra: "AY"  },
  { keys: ["wyndham"],                       bg: "#003087", letra: "WY"  },
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
      fontSize: size * 0.32, fontWeight: 700, flexShrink: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
    }}>{letra}</span>
  );
};

// ── Formatação ─────────────────────────────────────────────────────────
const fmtNum = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtInt = (v) =>
  Number(v || 0).toLocaleString("pt-BR");

const fmtDate = (v) => {
  if (!v) return null;
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const compT = s.match(/^(\d{4})(\d{2})(\d{2})T/);
  if (compT) return `${compT[3]}/${compT[2]}/${compT[1]}`;
  const comp = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (comp) return `${comp[3]}/${comp[2]}/${comp[1]}`;
  if (s.match(/^\d{2}\/\d{2}\/\d{4}/)) return s.slice(0, 10);
  return s;
};

// ── Calcula stats a partir do RelatorioEconomia ───────────────────────
const calcStats = (relatorio) => {
  const now      = new Date();
  const mesAtual = now.getMonth();
  const anoAtual = now.getFullYear();

  let milhasMes = 0, vendaMes = 0, milhasAno = 0, vendaAno = 0;

  relatorio.forEach((r) => {
    const entrada = Number(r.milhas_entrada  ?? r.MILHAS_ENTRADA  ?? 0);
    const saida   = Number(r.milhas_saida    ?? r.MILHAS_SAIDA    ?? 0);
    const valor   = Number(r.valor_reais     ?? r.VALOR_REAIS     ?? 0);
    const cat     = (r.tra_categoria         ?? r.TRA_CATEGORIA   ?? "").toUpperCase();
    const dataStr = r.tra_data               ?? r.TRA_DATA        ?? "";

    const isVenda = cat === "VENDA" || cat.includes("VENDA");
    const isMilha = cat !== "CADASTRO_PROGRAMA" && cat !== "EXCLUSAO_PROGRAMA";
    const qtde    = entrada > 0 ? entrada : saida;

    let d = null;
    try { d = dataStr ? new Date(dataStr) : null; } catch {}

    if (d && isMilha) {
      if (d.getFullYear() === anoAtual) {
        milhasAno += qtde;
        if (d.getMonth() === mesAtual) milhasMes += qtde;
      }
    }
    if (d && isVenda) {
      if (d.getFullYear() === anoAtual) {
        vendaAno += valor;
        if (d.getMonth() === mesAtual) vendaMes += valor;
      }
    }
  });

  return { milhasMes, vendaMes, milhasAno, vendaAno };
};

export default function Dashboard({ clienteId, onCompensarClick }) {
  const [loading, setLoading]         = useState(false);
  const [cartoes, setCartoes]         = useState([]);
  const [relatorio, setRelatorio]     = useState([]);
  const [compensas, setCompensas]     = useState([]);
  const [filtroTit, setFiltroTit]     = useState(null);
  const [filtroProg, setFiltroProg]   = useState(null);

  useEffect(() => {
    if (!clienteId) return;
    carregarTudo();
  }, [clienteId]);

  const carregarTudo = async () => {
    setLoading(true);
    try {
      // 1. Busca PesquisaTitular - isso retorna TODOS os titulares (principal + agregados)
      const titRes = await api.get("/ServerPrincipal/PesquisaTitular", { params: { Cliente: clienteId } });
      const titRows = extractRows(titRes.data);
      
      // 🔥 CORREÇÃO AQUI 🔥
      // PesquisaTitular já retorna todos os titulares (cliente principal + agregados)
      // Não precisamos adicionar manualmente o clienteId, pois ele já está na lista
      
      // Remove duplicatas pelo cli_id
      const seenTit = new Set();
      const titularesDeduplic = titRows.filter((t) => {
        const rawId = t.cli_id ?? t.CLI_ID;
        const k = rawId != null ? String(rawId) : null;
        if (!k || k === "0" || seenTit.has(k)) return false;
        seenTit.add(k);
        return true;
      });
      
      console.log("Titulares encontrados:", titularesDeduplic.length);
      console.log("IDs dos titulares:", titularesDeduplic.map(t => t.cli_id ?? t.CLI_ID));
      
      // Se não encontrou nenhum titular, tenta buscar só o principal
      let titularesParaBuscar = titularesDeduplic;
      if (titularesDeduplic.length === 0) {
        console.log("Nenhum titular encontrado, buscando apenas o principal");
        titularesParaBuscar = [{ cli_id: clienteId, cli_nome: "", cli_email: "", cli_cpf: "" }];
      }
      
      // 2. Busca PesquisaCartoes para CADA titular em paralelo
      const carResArr = await Promise.all(
        titularesParaBuscar.map((t) => {
          const cliId = t.cli_id ?? t.CLI_ID;
          console.log(`Buscando cartões para titular ID: ${cliId}`);
          return api.get("/ServerPrincipal/PesquisaCartoes", { params: { Cliente: cliId } })
            .then((res) => ({ rows: extractRows(res.data), tit: t }))
            .catch((err) => {
              console.error(`Erro ao buscar cartões para titular ${cliId}:`, err);
              return { rows: [], tit: t };
            });
        })
      );
      
      // 3. Busca RelatorioEconomia e PesquisaCompensa
      const [traRes, compRes] = await Promise.all([
        api.get("/ServerPrincipal/RelatorioEconomia", { params: { Cliente: clienteId } }).catch(() => ({ data: [] })),
        api.get("/ServerPrincipal/PesquisaCompensa",  { params: { Cliente: clienteId } }).catch(() => ({ data: [] })),
      ]);
      
      // 4. Monta lista flat de cartões sem duplicatas
      const cartoesFlat = [];
      const seenCar = new Set();
      
      carResArr.forEach(({ rows, tit }) => {
        console.log(`Titular ${tit.cli_nome ?? tit.CLI_Nome ?? "?"} tem ${rows.length} cartões`);
        
        rows.forEach((c) => {
          const carKey = String(c.car_id ?? c.CAR_ID ?? "");
          if (!carKey || seenCar.has(carKey)) return;
          seenCar.add(carKey);
          
          cartoesFlat.push({
            car_id:            c.car_id            ?? c.CAR_ID,
            car_nome_programa: c.car_nome_programa  ?? c.CAR_NOME_PROGRAMA ?? "",
            car_saldo_milhas:  Number(c.car_saldo_milhas   ?? c.CAR_SALDO_MILHAS  ?? 0),
            car_vunitario:     Number(c.car_vunitario      ?? c.CAR_VUNITARIO     ?? 0),
            car_qtde_cpf:      Number(c.car_qtde_cpf       ?? c.CAR_QTDE_CPF      ?? 0),
            car_qtde_expira:   Number(c.car_qtde_expira    ?? c.CAR_QTDE_EXPIRA   ?? 0),
            car_dtexpiracao:   c.car_dtexpiracao    ?? c.CAR_DTEXPIRACAO   ?? null,
            car_expira:        Number(c.car_expira         ?? c.CAR_EXPIRA        ?? 0),
            cli_id:            tit.cli_id           ?? tit.CLI_ID,
            cli_nome:          tit.cli_nome         ?? tit.CLI_NOME        ?? "",
          });
        });
      });
      
      console.log("Total de cartões encontrados:", cartoesFlat.length);
      console.log("Cartões por titular:", cartoesFlat.reduce((acc, c) => {
        const nome = c.cli_nome || "Sem nome";
        acc[nome] = (acc[nome] || 0) + 1;
        return acc;
      }, {}));
      
      setCartoes(cartoesFlat);
      setRelatorio(extractRows(traRes.data));
      setCompensas(extractRows(compRes.data));
      
    } catch (e) {
      console.error("Erro ao carregar dashboard:", e);
      message.error("Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  };

  // ── Filtros ────────────────────────────────────────────────────────
  const titulares = [...new Set(cartoes.map((c) => c.cli_nome).filter(Boolean))];
  const progs     = [...new Set(cartoes.map((c) => c.car_nome_programa).filter(Boolean))];

  const cartoesFiltrados = cartoes.filter((c) => {
    const nome = c.cli_nome ?? "";
    const prog = c.car_nome_programa ?? "";
    return (!filtroTit || nome === filtroTit) && (!filtroProg || prog === filtroProg);
  });

  // ── Stats ──────────────────────────────────────────────────────────
  const { milhasMes, vendaMes, milhasAno, vendaAno } = calcStats(relatorio);

  // ── Estilos ────────────────────────────────────────────────────────
  const statCard = (bg, label, value, isMonetary = false) => (
    <div style={{
      background: bg, borderRadius: 8, padding: "18px 20px",
      color: "#fff", flex: 1, minWidth: 160, textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginBottom: 8, lineHeight: 1.4, whiteSpace: "pre-line", fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>
        {isMonetary ? fmtNum(value) : fmtInt(value)}
      </div>
    </div>
  );

  // Barra de CPFs utilizados
  const CpfBar = ({ usado, total }) => {
    if (!total || total === 0) return <span style={{ color: "#bbb", fontSize: 12 }}>--</span>;
    const pct = Math.min(100, Math.round((usado / total) * 100));
    const cor = pct >= 80 ? "#f5222d" : pct >= 50 ? "#fa8c16" : "#52c41a";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 80 }}>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e8e8e8", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 4, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 11, color: "#555", whiteSpace: "nowrap", fontWeight: 600 }}>
          {usado}/{total}
        </span>
      </div>
    );
  };

  const th = {
    padding: "10px 14px", fontSize: 12, fontWeight: 600,
    color: "#777", textAlign: "left", borderBottom: "1px solid #e8e8e8",
    whiteSpace: "nowrap", background: "#fafafa",
  };
  const td = (align = "left") => ({
    padding: "13px 14px", fontSize: 13, color: "#333",
    borderBottom: "1px solid #f5f5f5", textAlign: align,
    whiteSpace: "nowrap",
  });

  return (
    <Spin spinning={loading}>
      <div style={{ padding: "24px 28px", minHeight: "100vh", background: "#f0f2f5" }}>

        {/* Título */}
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e", marginBottom: 20, letterSpacing: "-0.3px" }}>
          Dashboard
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Coluna principal */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Stats */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {statCard("#f5a623", "Milhas Negociadas\n(Mês Corrente)",  milhasMes,  false)}
              {statCard("#d97706", "Total de Venda\n(Mês Corrente)",     vendaMes,   true)}
              {statCard("#b45309", "Milhas Negociadas\n(Geral Ano)",     milhasAno,  false)}
              {statCard("#92400e", "Total de Venda\n(Geral Ano)",        vendaAno,   true)}
            </div>

            {/* Filtros */}
            <div style={{
              background: "#0e1519", borderRadius: "8px 8px 0 0",
              padding: "16px 20px", display: "flex", gap: 16, flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6, fontWeight: 500 }}>
                  Filtrar por Titular de Conta
                </div>
                <Select style={{ width: "100%" }} placeholder="Todos os titulares"
                  allowClear onChange={setFiltroTit} value={filtroTit}
                >
                  {titulares.map((t) => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6, fontWeight: 500 }}>
                  Filtrar por Programa de Fidelidade
                </div>
                <Select style={{ width: "100%" }} placeholder="Todos programas"
                  allowClear onChange={setFiltroProg} value={filtroProg}
                  optionLabelProp="label"
                >
                  {progs.map((p) => (
                    <Option key={p} value={p} label={p}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <LogoCircle nome={p} size={20} />
                        {p}
                      </span>
                    </Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Tabela de cartões */}
            <div style={{
              background: "#fff", borderRadius: "0 0 8px 8px",
              border: "1px solid #e8e8e8", borderTop: "none",
              overflow: "auto",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={th}>Titular de Conta ↕</th>
                    <th style={th}>Programa</th>
                    <th style={{ ...th, textAlign: "right" }}>Saldo Disp.</th>
                    <th style={{ ...th, textAlign: "right" }}>Saldo Comp.</th>
                    <th style={{ ...th, textAlign: "right" }}>Custo Médio</th>
                    <th style={th}>Próx. Lote a Expirar</th>
                    <th style={th}>CPFs Utilizados</th>
                  </tr>
                </thead>
                <tbody>
                  {cartoesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", color: "#bbb", fontSize: 13 }}>
                        {loading ? "Carregando..." : "Nenhum dado encontrado"}
                      </td>
                    </tr>
                  ) : (
                    cartoesFiltrados.map((c, i) => {
                      const nomeCompleto = c.cli_nome ?? "";
                      const nome      = nomeCompleto ? nomeCompleto.split(" ")[0] : "—";
                      const prog      = c.car_nome_programa ?? "—";
                      const saldo     = Number(c.car_saldo_milhas ?? 0);
                      const custo     = Number(c.car_vunitario ?? 0);
                      const qtdeExp   = Number(c.car_qtde_expira ?? 0);
                      const dataExp   = fmtDate(c.car_dtexpiracao ?? "");
                      const expira    = Number(c.car_expira ?? 0);
                      const qtdeCpf   = Number(c.car_qtde_cpf ?? 0);
                      const cpfUsado  = 0;

                      const proxLote = expira === 1 && qtdeExp > 0 && dataExp
                        ? `${fmtInt(qtdeExp)} em ${dataExp}`
                        : "---";

                      return (
                        <tr key={c.car_id ?? i}
                          style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={td()}>
                            <span style={{ fontWeight: 500, color: "#222" }}>{nome}</span>
                          </td>
                          <td style={td()}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <LogoCircle nome={prog} size={24} />
                              <span>{prog}</span>
                            </span>
                          </td>
                          <td style={{ ...td("right"), fontWeight: 600, color: saldo > 0 ? "#222" : "#bbb" }}>
                            {saldo > 0 ? fmtInt(saldo) : "---"}
                          </td>
                          <td style={{ ...td("right"), color: "#bbb" }}>---</td>
                          <td style={{ ...td("right"), color: custo > 0 ? "#333" : "#bbb" }}>
                            {custo > 0 ? `R$ ${fmtNum(custo)}` : "---"}
                          </td>
                          <td style={{ ...td(), color: proxLote === "---" ? "#bbb" : "#333" }}>
                            {proxLote}
                          </td>
                          <td style={td()}>
                            <CpfBar usado={cpfUsado} total={qtdeCpf} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coluna lateral */}
          <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Próximos Recebimentos */}
            <div style={{
              background: "#8b1a1a", borderRadius: 8,
              padding: "16px", color: "#fff", textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}>
              <div style={{ fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Próximos Recebimentos</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 10 }}>0,00</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 12 }}>
                Não há pendências!
              </div>
              <button style={{
                width: "100%", background: "transparent",
                border: "1px solid rgba(255,255,255,0.45)", color: "#fff",
                borderRadius: 4, padding: "6px 0", fontSize: 11,
                fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em",
              }}>
                OUTROS RECEBIMENTOS
              </button>
            </div>

            {/* Pendências da Semana — Compensações */}
            <div style={{
              background: "#6b1520", borderRadius: 8,
              padding: "16px", color: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              maxHeight: 420, display: "flex", flexDirection: "column",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
                Pendências da Semana
              </div>

              {compensas.length === 0 ? (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: 12 }}>
                  Não há pendências!
                </div>
              ) : (
                <div style={{ overflowY: "auto", flex: 1, marginBottom: 10 }}>
                  {compensas.map((c, i) => {
                    const nome     = c.cli_nome          ?? c.CLI_NOME          ?? "";
                    const prog     = c.car_nome_programa ?? c.CAR_NOME_PROGRAMA ?? "";
                    const pontos   = Number(c.clu_pontos       ?? c.CLU_PONTOS       ?? 0);
                    const mensal   = Number(c.clu_vmensalidade ?? c.CLU_VMENSALIDADE ?? 0);
                    const venc     = fmtDate(c.clu_vencimento  ?? c.CLU_VENCIMENTO   ?? "");

                    let vencido = false;
                    try { vencido = c.clu_vencimento && new Date(c.clu_vencimento) < new Date(); } catch {}

                    return (
                      <div key={c.clu_id ?? i} style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: 6, padding: "10px 12px",
                        marginBottom: 8, borderLeft: `3px solid ${vencido ? "#ff4d4f" : "#f5a800"}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <LogoCircle nome={prog} size={18} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                            {nome.split(" ")[0]} — {prog}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                          <div>{fmtInt(pontos)} pontos</div>
                          <div>R$ {fmtNum(mensal)}/mês</div>
                          {venc && (
                            <div style={{ color: vencido ? "#ff7875" : "rgba(255,255,255,0.6)" }}>
                              Venc: {venc}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => onCompensarClick && onCompensarClick()}
                style={{
                  width: "100%", background: "transparent",
                  border: "1px solid rgba(255,255,255,0.45)", color: "#fff",
                  borderRadius: 4, padding: "6px 0", fontSize: 11,
                  fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em",
                }}>
                OUTRAS PENDÊNCIAS
              </button>
            </div>

          </div>
        </div>
      </div>
    </Spin>
  );
}