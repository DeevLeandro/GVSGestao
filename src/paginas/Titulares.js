import React, { useState, useEffect } from "react";
import { Spin, Modal, message, Dropdown,} from "antd";
import {
  TeamOutlined, PlusOutlined, FilterOutlined,
  MoreOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  MailOutlined, PhoneOutlined, NumberOutlined,
} from "@ant-design/icons";
import api from "../services/api";

// ── Extrai mensagem de erro do response ────────────────────────────────
const getErroMsg = (e, fallback = "Erro desconhecido.") => {
  const d = e?.response?.data;
  if (!d) return e?.message || fallback;
  if (typeof d === "string") return d;
  if (typeof d === "object") return d.description || d.error || d.message || fallback;
  return fallback;
};

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

// ── Logos programas ─────────────────────────────────────────────────────
const LOGOS_MAP_PROG = [
  { keys: ["livelo"],                    bg: "#e8003d", label: "LV"  },
  { keys: ["itaú","itau pontos"],        bg: "#003087", label: "IT"  },
  { keys: ["smiles"],                    bg: "#ff6600", label: "S"   },
  { keys: ["azul"],                      bg: "#003087", label: "A"   },
  { keys: ["coopera pj"],                bg: "#007b5e", label: "CPJ" },
  { keys: ["coopera"],                   bg: "#007b5e", label: "COO" },
  { keys: ["latam"],                     bg: "#e31837", label: "L"   },
  { keys: ["tap"],                       bg: "#009900", label: "TAP" },
  { keys: ["max milhas"],                bg: "#1e3a6e", label: "MM"  },
  { keys: ["hotmilhas"],                 bg: "#cc3300", label: "HM"  },
  { keys: ["ipiranga"],                  bg: "#f5a800", label: "IP"  },
  { keys: ["esfera empresas"],           bg: "#8b0000", label: "EE"  },
  { keys: ["esfera"],                    bg: "#8b0000", label: "E_"  },
  { keys: ["bank milhas"],               bg: "#0066cc", label: "BM"  },
  { keys: ["cash milhas"],               bg: "#5a5a5a", label: "CM"  },
  { keys: ["curtaí","curtai"],           bg: "#e8a000", label: "CT"  },
  { keys: ["compro suas milhas"],        bg: "#1e3a4a", label: "CSM" },
  { keys: ["átomos","atomos"],           bg: "#444",    label: "ÁT"  },
  { keys: ["gpa"],                       bg: "#00aa44", label: "GPA" },
  { keys: ["pontos caixa"],              bg: "#007b5e", label: "PC"  },
  { keys: ["caixa empresas"],            bg: "#007b5e", label: "CE"  },
  { keys: ["sicredi empresarial"],       bg: "#009900", label: "SCE" },
  { keys: ["sicredi"],                   bg: "#009900", label: "SC"  },
  { keys: ["dotz"],                      bg: "#ff6600", label: "DZ"  },
  { keys: ["porto plus"],                bg: "#0057a8", label: "PP"  },
  { keys: ["inter loop"],                bg: "#ff6b00", label: "IL"  },
  { keys: ["inter empresas"],            bg: "#ff6b00", label: "IE"  },
  { keys: ["volare"],                    bg: "#c8102e", label: "VL"  },
  { keys: ["membership","amex"],         bg: "#006fcf", label: "MR"  },
  { keys: ["safra"],                     bg: "#003366", label: "SR"  },
  { keys: ["suma"],                      bg: "#1e3a4a", label: "SU"  },
  { keys: ["cressol"],                   bg: "#007b5e", label: "CR"  },
  { keys: ["banrisul"],                  bg: "#003087", label: "BR"  },
  { keys: ["unicred"],                   bg: "#009900", label: "UC"  },
  { keys: ["milhas plus"],               bg: "#e8a000", label: "M+"  },
  { keys: ["xp pontos"],                 bg: "#1a1a2e", label: "XP"  },
  { keys: ["nubank"],                    bg: "#820ad1", label: "NU"  },
  { keys: ["ailos"],                     bg: "#007b5e", label: "AI"  },
  { keys: ["banestes"],                  bg: "#003087", label: "BN"  },
  { keys: ["bb empresas"],               bg: "#f5a800", label: "BB"  },
  { keys: ["itaú empresas","itau empresas"], bg: "#003087", label: "ITE" },
  { keys: ["pontos btg"],                bg: "#1a1a2e", label: "BTG" },
  { keys: ["iberia"],                    bg: "#cc0000", label: "IB"  },
  { keys: ["mileageplus","united"],      bg: "#002244", label: "UA"  },
  { keys: ["all accor","accor"],         bg: "#c8102e", label: "AL"  },
  { keys: ["ihg"],                       bg: "#6a0dad", label: "IHG" },
  { keys: ["aadvantage","american"],     bg: "#0078d2", label: "AA"  },
  { keys: ["flying blue"],               bg: "#003087", label: "FB"  },
  { keys: ["british"],                   bg: "#2b4090", label: "BA"  },
  { keys: ["qatar"],                     bg: "#5c0632", label: "QR"  },
  { keys: ["aeroplan"],                  bg: "#c8102e", label: "AP"  },
  { keys: ["copa","connectmiles"],       bg: "#0033a0", label: "CM"  },
  { keys: ["delta"],                     bg: "#c8102e", label: "DL"  },
  { keys: ["emirates"],                  bg: "#c8102e", label: "EK"  },
  { keys: ["virgin","flying club"],      bg: "#e8003d", label: "VS"  },
  { keys: ["finnair"],                   bg: "#003580", label: "AY"  },
  { keys: ["wyndham"],                   bg: "#003087", label: "WY"  },
];
const getLogo = (nome = "") => {
  const n = nome.toLowerCase();
  for (const l of LOGOS_MAP_PROG) {
    if (l.keys.some((k) => n.includes(k))) return l;
  }
  return { bg: "#607d8b", label: (nome || "??").slice(0, 2).toUpperCase() };
};

