import React, { useState, useEffect } from "react";
import { Spin, Modal, message, Dropdown } from "antd";
import {
  HeartOutlined, FilterOutlined, MoreOutlined,
  EditOutlined, DeleteOutlined,
} from "@ant-design/icons";
import api from "../services/api";

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

const getErroMsg = (e, fb = "Erro desconhecido.") => {
  const d = e?.response?.data;
  if (!d) return e?.message || fb;
  if (typeof d === "string") return d;
  if (typeof d === "object") return d.description || d.error || d.message || fb;
  return fb;
};

// ── Logos programas ─────────────────────────────────────────────────────
const LOGOS_MAP = [
  { keys: ["livelo"],                    bg: "#e800b6", letra: "LV"  },
  { keys: ["itaú pontos","itau pontos"], bg: "#003087", letra: "IT"  },
  { keys: ["smiles"],                    bg: "#ff6600", letra: "S"   },
  { keys: ["azul fidelidade","azul"],    bg: "#003087", letra: "A"   },
  { keys: ["coopera pj"],                bg: "#007b5e", letra: "CPJ" },
  { keys: ["coopera"],                   bg: "#007b5e", letra: "COO" },
  { keys: ["latam"],                     bg: "#e31837", letra: "L"   },
  { keys: ["tap miles","tap"],           bg: "#009900", letra: "TAP" },
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
  { keys: ["membership rewards","amex"], bg: "#006fcf", letra: "MR"  },
  { keys: ["safra rewards"],             bg: "#003366", letra: "SR"  },
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
  { keys: ["british airways"],           bg: "#2b4090", letra: "BA"  },
  { keys: ["qatar"],                     bg: "#5c0632", letra: "QR"  },
  { keys: ["aeroplan"],                  bg: "#c8102e", letra: "AP"  },
  { keys: ["copa","connectmiles"],       bg: "#0033a0", letra: "CM"  },
  { keys: ["delta"],                     bg: "#c8102e", letra: "DL"  },
  { keys: ["emirates"],                  bg: "#c8102e", letra: "EK"  },
  { keys: ["virgin atlantic","flying club"], bg: "#e8003d", letra: "VS" },
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

const LogoCircle = ({ nome, size = 42 }) => {
  const { bg, letra } = getLogo(nome);
  return (
    <span title={nome} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      background: bg, color: "#fff",
      fontSize: size * 0.27, fontWeight: 700, flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    }}>{letra}</span>
  );
};

// ── Formatadores ────────────────────────────────────────────────────────
const fmtPontos      = (v) => Number(v || 0).toLocaleString("pt-BR");
const fmtMensalidade = (v) => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mascaraMilhas  = (v = "") => {
  const n = String(v).replace(/\D/g, "");
  if (!n) return "";
  return Number(n).toLocaleString("pt-BR");
};
const desmascaraMilhas = (v = "") => String(v).replace(/\./g, "");

