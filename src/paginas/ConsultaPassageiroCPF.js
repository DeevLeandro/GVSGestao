import React, { useState, useEffect } from "react";
import { Select, Checkbox, Table, Spin } from "antd";
import { TagOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";

const { Option } = Select;

// ── Helper FireDAC ──────────────────────────────────────────────────────
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

// ── Logos programas (lista completa) ────────────────────────────────────
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

const LogoCircle = ({ nome, size = 22 }) => {
  const { bg, letra } = getLogo(nome);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      background: bg, color: "#fff",
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
    }}>{letra}</span>
  );
};

// ── Acessa campo ignorando case ─────────────────────────────────────────
const fld = (obj, key) => {
  if (!obj) return undefined;
  if (obj[key] !== undefined) return obj[key];
  if (obj[key.toUpperCase()] !== undefined) return obj[key.toUpperCase()];
  return undefined;
};

export default function ConsultaPassageiroCPF({ clienteId: clienteIdProp }) {
  const [loading, setLoading]               = useState(false);
  const [passageiros, setPassageiros]       = useState([]);
  const [titulares, setTitulares]           = useState([]);
  const [cartoes, setCartoes]               = useState([]);
  const [programasUnicos, setProgramasUnicos] = useState([]);
  const [clienteId, setClienteId]           = useState(null);

  // Filtros
  const [filtroBusca, setFiltroBusca]       = useState(null);
  const [filtroTitular, setFiltroTitular]   = useState(null);
  const [filtroPrograma, setFiltroPrograma] = useState(null);
  const [soCpfsDisp, setSoCpfsDisp]         = useState(false);
  const [soSaldoDisp, setSoSaldoDisp]       = useState(false);
  const [soJaVoou, setSoJaVoou]             = useState(false);

  // ── Resolve clienteId ────────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    if (!id) {
      try { const u = JSON.parse(localStorage.getItem("user") || "{}"); id = u.cli_id || u.id; } catch (e) {}
      if (!id) id = parseInt(localStorage.getItem("userID") || "0") || null;
    }
    if (id) { setClienteId(id); carregarDados(id); }
  }, [clienteIdProp]);

  const carregarDados = async (id) => {
    setLoading(true);
    try {
      const [pagRes, titRes, carRes] = await Promise.all([
        api.get("/ServerPrincipal/PesquisaPassageiros", { params: { Cliente: id } }),
        api.get("/ServerPrincipal/PesquisaTitular",     { params: { Cliente: id } }),
        api.get("/ServerPrincipal/PesquisaCartoes",     { params: { Cliente: id } }),
      ]);
      setPassageiros(extractRows(pagRes.data));
      setTitulares(extractRows(titRes.data));
      const carRows = extractRows(carRes.data);
      setCartoes(carRows);
      const progs = [...new Set(carRows.map((c) => fld(c, "car_nome_programa")).filter(Boolean))];
      setProgramasUnicos(progs);
    } catch (e) {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  // ── Join PesquisaTitular + PesquisaCartoes pelo car_id ────────────────
  const linhas = React.useMemo(() => {
    const titPorCartao = {};
    titulares.forEach((t) => {
      const key = String(fld(t, "car_id") ?? "");
      if (key) titPorCartao[key] = t;
    });

    return cartoes.map((c) => {
      const carKey      = String(fld(c, "car_id") ?? "");
      const tit         = titPorCartao[carKey] || null;
      const nomeTitular = fld(tit, "cli_nome") || fld(c, "cli_nome") || "—";
      const saldo       = Number(fld(c, "car_saldo_milhas") ?? 0);
      const custoMedio  = Number(fld(c, "car_vunitario")    ?? 0);
      const cpfsLivres  = Number(fld(c, "car_qtde_cpf")     ?? 0);
      const programa    = fld(c, "car_nome_programa") || "—";

      // CPFs utilizados: join preciso pelo car_id (nova field pag_car_id do backend)
      // Soma pag_qtdeCpf de todos os passageiros que usaram ESTE cartão específico
      const cpfsUsados = passageiros
        .filter((p) => String(fld(p, "car_id") ?? fld(p, "CAR_ID") ?? "") === carKey)
        .reduce((acc, p) => acc + Number(fld(p, "pag_qtdecpf") ?? fld(p, "PAG_QTDECPF") ?? 0), 0);

      return {
        key:            carKey,
        car_id:         fld(c, "car_id"),
        nomeTitular,
        programa,
        saldo,
        custoMedio,
        cpfsLivres,
        cpfsUsados,
        ultimaEmissao:  null,
        jaVoou:         cpfsUsados > 0,
      };
    });
  }, [titulares, cartoes, passageiros]);

  // ── Passageiro selecionado na busca ───────────────────────────────────
  const nomePassageiroSel = React.useMemo(() => {
    if (!filtroBusca) return null;
    const pag = passageiros.find((p) => String(fld(p, "pag_id")) === filtroBusca);
    return pag ? String(fld(pag, "pag_nome") || "") : null;
  }, [filtroBusca, passageiros]);

  // ── Aplica filtros ────────────────────────────────────────────────────
  const linhasFiltradas = linhas.filter((l) => {
    if (nomePassageiroSel) {
      const primeiroNome = nomePassageiroSel.toLowerCase().split(" ")[0];
      if (!l.nomeTitular.toLowerCase().includes(primeiroNome)) return false;
    }
    if (filtroTitular  && l.nomeTitular !== filtroTitular)  return false;
    if (filtroPrograma && l.programa    !== filtroPrograma) return false;
    if (soCpfsDisp  && l.cpfsLivres <= 0)  return false;
    if (soSaldoDisp && l.saldo <= 0)        return false;
    if (soJaVoou    && !l.jaVoou)           return false;
    return true;
  });

  // ── Titulares únicos ──────────────────────────────────────────────────
  const titularesUnicos = React.useMemo(() => {
    const seen = new Set();
    return linhas.filter((l) => {
      if (!l.nomeTitular || l.nomeTitular === "—") return false;
      if (seen.has(l.nomeTitular)) return false;
      seen.add(l.nomeTitular);
      return true;
    });
  }, [linhas]);

  // ── Colunas ───────────────────────────────────────────────────────────
  const columns = [
    {
      title: () => (
        <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>
          Titular de Conta <span style={{ fontSize: 10 }}>↕</span>
        </span>
      ),
      dataIndex: "nomeTitular", key: "nomeTitular", width: 140,
      sorter: (a, b) => a.nomeTitular.localeCompare(b.nomeTitular),
      render: (v) => <span style={{ fontSize: 13, color: "#222" }}>{v}</span>,
    },
    {
      title: <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>Programa</span>,
      dataIndex: "programa", key: "programa", width: 220,
      render: (v) => (
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#222" }}>
          <LogoCircle nome={v} size={22} />
          {v}
        </span>
      ),
    },
    {
      title: <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>Saldo</span>,
      dataIndex: "saldo", key: "saldo", width: 100,
      sorter: (a, b) => a.saldo - b.saldo,
      render: (v) => <span style={{ fontSize: 13, color: "#222" }}>{v > 0 ? v.toLocaleString("pt-BR") : "0"}</span>,
    },
    {
      title: <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>Custo Médio</span>,
      dataIndex: "custoMedio", key: "custoMedio", width: 120,
      render: (v) => (
        <span style={{ fontSize: 13, color: "#222" }}>
          R$ {Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>CPFs Utilizados</span>,
      dataIndex: "cpfsUsados", key: "cpfsUsados", width: 130,
      render: (v, row) => (
        <span style={{ fontSize: 13, color: "#222" }}>
          {row.cpfsLivres > 0 ? `${v} / ${row.cpfsLivres}` : "—"}
        </span>
      ),
    },
    {
      title: <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>Última Emissão</span>,
      dataIndex: "ultimaEmissao", key: "ultimaEmissao", width: 130,
      render: (v) => (
        <span style={{ fontSize: 13, color: v ? "#222" : "#bbb" }}>
          {v ? dayjs(v).format("DD/MM/YYYY") : "—"}
        </span>
      ),
    },
    {
      title: <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>Já voou?</span>,
      dataIndex: "jaVoou", key: "jaVoou", width: 90,
      render: (v) => (
        <span style={{ fontSize: 13, color: v ? "#52c41a" : "#bbb", fontWeight: v ? 600 : 400 }}>
          {v ? "Sim" : "—"}
        </span>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 20px 14px", borderBottom: "1px solid #f0f0f0" }}>
          <TagOutlined style={{ fontSize: 15, color: "#555" }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Consulta Passageiros/CPF</span>
        </div>

        <Spin spinning={loading}>

          {/* Painel escuro de filtros */}
          <div style={{ background: "#1e3a4a", padding: "16px 20px 14px" }}>

            {/* Busca Passageiro */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#aac4d0", fontWeight: 500, marginBottom: 6, display: "block" }}>
                Busca Passageiro:
              </label>
              <Select
                size="middle" style={{ width: 280 }}
                placeholder="Todos os passageiros"
                allowClear showSearch optionFilterProp="children"
                onChange={(v) => setFiltroBusca(v ?? null)}
                dropdownStyle={{ borderRadius: 4 }}
              >
                {passageiros.map((p) => {
                  const id  = String(fld(p, "pag_id")  ?? "");
                  const nm  = String(fld(p, "pag_nome") ?? "—");
                  const cpf = fld(p, "pag_cpf") ? ` — ${fld(p, "pag_cpf")}` : "";
                  return <Option key={id} value={id}>{nm}{cpf}</Option>;
                })}
              </Select>
            </div>

            {/* Filtro Titular + Filtro Programa */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <label style={{ fontSize: 12, color: "#aac4d0", fontWeight: 500, marginBottom: 6, display: "block" }}>
                  Filtrar por Titular de Conta
                </label>
                <Select
                  size="middle" style={{ width: "100%" }}
                  placeholder="Todos os titulares"
                  allowClear showSearch optionFilterProp="children"
                  onChange={(v) => setFiltroTitular(v ?? null)}
                  dropdownStyle={{ borderRadius: 4 }}
                >
                  {titularesUnicos.map((l) => (
                    <Option key={l.nomeTitular} value={l.nomeTitular}>{l.nomeTitular}</Option>
                  ))}
                </Select>
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <label style={{ fontSize: 12, color: "#aac4d0", fontWeight: 500, marginBottom: 6, display: "block" }}>
                  Filtrar por Programa de Fidelidade
                </label>
                <Select
                  size="middle" style={{ width: "100%" }}
                  placeholder="Todos programas"
                  allowClear showSearch optionFilterProp="children"
                  onChange={(v) => setFiltroPrograma(v || null)}
                  dropdownStyle={{ borderRadius: 4 }}
                >
                  <Option key="__todos__" value="">Todos os programas</Option>
                  {programasUnicos.map((p) => (
                    <Option key={p} value={p}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <LogoCircle nome={p} size={22} />
                        {p}
                      </span>
                    </Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Checkboxes */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <Checkbox style={{ color: "#aac4d0", fontSize: 12 }} checked={soCpfsDisp}  onChange={(e) => setSoCpfsDisp(e.target.checked)}>
                Somente contas com CPFs disponíveis.
              </Checkbox>
              <Checkbox style={{ color: "#aac4d0", fontSize: 12 }} checked={soSaldoDisp} onChange={(e) => setSoSaldoDisp(e.target.checked)}>
                Somente contas com saldo disponível.
              </Checkbox>
              <Checkbox style={{ color: "#aac4d0", fontSize: 12 }} checked={soJaVoou}    onChange={(e) => setSoJaVoou(e.target.checked)}>
                Somente contas que passageiro já voou.
              </Checkbox>
            </div>
          </div>

          {/* Tabela */}
          <div style={{ padding: "0 0 16px" }}>
            <Table
              columns={columns}
              dataSource={linhasFiltradas}
              rowKey="key"
              size="small"
              pagination={false}
              scroll={{ x: 800 }}
              locale={{ emptyText: "Nenhum resultado encontrado." }}
              rowClassName={(_, idx) => idx % 2 === 0 ? "" : "row-alt"}
            />
          </div>
        </Spin>
      </div>

      <style>{`
        .row-alt td { background: #fafafa !important; }
        .ant-table-thead > tr > th { background: #fff !important; border-bottom: 1px solid #e8e8e8 !important; padding: 10px 12px !important; }
        .ant-table-tbody > tr > td { padding: 10px 12px !important; border-bottom: 1px solid #f0f0f0 !important; }
        .ant-table-tbody > tr:hover > td { background: #f0f5ff !important; }
        .ant-select-selector { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.18) !important; color: #fff !important; border-radius: 4px !important; }
        .ant-select-selection-placeholder { color: rgba(255,255,255,0.55) !important; }
        .ant-select-arrow { color: rgba(255,255,255,0.55) !important; }
        .ant-checkbox-inner { background: rgba(255,255,255,0.12) !important; border-color: rgba(255,255,255,0.3) !important; }
      `}</style>
    </div>
  );
}