// ── Lista completa de programas de fidelidade ───────────────────────────
const PROGRAMAS_LISTA = [
  // ── Nacionais ──────────────────────────────────────────────────────
  { nome: "Livelo",                        bg: "#e8003d", letra: "LV"  },
  { nome: "Itaú Pontos",                   bg: "#003087", letra: "IT"  },
  { nome: "Smiles",                        bg: "#ff6600", letra: "S"   },
  { nome: "Azul Fidelidade",               bg: "#003087", letra: "A"   },
  { nome: "Coopera",                       bg: "#007b5e", letra: "COO" },
  { nome: "Latam Pass",                    bg: "#e31837", letra: "L"   },
  { nome: "Max Milhas",                    bg: "#1e3a6e", letra: "MM"  },
  { nome: "HotMilhas",                     bg: "#cc3300", letra: "HM"  },
  { nome: "Ipiranga",                      bg: "#f5a800", letra: "IP"  },
  { nome: "Esfera",                        bg: "#8b0000", letra: "E_"  },
  { nome: "Bank Milhas",                   bg: "#0066cc", letra: "BM"  },
  { nome: "Cash Milhas",                   bg: "#5a5a5a", letra: "CM"  },
  { nome: "Curtaí",                        bg: "#e8a000", letra: "CT"  },
  { nome: "Compro Suas Milhas",            bg: "#1e3a4a", letra: "CSM" },
  { nome: "Átomos",                        bg: "#444",    letra: "ÁT"  },
  { nome: "GPA",                           bg: "#00aa44", letra: "GPA" },
  { nome: "Pontos Caixa",                  bg: "#007b5e", letra: "PC"  },
  { nome: "Sicredi",                       bg: "#009900", letra: "SC"  },
  { nome: "Dotz",                          bg: "#ff6600", letra: "DZ"  },
  { nome: "Porto Plus",                    bg: "#0057a8", letra: "PP"  },
  { nome: "Inter Loop",                    bg: "#ff6b00", letra: "IL"  },
  { nome: "Volare",                        bg: "#c8102e", letra: "VL"  },
  { nome: "Membership Rewards Amex",       bg: "#006fcf", letra: "MR"  },
  { nome: "Safra Rewards",                 bg: "#003366", letra: "SR"  },
  { nome: "SUMA",                          bg: "#1e3a4a", letra: "SU"  },
  { nome: "Cressol",                       bg: "#007b5e", letra: "CR"  },
  { nome: "Banrisul",                      bg: "#003087", letra: "BR"  },
  { nome: "Unicred",                       bg: "#009900", letra: "UC"  },
  { nome: "Milhas Plus",                   bg: "#e8a000", letra: "M+"  },
  { nome: "XP Pontos",                     bg: "#1a1a2e", letra: "XP"  },
  { nome: "Nubank Rewards",               bg: "#820ad1", letra: "NU"  },
  { nome: "AILOS",                         bg: "#007b5e", letra: "AI"  },
  { nome: "Banestes Fidelidade",           bg: "#003087", letra: "BN"  },
  // ── Empresarial ────────────────────────────────────────────────────
  { nome: "BB Empresas",                   bg: "#f5a800", letra: "BB"  },
  { nome: "Esfera Empresas",               bg: "#8b0000", letra: "EE"  },
  { nome: "Itaú Empresas",                 bg: "#003087", letra: "ITE" },
  { nome: "Inter Empresas",                bg: "#ff6b00", letra: "IE"  },
  { nome: "Caixa Empresas",               bg: "#007b5e", letra: "CE"  },
  { nome: "Pontos BTG",                    bg: "#1a1a2e", letra: "BTG" },
  { nome: "Sicredi Empresarial",           bg: "#009900", letra: "SCE" },
  { nome: "Coopera PJ",                    bg: "#007b5e", letra: "CPJ" },
  // ── Internacionais ──────────────────────────────────────────────────
  { nome: "TAP Miles & Go",               bg: "#009900", letra: "TAP" },
  { nome: "Iberia Plus",                   bg: "#cc0000", letra: "IB"  },
  { nome: "MileagePlus United",            bg: "#002244", letra: "UA"  },
  { nome: "All Accor",                     bg: "#c8102e", letra: "AL"  },
  { nome: "IHG Rewards",                   bg: "#6a0dad", letra: "IHG" },
  { nome: "AAdvantage",                    bg: "#0078d2", letra: "AA"  },
  { nome: "Flying Blue",                   bg: "#003087", letra: "FB"  },
  { nome: "British Airways Executive Club",bg: "#2b4090", letra: "BA"  },
  { nome: "Qatar Airways Privilege Club",  bg: "#5c0632", letra: "QR"  },
  { nome: "Aeroplan",                      bg: "#c8102e", letra: "AP"  },
  { nome: "Copa ConnectMiles",             bg: "#0033a0", letra: "CM"  },
  { nome: "Delta SkyMiles",               bg: "#c8102e", letra: "DL"  },
  { nome: "Emirates Skywards",             bg: "#c8102e", letra: "EK"  },
  { nome: "Flying Club Virgin Atlantic",   bg: "#e8003d", letra: "VS"  },
  { nome: "Finnair Plus",                  bg: "#003580", letra: "AY"  },
  { nome: "Wyndham Rewards",              bg: "#003087", letra: "WY"  },
];