// ── Campo do formulário ─────────────────────────────────────────────────
const Campo = ({ label, value, onChange, placeholder, suffix, readOnly, type = "text" }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    {label && <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>}
    <div style={{
      display: "flex", alignItems: "center",
      background: readOnly ? "#f4f6f9" : "#fff",
      border: "1px solid #dde1e9", borderRadius: 6,
      padding: "0 10px", height: 36,
    }}>
      <input
        type={type} readOnly={readOnly}
        value={value ?? ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder || ""}
        style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#333", padding: "6px 0" }}
      />
      {suffix && <span style={{ color: "#bbb", marginLeft: 6, fontSize: 13 }}>{suffix}</span>}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════
export default function Clube({ clienteId: clienteIdProp }) {
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [clubes, setClubes]           = useState([]);
  const [cartoes, setCartoes]         = useState([]);
  const [cartoesCredito, setCartoesCredito] = useState([]);
  const [titulares, setTitulares]     = useState([]);
  const [clienteId, setClienteId]     = useState(null);
  const [busca, setBusca]             = useState("");

  // Modal Editar Clube
  const [modalEditar, setModalEditar]     = useState(false);
  const [clubeEditar, setClubeEditar]     = useState(null);
  const [cartaoEditar, setCartaoEditar]   = useState(null);
  const [editPontos, setEditPontos]       = useState("");
  const [editMensalidade, setEditMensalidade] = useState("0,00");
  const [editVencimento, setEditVencimento]   = useState("");
  const [editCredito, setEditCredito]     = useState("");
  const [salvandoEdit, setSalvandoEdit]   = useState(false);

  // Modal Confirmar Cancelamento
  const [modalCancelar, setModalCancelar] = useState(false);
  const [clubeCancelar, setClubeCancelar] = useState(null);
  const [cancelando, setCancelando]       = useState(false);

  // Modal Registrar Adesão
  const [modalNovo, setModalNovo]         = useState(false);
  const [cartaoSel, setCartaoSel]         = useState(null);
  const [novaTitular, setNovaTitular]     = useState(null);
  const [novoPontos, setNovoPontos]       = useState("");
  const [novoMensalidade, setNovoMensalidade] = useState("0,00");
  const [novoVencimento, setNovoVencimento]   = useState("");
  const [novoCredito, setNovoCredito]     = useState("");

  // ── Resolve clienteId ────────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (!id) id = u.cli_id || u.id;
    } catch (e) {}
    if (!id) id = parseInt(localStorage.getItem("userID") || "0") || null;
    if (id) { setClienteId(id); carregarDados(id); }
  }, [clienteIdProp]);

  const carregarDados = async (id) => {
    setLoading(true);
    try {
      const titRes = await api.get("/ServerPrincipal/PesquisaTitular", { params: { Cliente: id } });
      const titRows = extractRows(titRes.data);
      const seen = new Set();
      const titularesDeduplic = titRows.filter((t) => {
        const k = String(t.cli_id ?? t.CLI_ID ?? "");
        if (!k || k === "0" || seen.has(k)) return false;
        seen.add(k); return true;
      });
      setTitulares(titularesDeduplic);

      const results = await Promise.all(
        titularesDeduplic.map((t) => {
          const cliId = t.cli_id ?? t.CLI_ID;
          return Promise.all([
            api.get("/ServerPrincipal/PesquisaCartoes",      { params: { Cliente: cliId } }).then((r) => extractRows(r.data)).catch(() => []),
            api.get("/ServerPrincipal/PesquisaCartaoCredito",{ params: { Cliente: cliId } }).then((r) => extractRows(r.data)).catch(() => []),
            api.get("/ServerPrincipal/PesquisaClube",        { params: { Cliente: cliId } }).then((r) => extractRows(r.data)).catch(() => []),
          ]).then(([cars, creds, clubs]) => ({ tit: t, cars, creds, clubs }));
        })
      );

      const cartoesFlat = [];
      const creditosFlat = [];
      const clubesFlat = [];
      const seenCar = new Set();
      const seenCre = new Set();
      const seenClu = new Set();

      results.forEach(({ tit, cars, creds, clubs }) => {
        cars.forEach((c) => {
          const k = String(c.car_id ?? c.CAR_ID ?? "");
          if (!k || seenCar.has(k)) return;
          seenCar.add(k);
          cartoesFlat.push({ ...c, _tit: tit });
        });
        creds.forEach((c) => {
          const k = String(c.cre_id ?? c.CRE_ID ?? "");
          if (!k || seenCre.has(k)) return;
          seenCre.add(k);
          creditosFlat.push({ ...c, _tit: tit });
        });
        clubs.forEach((c) => {
          const k = String(c.clu_id ?? c.CLU_ID ?? "");
          if (!k || seenClu.has(k)) return;
          seenClu.add(k);
          const carId = c.car_id ?? c.CAR_ID;
          const cartao = cartoesFlat.find((x) => String(x.car_id ?? x.CAR_ID ?? "") === String(carId));
          clubesFlat.push({ ...c, _tit: tit, _cartao: cartao });
        });
      });

      setCartoes(cartoesFlat);
      setCartoesCredito(creditosFlat);
      setClubes(clubesFlat);
    } catch (e) {
      message.error("Erro ao carregar dados do clube.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verifica se cartão já tem clube ──────────────────────────────────
  const temClube = (carId) =>
    clubes.some((c) => {
      const cid = c.car_id ?? c.CAR_ID;
      return String(cid) === String(carId);
    });

  const getDadosClube = (carId) =>
    clubes.find((c) => {
      const cid = c.car_id ?? c.CAR_ID;
      return String(cid) === String(carId);
    });

  // ── Filtro ────────────────────────────────────────────────────────────
  const cartoesFiltrados = cartoes.filter((c) => {
    const q    = busca.toLowerCase();
    const prog = (c.car_nome_programa ?? c.CAR_NOME_PROGRAMA ?? "").toLowerCase();
    const tit  = (c._tit?.cli_nome ?? "").toLowerCase();
    return !q || prog.includes(q) || tit.includes(q);
  });

  // ── Abrir modal Registrar Adesão ──────────────────────────────────────
  const abrirNovo = (c) => {
    setCartaoSel(c);
    setNovaTitular(c._tit || titulares[0] || null);
    setNovoPontos("");
    setNovoMensalidade("0,00");
    setNovoVencimento("");
    setNovoCredito("");
    setModalNovo(true);
  };

  // ── Editar Clube ─────────────────────────────────────────────────────
  const abrirEditar = (carId) => {
    const clube  = getDadosClube(carId);
    const cartao = cartoes.find((c) => String(c.car_id ?? c.CAR_ID ?? "") === String(carId));
    if (!clube) return;

    setClubeEditar(clube);
    setCartaoEditar(cartao || null);

    setEditPontos(mascaraMilhas(String(clube.clu_pontos ?? clube.CLU_PONTOS ?? "")));
    setEditMensalidade(
      Number(clube.clu_vmensalidade ?? clube.CLU_VMENSALIDADE ?? 0)
        .toFixed(2).replace(".", ",")
    );

    const venc = String(clube.clu_vencimento ?? clube.CLU_VENCIMENTO ?? "").trim();
    let dia = "";
    if (venc.includes("-")) dia = String(Number(venc.split("-")[2] || "0"));
    else if (venc.includes("/")) dia = String(Number(venc.split("/")[0] || "0"));
    else if (venc.length === 8) dia = String(Number(venc.slice(6)));
    else dia = String(Number(venc) || "");
    setEditVencimento(dia);

    setEditCredito(String(clube.cre_id ?? clube.CRE_ID ?? ""));
    setModalEditar(true);
  };

  const handleAtualizarClube = async () => {
    if (!editPontos)     { message.error("Informe os pontos."); return; }
    if (!editVencimento) { message.error("Informe o dia de vencimento."); return; }

    setSalvandoEdit(true);
    const hoje     = new Date();
    const dia      = editVencimento.padStart(2, "0");
    const mes      = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano      = hoje.getFullYear();
    const dataVenc = `${dia}/${mes}/${ano}`;
    const cluId    = clubeEditar?.clu_id    ?? clubeEditar?.CLU_ID    ?? 0;
    const carId    = cartaoEditar?.car_id   ?? cartaoEditar?.CAR_ID   ?? 0;

    try {
      await api.post("/ServerPrincipal/AtualizarClube", {
        Pontos:       desmascaraMilhas(editPontos),
        Mensalidade:  editMensalidade.replace(/\./g, ""),
        Vencimento:   dataVenc,
        CartaoCredito:String(editCredito || 0),
        Cartao:       String(carId),
        Clube:        String(cluId),
      });
      message.success("Clube atualizado com sucesso!");
      setModalEditar(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao atualizar clube."));
    } finally {
      setSalvandoEdit(false);
    }
  };

  // ── Cancelar Clube ───────────────────────────────────────────────────
  const abrirCancelar = (carId) => {
    const clube = getDadosClube(carId);
    setClubeCancelar(clube);
    setModalCancelar(true);
  };

  const handleCancelarClube = async () => {
    if (!clubeCancelar) return;
    setCancelando(true);
    const cluId = clubeCancelar.clu_id ?? clubeCancelar.CLU_ID ?? 0;
    try {
      await api.post("/ServerPrincipal/DeletarClube", {
        IDClube: String(cluId),
      });
      message.success("Clube cancelado com sucesso!");
      setModalCancelar(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao cancelar clube."));
    } finally {
      setCancelando(false);
    }
  };

  // ── Salvar nova adesão ────────────────────────────────────────────────
  const handleSalvar = async () => {
    if (!novoPontos)     { message.error("Informe os pontos."); return; }
    if (!novoVencimento) { message.error("Informe o dia de vencimento."); return; }

    setSaving(true);
    const cliId    = novaTitular?.cli_id ?? novaTitular?.CLI_ID ?? clienteId;
    const carId    = cartaoSel?.car_id   ?? cartaoSel?.CAR_ID   ?? 0;
    const hoje     = new Date();
    const dia      = novoVencimento.padStart(2, "0");
    const mes      = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano      = hoje.getFullYear();
    const dataVenc = `${dia}/${mes}/${ano}`;

    try {
      await api.post("/ServerPrincipal/InserirClube", {
        Pontos:      desmascaraMilhas(novoPontos),
        Mensalidade: novoMensalidade.replace(/\./g, ""),
        Vencimento:  dataVenc,
        Credito:     String(novoCredito || 0),
        Programa:    String(carId),
        IDCliente:   String(cliId),       // dono do cartão (pode ser agregado)
        IDTitular:   String(clienteId),   // ← NOVO: titular principal da sessão
      });
      message.success("Adesão ao clube registrada com sucesso!");
      setModalNovo(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao registrar adesão."));
    } finally {
      setSaving(false);
    }
  };

  const isValido = novoPontos && novoVencimento;
  const nomeCartao = (c) => {
    const tit  = c._tit?.cli_nome ?? "";
    const prog = c.car_nome_programa ?? c.CAR_NOME_PROGRAMA ?? "";
    return tit ? `${tit.split(" ")[0]} - ${prog}` : prog;
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <HeartOutlined style={{ fontSize: 16, color: "#e8003d", marginRight: 8 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Clube do Assinante</span>
        </div>

        <Spin spinning={loading}>
          <div style={{ padding: "16px 20px" }}>

            {/* Busca */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#eef1f5", borderRadius: 6, padding: "8px 14px", marginBottom: 16 }}>
              <FilterOutlined style={{ color: "#aaa", fontSize: 15 }} />
              <input value={busca} onChange={(e) => setBusca(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#333", width: "100%" }}
              />
            </div>

            {/* Lista de cartões */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {cartoesFiltrados.length === 0 && !loading && (
                <div style={{ textAlign: "center", color: "#bbb", padding: "32px 0", fontSize: 13 }}>
                  Nenhum programa encontrado.
                </div>
              )}

              {cartoesFiltrados.map((c, idx) => {
                const prog     = c.car_nome_programa ?? c.CAR_NOME_PROGRAMA ?? "";
                const nome     = nomeCartao(c);
                const carId    = c.car_id ?? c.CAR_ID;
                const ativo    = temClube(carId);
                const clube    = getDadosClube(carId);
                const pontos   = clube ? Number(clube.clu_pontos ?? clube.CLU_PONTOS ?? 0) : 0;
                const mensal   = clube ? Number(clube.clu_vmensalidade ?? clube.CLU_VMENSALIDADE ?? 0) : 0;
                const venc     = clube ? (clube.clu_vencimento ?? clube.CLU_VENCIMENTO ?? "") : "";

                const diaVenc = (() => {
                  const s = String(venc).trim();
                  if (!s || s === "0") return "—";
                  if (s.includes("-")) return String(Number(s.split("-")[2] || "0"));
                  if (s.includes("/")) return String(Number(s.split("/")[0] || "0"));
                  if (s.length === 8)  return String(Number(s.slice(6)));
                  return String(Number(s));
                })();

                return (
                  <div key={carId ?? idx} style={{
                    display: "flex", alignItems: "center",
                    padding: "14px 8px",
                    borderBottom: "1px solid #f0f0f0",
                    background: ativo ? "#fff" : "#fafafa",
                  }}>
                    <div style={{ marginRight: 14 }}>
                      <LogoCircle nome={prog} size={42} />
                    </div>

                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#222" }}>
                      {nome}
                    </div>

                    {ativo && (
                      <div style={{ display: "flex", alignItems: "center", gap: 20, marginRight: 12 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 1 }}>Pontos</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{fmtPontos(pontos)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 1 }}>Mensalidade</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{fmtMensalidade(mensal)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 1 }}>Vencimento</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{diaVenc || "—"}</div>
                        </div>
                      </div>
                    )}

                    {!ativo && (
                      <button
                        onClick={() => abrirNovo(c)}
                        style={{
                          marginRight: 12, padding: "5px 14px", fontSize: 12,
                          border: "1px solid #dde1e9", borderRadius: 4,
                          background: "#fff", cursor: "pointer", color: "#555", fontWeight: 500,
                        }}
                      >
                        REGISTRAR ADESÃO
                      </button>
                    )}

                    {ativo && (
                      <button
                        onClick={() => abrirCancelar(carId)}
                        style={{
                          marginRight: 12, padding: "5px 14px", fontSize: 12,
                          border: "1px solid #f0a000", borderRadius: 4,
                          background: "#fff", cursor: "pointer", color: "#f0a000", fontWeight: 600,
                        }}
                      >
                        CANCELAR CLUBE
                      </button>
                    )}

                    <Dropdown
                      menu={{
                        items: [
                          ativo
                            ? { key: "editar", icon: <EditOutlined />, label: "Editar", onClick: () => abrirEditar(carId) }
                            : { key: "registrar", label: "Registrar Adesão", onClick: () => abrirNovo(c) },
                          { key: "excluir", icon: <DeleteOutlined />, label: "Excluir", danger: true },
                        ],
                      }}
                      trigger={["click"]}
                      placement="bottomRight"
                    >
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 18, padding: "4px 6px" }}>
                        <MoreOutlined />
                      </button>
                    </Dropdown>
                  </div>
                );
              })}
            </div>
          </div>
        </Spin>
      </div>

      {/* ══ Modal REGISTRAR ADESÃO ══ */}
      <Modal
        open={modalNovo}
        onCancel={() => setModalNovo(false)}
        footer={null}
        width={560}
        destroyOnHidden
        closable
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16 }}>
          Preencha os detalhes do clube do assinante.
        </div>

        <div style={{ background: "#f7f9fc", borderRadius: 8, border: "1px solid #e4e8ef", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Titular</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>
                {novaTitular?.cli_nome ?? "—"}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                {String(novaTitular?.cli_cpf ?? "").replace(/\D/g, "")}
              </div>
            </div>
            <LogoCircle nome={cartaoSel?.car_nome_programa ?? ""} size={48} />
          </div>

          <div style={{ borderTop: "1px solid #e0e4ea" }} />

          <div style={{ display: "flex", gap: 12 }}>
            <Campo
              label="Pontos"
              value={novoPontos}
              onChange={(v) => setNovoPontos(mascaraMilhas(v))}
              placeholder=""
              suffix={<span style={{ fontSize: 13 }}>#</span>}
            />
            <Campo
              label="Mensalidade"
              value={novoMensalidade}
              onChange={setNovoMensalidade}
              placeholder="0,00"
              suffix={<span style={{ fontSize: 13 }}>$</span>}
            />
            <Campo
              label="Dia do Vencimento"
              value={novoVencimento}
              onChange={(v) => setNovoVencimento(v.replace(/\D/g, "").slice(0, 2))}
              placeholder="xx"
              suffix={null}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Cartão de Crédito</div>
            <select
              value={novoCredito}
              onChange={(e) => setNovoCredito(e.target.value)}
              style={{
                width: "100%", height: 36, borderRadius: 6,
                border: "1px solid #dde1e9", background: "#fff",
                fontSize: 13, color: novoCredito ? "#333" : "#aaa",
                padding: "0 10px", outline: "none", cursor: "pointer",
              }}
            >
              <option value="">Nenhum cartão associado</option>
              {cartoesCredito
                .filter((cc) => {
                  const cliTit = String(novaTitular?.cli_id ?? novaTitular?.CLI_ID ?? "");
                  const cliCc  = String(cc.cli_id ?? cc.CLI_ID ?? "");
                  return !cliTit || cliTit === cliCc;
                })
                .map((cc) => {
                  const creId  = cc.cre_id        ?? cc.CRE_ID        ?? "";
                  const band   = cc.cre_bandeira  ?? cc.CRE_BANDEIRA  ?? "";
                  const numero = cc.cre_numero    ?? cc.CRE_NUMERO    ?? "";
                  return (
                    <option key={String(creId)} value={String(creId)}>
                      {band}{numero ? ` •••• ${numero}` : ""}
                    </option>
                  );
                })
              }
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button
            onClick={() => setModalNovo(false)}
            style={{ padding: "7px 22px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#555" }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSalvar}
            disabled={saving || !isValido}
            style={{
              padding: "7px 22px", borderRadius: 4, border: "none",
              background: saving || !isValido ? "#bfbfbf" : "#1e3a4a",
              color: "#fff", cursor: saving || !isValido ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
            }}
          >
            {saving ? "SALVANDO..." : isValido ? "CADASTRAR" : "PREENCHA OS DADOS!"}
          </button>
        </div>
      </Modal>

      {/* ══ Modal EDITAR CLUBE ══ */}
      <Modal
        open={modalEditar}
        onCancel={() => setModalEditar(false)}
        footer={null}
        width={560}
        destroyOnHidden
        closable
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16 }}>
          Atualizar dados do clube do assinante.
        </div>

        <div style={{ background: "#f7f9fc", borderRadius: 8, border: "1px solid #e4e8ef", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Titular</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>
                {cartaoEditar?._tit?.cli_nome ?? "—"}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                {String(cartaoEditar?._tit?.cli_cpf ?? "").replace(/\D/g, "")}
              </div>
            </div>
            <LogoCircle nome={cartaoEditar?.car_nome_programa ?? cartaoEditar?.CAR_NOME_PROGRAMA ?? ""} size={48} />
          </div>

          <div style={{ borderTop: "1px solid #e0e4ea" }} />

          <div style={{ display: "flex", gap: 12 }}>
            <Campo
              label="Pontos"
              value={editPontos}
              onChange={(v) => setEditPontos(mascaraMilhas(v))}
              placeholder=""
              suffix={<span style={{ fontSize: 13 }}>#</span>}
            />
            <Campo
              label="Mensalidade"
              value={editMensalidade}
              onChange={setEditMensalidade}
              placeholder="0,00"
              suffix={<span style={{ fontSize: 13 }}>$</span>}
            />
            <Campo
              label="Dia do Vencimento"
              value={editVencimento}
              onChange={(v) => setEditVencimento(v.replace(/\D/g, "").slice(0, 2))}
              placeholder="xx"
            />
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Cartão de Crédito</div>
            <select
              value={editCredito}
              onChange={(e) => setEditCredito(e.target.value)}
              style={{
                width: "100%", height: 36, borderRadius: 6,
                border: "1px solid #dde1e9", background: "#fff",
                fontSize: 13, color: "#333",
                padding: "0 10px", outline: "none", cursor: "pointer",
              }}
            >
              <option value="">Nenhum cartão associado</option>
              {cartoesCredito
                .filter((cc) => {
                  const cliTit = String(cartaoEditar?._tit?.cli_id ?? "");
                  const cliCc  = String(cc.cli_id ?? cc.CLI_ID ?? "");
                  return !cliTit || cliTit === cliCc;
                })
                .map((cc) => {
                  const creId  = cc.cre_id        ?? cc.CRE_ID        ?? "";
                  const band   = cc.cre_bandeira  ?? cc.CRE_BANDEIRA  ?? "";
                  const numero = cc.cre_numero    ?? cc.CRE_NUMERO    ?? "";
                  return (
                    <option key={String(creId)} value={String(creId)}>
                      {band}{numero ? ` •••• ${numero}` : ""}
                    </option>
                  );
                })
              }
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button
            onClick={() => setModalEditar(false)}
            style={{ padding: "7px 22px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#555" }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleAtualizarClube}
            disabled={salvandoEdit}
            style={{ padding: "7px 22px", borderRadius: 4, border: "none", background: salvandoEdit ? "#bfbfbf" : "#1e3a4a", color: "#fff", cursor: salvandoEdit ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}
          >
            {salvandoEdit ? "SALVANDO..." : "SALVAR"}
          </button>
        </div>
      </Modal>

      {/* ══ Modal CONFIRMAR CANCELAMENTO ══ */}
      <Modal
        open={modalCancelar}
        onCancel={() => setModalCancelar(false)}
        footer={null}
        width={400}
        destroyOnHidden
        closable
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: 8 }}>
            Cancelar Clube
          </div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 24, lineHeight: 1.6 }}>
            Tem certeza que deseja cancelar a adesão ao clube?<br />
            <span style={{ color: "#f0a000", fontWeight: 600 }}>Esta ação não pode ser desfeita.</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button
              onClick={() => setModalCancelar(false)}
              style={{ padding: "8px 24px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#555" }}
            >
              NÃO
            </button>
            <button
              onClick={handleCancelarClube}
              disabled={cancelando}
              style={{ padding: "8px 24px", borderRadius: 4, border: "none", background: cancelando ? "#bfbfbf" : "#f0a000", color: "#fff", cursor: cancelando ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}
            >
              {cancelando ? "CANCELANDO..." : "SIM, CANCELAR"}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}