const LogoProgramaCircle = ({ prog, size = 36 }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: size, height: size, borderRadius: "50%",
    background: prog.bg, color: "#fff",
    fontSize: size * 0.3, fontWeight: 700, flexShrink: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  }}>{prog.letra}</span>
);

const ProgramaBolinha = ({ nome, size = 40 }) => {
  const { bg, label } = getLogo(nome);
  return (
    <span title={nome} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      background: bg, color: "#fff", fontSize: size * 0.28,
      fontWeight: 700, flexShrink: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
    }}>{label}</span>
  );
};

// ── Máscaras ────────────────────────────────────────────────────────────
const mascaraCPF = (v = "") => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};
const mascaraTelefone = (v = "") => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2)  return `(${d}`;
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

// ── Componentes de campo ────────────────────────────────────────────────
const FieldInput = ({ label, value, onChange, placeholder, suffix, readOnly, half }) => (
  <div style={{ flex: half ? "0 0 calc(50% - 6px)" : "1 1 100%", minWidth: 0 }}>
    {label && <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>{label}</div>}
    <div style={{
      display: "flex", alignItems: "center",
      background: readOnly ? "#f4f6f9" : "#fff",
      borderRadius: 6, border: "1px solid #dde1e9",
      padding: "0 10px", minHeight: 34,
    }}>
      <input
        readOnly={readOnly}
        value={value ?? ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder || ""}
        style={{
          flex: 1, border: "none", background: "transparent",
          outline: "none", fontSize: 13, color: readOnly ? "#333" : "#222",
          padding: "6px 0",
        }}
      />
      {suffix && <span style={{ color: "#bbb", marginLeft: 6, fontSize: 13 }}>{suffix}</span>}
    </div>
  </div>
);

const ModalLayout = ({ title, children, onCancel, onConfirm, confirmLabel, saving }) => (
  <div style={{ padding: "4px 0" }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 12 }}>{title}</div>
    <div style={{ background: "#f7f9fc", borderRadius: 8, border: "1px solid #e4e8ef", padding: "14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
      {children}
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
      <button onClick={onCancel} style={{ padding: "6px 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#555" }}>
        CANCELAR
      </button>
      <button onClick={onConfirm} disabled={saving} style={{ padding: "6px 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: saving ? "#ccc" : "#888" }}>
        {confirmLabel}
      </button>
    </div>
  </div>
);

// ── Seção bancária ──────────────────────────────────────────────────────
const SecaoBancaria = ({ banco, agencia, conta, pix, onChange, readOnly }) => (
  <>
    <div style={{ fontSize: 11, color: "#888", marginBottom: -2 }}>Dados para transferência</div>
    <div style={{ display: "flex", gap: 8 }}>
      <FieldInput value={banco}   onChange={readOnly ? null : (v) => onChange("banco", v)}   placeholder="Banco"          readOnly={readOnly} />
      <FieldInput value={agencia} onChange={readOnly ? null : (v) => onChange("agencia", v)} placeholder="Agência"        readOnly={readOnly} />
      <FieldInput value={conta}   onChange={readOnly ? null : (v) => onChange("conta", v)}   placeholder="Conta Corrente" readOnly={readOnly} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", background: readOnly ? "#f4f6f9" : "#fff", borderRadius: 6, border: "1px solid #dde1e9", padding: "0 10px", minHeight: 38 }}>
        <input
          readOnly={readOnly}
          value={pix ?? ""}
          onChange={readOnly ? undefined : (e) => onChange("pix", e.target.value)}
          placeholder="Chave PIX"
          style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#333", padding: "8px 0" }}
        />
      </div>
      <MailOutlined   style={{ color: "#bbb", fontSize: 14 }} />
      <NumberOutlined style={{ color: "#bbb", fontSize: 14 }} />
      <PhoneOutlined  style={{ color: "#bbb", fontSize: 14 }} />
    </div>
  </>
);

// ── Comissão ────────────────────────────────────────────────────────────
const SecaoComissao = ({ valor, onChange, tipo, onTipo, readOnly }) => (
  <>
    <div style={{ borderTop: "1px solid #e0e4ea" }} />
    <FieldInput
      label="Comissão"
      value={valor}
      onChange={readOnly ? null : onChange}
      readOnly={readOnly}
      suffix={<span style={{ fontSize: 12 }}>%</span>}
    />
    <div style={{ display: "flex", gap: 20 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#444", cursor: "pointer" }}>
        <input type="radio" name="tipoComissao" checked={tipo === "percentual"} onChange={() => !readOnly && onTipo("percentual")} style={{ accentColor: "#1677ff" }} />
        Percentual
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#444", cursor: "pointer" }}>
        <input type="radio" name="tipoComissao" checked={tipo === "fixo"} onChange={() => !readOnly && onTipo("fixo")} style={{ accentColor: "#1677ff" }} />
        Valor Fixo
      </label>
    </div>
    <div style={{ borderTop: "1px solid #e0e4ea" }} />
  </>
);

// ══════════════════════════════════════════════════════════════════════
export default function Titulares({ clienteId: clienteIdProp }) {
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [clientes, setClientes]         = useState([]);
  const [cartoes, setCartoes]           = useState({});  // mapa cli_id -> [{car_id, car_nome_programa}]
  const [busca, setBusca]               = useState("");
  const [clienteId, setClienteId]       = useState(null);
  const [loginId, setLoginId]           = useState(null);

  // Modal Editar Titular
  const [modalEditar, setModalEditar]         = useState(false);
  const [titularEditando, setTitularEditando] = useState(null);
  const [editForm, setEditForm]               = useState({ nome: "", cpf: "", email: "", celular: "" });
  const [salvandoEdit, setSalvandoEdit]       = useState(false);

  // Modal Excluir Titular
  const [modalExcluir, setModalExcluir]       = useState(false);
  const [titularExcluindo, setTitularExcluindo] = useState(null);
  const [excluindo, setExcluindo]             = useState(false);

  // Modal Novo Titular
  const [modalNovo, setModalNovo]       = useState(false);
  const [novoTipo, setNovoTipo]         = useState("percentual");
  const [novoForm, setNovoForm]         = useState({
    nome: "", apelido: "", cpf: "", email: "", celular: "",
    comissao: "", banco: "", agencia: "", conta: "", pix: "",
  });

  // Modal Detalhe
  const [modalDetalhe, setModalDetalhe] = useState(false);
  const [titularSel, setTitularSel]     = useState(null);
  const [detTipo, setDetTipo]           = useState("percentual");

  // Modal Novo Programa (botão +)
  const [modalPrograma, setModalPrograma] = useState(false);
  const [titularPrograma, setTitularPrograma] = useState(null); // titular do +
  const [savingProg, setSavingProg]       = useState(false);
  const [progBusca, setProgBusca]         = useState(null); // null=fechado, string=aberto
  const [progSel, setProgSel]             = useState(null);
  const [progEmail, setProgEmail]         = useState("");
  const [progNumero, setProgNumero]       = useState("");

  // ── Resolve clienteId ──────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    let logId = null;
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (!id) id = u.cli_id || u.id;
      logId = u.log_id || u.id || id;
    } catch (e) {}
    if (!id) id = parseInt(localStorage.getItem("userID") || "0") || null;
    if (!logId) logId = id;
    if (id) { setClienteId(id); setLoginId(logId); carregarDados(id); }
  }, [clienteIdProp]);

  const carregarDados = async (id) => {
    setLoading(true);
    try {
      // Busca titulares e cartões separadamente para isolar erros
      let titRows = [];

      try {
        const cliRes = await api.get("/ServerPrincipal/PesquisaTitular", { params: { Cliente: id } });
        titRows = extractRows(cliRes.data);
      } catch (e) {
        console.error("PesquisaTitular falhou:", e?.response?.status, e?.message);
      }

      console.log("ID Cliente", id)

      // PesquisaTitular já retorna car_id e car_nome_programa via LEFT JOIN
      // Cada linha = 1 cartão de 1 titular (ou titular sem cartão com car_id null)
      // Então NÃO precisamos de PesquisaCartoes separado —
      // montamos os programas diretamente das linhas do PesquisaTitular

      // 1. Deduplica titulares pelo cli_id (pega 1ª ocorrência)
      const seenTit = new Set();
      const titularesDeduplic = titRows.filter((t) => {
        const rawId = t.cli_id ?? t.CLI_ID;
        const k = rawId != null ? String(rawId) : null;
        if (!k || k === "0" || seenTit.has(k)) return false;
        seenTit.add(k);
        return true;
      });

      // 2. Monta mapa cli_id → lista de cartões direto do PesquisaTitular
      // Cada linha tem car_id + car_nome_programa (null se sem cartão)
      const cartoesMap = {};
      titRows.forEach((t) => {
        const rawId  = t.cli_id ?? t.CLI_ID;
        const carId  = t.car_id ?? t.CAR_ID;
        const carNome = t.car_nome_programa ?? t.CAR_NOME_PROGRAMA;
        if (!rawId || !carId) return; // titular sem cartão
        const k = String(rawId);
        if (!cartoesMap[k]) cartoesMap[k] = [];
        // evita duplicar o mesmo cartão
        if (!cartoesMap[k].find(c => String(c.car_id) === String(carId))) {
          cartoesMap[k].push({ car_id: carId, car_nome_programa: carNome, cli_id: rawId });
        }
      });

      setClientes(titularesDeduplic);
      setCartoes(cartoesMap); // agora é um mapa, não array
    } catch (e) {
      console.error("Erro geral em carregarDados:", e);
      message.error("Erro ao carregar titulares.");
    } finally {
      setLoading(false);
    }
  };

  // cartoes agora é um mapa { cli_id: [{ car_id, car_nome_programa }] }
  const programasPorCliente = (cliId) => {
    if (!cliId) return [];
    return cartoes[String(cliId)] || [];
  };

  const clientesFiltrados = clientes.filter((c) => {
    const q = busca.toLowerCase();
    const nome = (c.cli_nome || c.CLI_NOME || "").toLowerCase();
    const cpf  = (c.cli_cpf  || c.CLI_CPF  || c.tit_cpf || "").toLowerCase();
    return !q || nome.includes(q) || cpf.includes(q);
  });

  // ── Editar Titular ───────────────────────────────────────────────────
  const abrirEditar = (c) => {
    setTitularEditando(c);
    setEditForm({
      nome:    c.cli_nome     ?? c.CLI_NOME     ?? "",
      cpf:     mascaraCPF(c.cli_cpf ?? c.CLI_CPF ?? ""),
      email:   c.cli_email   ?? c.CLI_EMAIL   ?? "",
      celular: mascaraTelefone(c.cli_telefone ?? c.CLI_TELEFONE ?? ""),
    });
    setModalEditar(true);
  };

  const handleAtualizarTitular = async () => {
    if (!editForm.nome.trim()) { message.error("Nome é obrigatório."); return; }
    setSalvandoEdit(true);
    const cliId = titularEditando?.cli_id ?? titularEditando?.CLI_ID ?? 0;
    try {
      await api.post("/ServerPrincipal/AtualizarTitular", {
        Nome:     editForm.nome,
        CPF:      editForm.cpf.replace(/\D/g, ""),
        Email:    editForm.email || "",
        Telefone: editForm.celular.replace(/\D/g, "") || "",
        Cliente:  Number(cliId) || 0,
      });
      message.success("Titular atualizado com sucesso!");
      setModalEditar(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao atualizar titular."));
    } finally {
      setSalvandoEdit(false);
    }
  };

  // ── Excluir Titular ───────────────────────────────────────────────────
  const abrirExcluir = (c) => {
    setTitularExcluindo(c);
    setModalExcluir(true);
  };

  const handleExcluirTitular = async () => {
    if (!titularExcluindo) return;
    setExcluindo(true);
    const cliId = titularExcluindo?.cli_id ?? titularExcluindo?.CLI_ID ?? 0;
    try {
      await api.post("/ServerPrincipal/DeletarTitular", {
        Cliente: Number(cliId) || 0,
      });
      message.success("Titular excluído com sucesso!");
      setModalExcluir(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao excluir titular."));
    } finally {
      setExcluindo(false);
    }
  };

  const setEdit = (key, val) => setEditForm((p) => ({ ...p, [key]: val }));

  // ── Abrir detalhe ────────────────────────────────────────────────────
  const abrirDetalhe = (c) => {
    // Usa diretamente os campos do PesquisaTitular já carregados:
    // cli_id, cli_nome, cli_cpf, cli_email, cli_telefone
    setTitularSel(c);
    setDetTipo("percentual");
    setModalDetalhe(true);
  };

  const abrirModalPrograma = (c) => {
    setTitularPrograma(c);
    setProgSel(null);
    setProgEmail("");
    setProgNumero("");
    setProgBusca(null);
    setModalPrograma(true);
  };

  const handleCadastrarPrograma = async () => {
    if (!progSel)           { message.error("Selecione um programa."); return; }
    if (!progNumero.trim()) { message.error("Informe o número/CPF do programa."); return; }
    setSavingProg(true);
    const cliId = titularPrograma?.cli_id ?? titularPrograma?.CLI_ID ?? clienteId;
    try {
      await api.post("/ServerPrincipal/InserirProgramas", {
        Nome:      progSel.nome,
        Email:     progEmail || "",
        Telefone:  progNumero || "",
        IDCliente: String(cliId),
      });
      message.success("Programa cadastrado com sucesso!");
      setModalPrograma(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao cadastrar programa."));
    } finally {
      setSavingProg(false);
    }
  };

  const tv = (t, key, fb = "") => t?.[key] ?? t?.[key?.toUpperCase()] ?? fb;

  // ── Salvar novo titular ──────────────────────────────────────────────
  const handleCadastrar = async () => {
    if (!novoForm.nome.trim()) { message.error("Nome é obrigatório."); return; }
    if (!novoForm.cpf.trim())  { message.error("CPF é obrigatório.");  return; }
    setSaving(true);
    try {
      await api.post("/ServerPrincipal/InserirClientes", {
        Login:     String(loginId || clienteId || 0),
        Nome:      novoForm.nome,
        CPF:       novoForm.cpf.replace(/\D/g, ""),
        Email:     novoForm.email || "",
        Telefone:  novoForm.celular.replace(/\D/g, "") || "",
        IDCliente: String(clienteId || 0),
      });
      message.success("Titular cadastrado com sucesso!");
      setModalNovo(false);
      setNovoForm({ nome: "", apelido: "", cpf: "", email: "", celular: "", comissao: "", banco: "", agencia: "", conta: "", pix: "" });
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao cadastrar."));
    } finally {
      setSaving(false);
    }
  };

  const setNovo = (key, val) => setNovoForm((p) => ({ ...p, [key]: val }));

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TeamOutlined style={{ fontSize: 16, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Titulares de Conta</span>
          </div>
          <button
            onClick={() => { setNovoForm({ nome:"",apelido:"",cpf:"",email:"",celular:"",comissao:"",banco:"",agencia:"",conta:"",pix:"" }); setNovoTipo("percentual"); setModalNovo(true); }}
            style={{ background: "#1e3a4a", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }}
          >
            NOVO TITULAR
          </button>
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

            {/* Lista */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {clientesFiltrados.length === 0 && !loading && (
                <div style={{ textAlign: "center", color: "#bbb", padding: "32px 0", fontSize: 13 }}>Nenhum titular encontrado.</div>
              )}

              {clientesFiltrados.map((c) => {
                const cliId    = c.cli_id    ?? c.CLI_ID ?? c.CLI_IDTITULAR;
                const nome     = c.cli_nome  ?? c.CLI_NOME  ?? "—";
                const cpf      = c.cli_cpf   ?? c.CLI_CPF   ?? c.tit_cpf ?? c.TIT_CPF ?? "";
                const progs    = programasPorCliente(cliId);
                const visiveis = progs.slice(0, 5);
                const extras   = progs.length - 5;

                return (
                  <div key={cliId} style={{ background: "#fff", borderRadius: 8, border: "1px solid #ebebeb", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#222", marginBottom: 2 }}>{nome}</div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>{mascaraCPF(cpf)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {visiveis.map((p) => {
                          const np = p.car_nome_programa ?? p.CAR_NOME_PROGRAMA ?? "";
                          return <ProgramaBolinha key={p.car_id ?? np} nome={np} size={40} />;
                        })}
                        {extras > 0 && (
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "50%", border: "2px dashed #f0a000", color: "#f0a000", fontSize: 12, fontWeight: 700 }}>
                            +{extras}
                          </span>
                        )}
                        {progs.length === 0 && <span style={{ fontSize: 12, color: "#ccc" }}>Sem programas</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 16 }}>
                      <Dropdown
                        menu={{
                          items: [
                            { key: "detalhe", icon: <EyeOutlined />,    label: "Detalhes", onClick: () => abrirDetalhe(c) },
                            { key: "editar",  icon: <EditOutlined />,   label: "Editar",  onClick: () => abrirEditar(c)  },
                            { key: "excluir", icon: <DeleteOutlined />, label: "Excluir", danger: true, onClick: () => abrirExcluir(c) },
                          ],
                        }}
                        trigger={["click"]}
                        placement="bottomRight"
                      >
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 18, padding: "4px 6px", borderRadius: 4 }}>
                          <MoreOutlined />
                        </button>
                      </Dropdown>

                      <button
                        onClick={() => abrirModalPrograma(c)}
                        style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #ccc", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#aaa", fontSize: 16 }}>
                        <PlusOutlined />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {clientesFiltrados.length > 0 && (
              <div style={{ textAlign: "right", fontSize: 12, color: "#aaa", marginTop: 14 }}>
                {clientesFiltrados.length} {clientesFiltrados.length === 1 ? "titular." : "titulares."}
              </div>
            )}
          </div>
        </Spin>
      </div>

      {/* ══ Modal NOVO TITULAR ══ */}
      <Modal open={modalNovo} onCancel={() => setModalNovo(false)} footer={null} width={420} destroyOnHidden closable={false} styles={{ body: { padding: "16px 16px 0" } }}>
        <ModalLayout
          title="Preencha as informações sobre o novo titular."
          onCancel={() => setModalNovo(false)}
          onConfirm={handleCadastrar}
          confirmLabel="CADASTRAR"
          saving={saving}
        >
          {/* Nome */}
          <FieldInput label="Nome" value={novoForm.nome} onChange={(v) => setNovo("nome", v)} placeholder="Ex. Fulano de Tal" />

          {/* Apelido + CPF */}
          <div style={{ display: "flex", gap: 12 }}>
            <FieldInput label="Apelido" value={novoForm.apelido} onChange={(v) => setNovo("apelido", v)} placeholder="Ex. Fulano" half />
            <FieldInput label="CPF:" value={novoForm.cpf}
              onChange={(v) => setNovo("cpf", mascaraCPF(v))}
              placeholder="XXX.XXX.XXX-XX"
              suffix={<NumberOutlined style={{ fontSize: 12 }} />}
              half
            />
          </div>

          {/* Email + Celular */}
          <div style={{ display: "flex", gap: 12 }}>
            <FieldInput label="Email" value={novoForm.email} onChange={(v) => setNovo("email", v)} placeholder="Ex. fulano@example.org" suffix={<MailOutlined style={{ fontSize: 12 }} />} half />
            <FieldInput label="Celular" value={novoForm.celular}
              onChange={(v) => setNovo("celular", mascaraTelefone(v))}
              placeholder="(XX) XXXXX-XXXXX"
              suffix={<PhoneOutlined style={{ fontSize: 12 }} />}
              half
            />
          </div>

          <SecaoComissao valor={novoForm.comissao} onChange={(v) => setNovo("comissao", v)} tipo={novoTipo} onTipo={setNovoTipo} />

          <SecaoBancaria banco={novoForm.banco} agencia={novoForm.agencia} conta={novoForm.conta} pix={novoForm.pix}
            onChange={(k, v) => setNovo(k, v)}
          />
        </ModalLayout>
      </Modal>

      {/* ══ Modal DETALHE ══ */}
      <Modal open={modalDetalhe} onCancel={() => setModalDetalhe(false)} footer={null} width={420} destroyOnHidden closable={true} styles={{ body: { padding: "16px 16px 0" } }}>
        {titularSel && (
          <ModalLayout
            title="Confirma as informações do titular abaixo."
            onCancel={() => setModalDetalhe(false)}
            onConfirm={() => setModalDetalhe(false)}
            confirmLabel="SALVAR"
          >
            {/* Nome — vem de cli_nome do PesquisaTitular */}
            <FieldInput label="Nome" value={tv(titularSel,"cli_nome")} readOnly />

            {/* Apelido (primeiro nome) + CPF — vem de cli_cpf */}
            <div style={{ display: "flex", gap: 12 }}>
              <FieldInput label="Apelido"
                value={tv(titularSel,"cli_nome","").split(" ")[0]}
                readOnly half
              />
              <FieldInput label="CPF:"
                value={mascaraCPF(tv(titularSel,"cli_cpf"))}
                suffix={<NumberOutlined style={{ fontSize: 12 }} />}
                readOnly half
              />
            </div>

            {/* Email + Celular — vem de cli_email e cli_telefone */}
            <div style={{ display: "flex", gap: 12 }}>
              <FieldInput label="Email"
                value={tv(titularSel,"cli_email")}
                suffix={<MailOutlined style={{ fontSize: 12 }} />}
                readOnly half
              />
              <FieldInput label="Celular"
                value={mascaraTelefone(tv(titularSel,"cli_telefone"))}
                suffix={<PhoneOutlined style={{ fontSize: 12 }} />}
                readOnly half
              />
            </div>

            {/* Comissão + dados bancários — vêm do PesquisaTitularAgregado (tit_*) se disponível */}
            <SecaoComissao
              valor={tv(titularSel,"tit_comissao","0")}
              tipo={detTipo} onTipo={setDetTipo}
              readOnly
            />

            <SecaoBancaria
              banco={tv(titularSel,"tit_banco")}
              agencia={tv(titularSel,"tit_agencia")}
              conta={tv(titularSel,"tit_conta")}
              pix={tv(titularSel,"tit_pix")}
              readOnly
            />
          </ModalLayout>
        )}
      </Modal>
      {/* ══ Modal NOVO PROGRAMA ══ */}
      <Modal
        open={modalPrograma}
        onCancel={() => setModalPrograma(false)}
        footer={null}
        width={520}
        destroyOnHidden
        closable={true}
        styles={{ body: { padding: "20px" } }}
      >
        {titularPrograma && (() => {
          const nome  = titularPrograma.cli_nome  ?? titularPrograma.CLI_NOME  ?? "—";
          const cpf   = String(titularPrograma.cli_cpf   ?? titularPrograma.CLI_CPF   ?? titularPrograma.tit_cpf ?? "");
          const email = titularPrograma.cli_email ?? titularPrograma.CLI_EMAIL ?? "";
          const temProgSel = !!progSel;

          const progsFiltrados = PROGRAMAS_LISTA.filter((p) =>
            !progBusca || p.nome.toLowerCase().includes(progBusca.toLowerCase())
          );

          return (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16 }}>
                Preencha as informações sobre a nova conta.
              </div>

              {/* Card titular */}
              <div style={{ background: "#f7f9fc", borderRadius: 8, border: "1px solid #e4e8ef", padding: "16px", marginBottom: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Titular</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>
                      {titularPrograma?.cli_nome ?? titularPrograma?.CLI_NOME ?? nome}
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                      {String(titularPrograma?.cli_cpf ?? titularPrograma?.CLI_CPF ?? cpf).replace(/\D/g,"")}
                    </div>
                  </div>
                  {/* Logo do programa selecionado */}
                  {temProgSel
                    ? <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 48, height: 48, borderRadius: "50%",
                        background: progSel.bg, color: "#fff", fontSize: 13, fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                      }}>{progSel.letra}</span>
                    : <span style={{
                        width: 48, height: 48, borderRadius: "50%",
                        border: "1.5px dashed #ccc",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "#bbb",
                      }}>LOGO</span>
                  }
                </div>

                {/* Titular select + Programa select */}
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  {/* Select Titular — funcional, lista todos os clientes */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Titular</div>
                    <select
                      value={String(titularPrograma?.cli_id ?? titularPrograma?.CLI_ID ?? "")}
                      onChange={(e) => {
                        const sel = clientes.find((c) => String(c.cli_id ?? c.CLI_ID) === e.target.value);
                        if (sel) {
                          setTitularPrograma(sel);
                          setProgEmail(sel.cli_email ?? sel.CLI_EMAIL ?? "");
                          setProgNumero(sel.cli_cpf   ?? sel.CLI_CPF  ?? "");
                        }
                      }}
                      style={{
                        width: "100%", height: 38, borderRadius: 6,
                        border: "1px solid #dde1e9", background: "#fff",
                        fontSize: 13, color: "#333",
                        padding: "0 10px", outline: "none", cursor: "pointer",
                      }}
                    >
                      {clientes.map((c) => {
                        const cliId   = c.cli_id  ?? c.CLI_ID  ?? "";
                        const cliNome = c.cli_nome ?? c.CLI_NOME ?? "—";
                        return (
                          <option key={String(cliId)} value={String(cliId)}>
                            {cliNome} ({cliNome.split(" ")[0]})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Select Programa */}
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Programa:</div>
                    <div
                      style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #dde1e9", borderRadius: 6, padding: "0 10px", height: 38, fontSize: 13, color: "#333", cursor: "pointer", userSelect: "none" }}
                      onClick={() => setProgBusca(progBusca === null ? "" : null)}
                    >
                      {progSel
                        ? <><LogoProgramaCircle prog={progSel} size={22} /><span style={{ marginLeft: 8 }}>{progSel.nome}</span></>
                        : <span style={{ color: "#bbb" }}>Selecione...</span>
                      }
                      <span style={{ marginLeft: "auto", color: "#bbb", fontSize: 11 }}>{progBusca === null ? "▴" : "▾"}</span>
                    </div>
                    {/* Dropdown lista de programas */}
                    {progBusca !== null && (
                      <div style={{ position: "absolute", top: 62, left: 0, right: 0, zIndex: 200, background: "#fff", borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid #dde1e9", maxHeight: 220, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
                          <input
                            autoFocus
                            value={progBusca || ""}
                            onChange={(e) => setProgBusca(e.target.value)}
                            placeholder="Buscar programa..."
                            style={{ width: "100%", border: "none", outline: "none", fontSize: 13, background: "transparent" }}
                          />
                        </div>
                        <div style={{ overflowY: "auto", flex: 1 }}>
                          {progsFiltrados.map((p) => (
                            <div
                              key={p.nome}
                              onClick={() => { setProgSel(p); setProgBusca(null); }}
                              style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "10px 14px", cursor: "pointer", fontSize: 13,
                                background: progSel?.nome === p.nome ? "#1e3a4a" : "#fff",
                                color: progSel?.nome === p.nome ? "#fff" : "#333",
                              }}
                              onMouseEnter={(e) => { if (progSel?.nome !== p.nome) e.currentTarget.style.background = "#f5f5f5"; }}
                              onMouseLeave={(e) => { if (progSel?.nome !== p.nome) e.currentTarget.style.background = "#fff"; }}
                            >
                              <LogoProgramaCircle prog={p} size={30} />
                              <span>{p.nome}</span>
                            </div>
                          ))}
                          {progsFiltrados.length === 0 && (
                            <div style={{ padding: "12px 14px", color: "#bbb", fontSize: 13 }}>Nenhum programa encontrado</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email + Número */}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Email no programa:</div>
                    <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #dde1e9", borderRadius: 6, padding: "0 10px", height: 38 }}>
                      <input
                        value={progEmail}
                        onChange={(e) => setProgEmail(e.target.value)}
                        placeholder={email || "email@exemplo.com"}
                        style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#333" }}
                      />
                      <MailOutlined style={{ color: "#bbb", fontSize: 13 }} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Número:</div>
                    <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #dde1e9", borderRadius: 6, padding: "0 10px", height: 38 }}>
                      <input
                        value={progNumero}
                        onChange={(e) => setProgNumero(e.target.value)}
                        placeholder="Número do programa"
                        style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#333" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setModalPrograma(false)}
                  style={{ padding: "8px 22px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#555" }}>
                  CANCELAR
                </button>
                <button onClick={handleCadastrarPrograma} disabled={savingProg}
                  style={{ padding: "8px 22px", borderRadius: 4, border: "none", background: savingProg ? "#bfbfbf" : "#1e3a4a", cursor: savingProg ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#fff" }}>
                  {savingProg ? "SALVANDO..." : "CADASTRAR"}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ══ Modal EDITAR TITULAR ══ */}
      <Modal open={modalEditar} onCancel={() => setModalEditar(false)} footer={null} width={420}
        destroyOnHidden closable={false} styles={{ body: { padding: "16px 16px 0" } }}>
        <ModalLayout
          title="Editar informações do titular."
          onCancel={() => setModalEditar(false)}
          onConfirm={handleAtualizarTitular}
          confirmLabel="SALVAR"
          saving={salvandoEdit}
        >
          <FieldInput label="Nome" value={editForm.nome}
            onChange={(v) => setEdit("nome", v)} placeholder="Nome completo" />

          <div style={{ display: "flex", gap: 12 }}>
            <FieldInput label="CPF:" value={editForm.cpf}
              onChange={(v) => setEdit("cpf", mascaraCPF(v))}
              placeholder="XXX.XXX.XXX-XX"
              suffix={<NumberOutlined style={{ fontSize: 12 }} />} half />
            <FieldInput label="Celular" value={editForm.celular}
              onChange={(v) => setEdit("celular", mascaraTelefone(v))}
              placeholder="(XX) XXXXX-XXXXX"
              suffix={<PhoneOutlined style={{ fontSize: 12 }} />} half />
          </div>

          <FieldInput label="Email" value={editForm.email}
            onChange={(v) => setEdit("email", v)}
            placeholder="email@exemplo.com"
            suffix={<MailOutlined style={{ fontSize: 12 }} />} />
        </ModalLayout>
      </Modal>

      {/* ══ Modal EXCLUIR TITULAR ══ */}
      <Modal open={modalExcluir} onCancel={() => setModalExcluir(false)} footer={null} width={400}
        destroyOnHidden closable styles={{ body: { padding: "24px" } }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: 8 }}>
            Excluir Titular
          </div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 6, lineHeight: 1.6 }}>
            Tem certeza que deseja excluir o titular
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#333", marginBottom: 6 }}>
            {titularExcluindo?.cli_nome ?? titularExcluindo?.CLI_NOME ?? ""}?
          </div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
            {mascaraCPF(titularExcluindo?.cli_cpf ?? titularExcluindo?.CLI_CPF ?? "")}
          </div>
          <div style={{ fontSize: 12, color: "#e00", marginBottom: 24 }}>
            Esta ação não pode ser desfeita.
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button onClick={() => setModalExcluir(false)}
              style={{ padding: "8px 24px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#555" }}>
              NÃO
            </button>
            <button onClick={handleExcluirTitular} disabled={excluindo}
              style={{ padding: "8px 24px", borderRadius: 4, border: "none", background: excluindo ? "#bfbfbf" : "#e00", color: "#fff", cursor: excluindo ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
              {excluindo ? "EXCLUINDO..." : "SIM, EXCLUIR"}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}