import React, { useState, useEffect } from "react";
import { Spin, Modal, message, Dropdown, DatePicker } from "antd";
import {
  CreditCardOutlined, FilterOutlined, MoreOutlined,
  PlusOutlined, MailOutlined, NumberOutlined, CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
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
  { keys: ["livelo"],                    bg: "#e800c5", letra: "LV"  },
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
  { keys: ["itaú empresas","itau empresas"], bg: "#874300", letra: "ITE" },
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
  return { bg: "#607d8b", letra: nome.slice(0, 2).toUpperCase() };
};

const LogoCircle = ({ nome, size = 40 }) => {
  const { bg, letra } = getLogo(nome);
  return (
    <span title={nome} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      background: bg, color: "#fff",
      fontSize: size * 0.28, fontWeight: 700, flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    }}>{letra}</span>
  );
};

// ── Lista de programas para o select ───────────────────────────────────
const PROGRAMAS_LISTA = [
  // ── Nacionais ──────────────────────────────────────────────────────
  { nome: "Livelo",                        bg: "#e800c5", letra: "LV"  },
  { nome: "Itaú Pontos",                   bg: "#ff6600", letra: "IT"  },
  { nome: "Smiles",                        bg: "#ff7700", letra: "S"   },
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
  { nome: "Nubank Rewards",                bg: "#820ad1", letra: "NU"  },
  { nome: "AILOS",                         bg: "#007b5e", letra: "AI"  },
  { nome: "Banestes Fidelidade",           bg: "#003087", letra: "BN"  },
  // ── Empresarial ────────────────────────────────────────────────────
  { nome: "BB Empresas",                   bg: "#f5a800", letra: "BB"  },
  { nome: "Esfera Empresas",               bg: "#8b0000", letra: "EE"  },
  { nome: "Itaú Empresas",                 bg: "#ff6600", letra: "ITE" },
  { nome: "Inter Empresas",                bg: "#ff6b00", letra: "IE"  },
  { nome: "Caixa Empresas",                bg: "#007b5e", letra: "CE"  },
  { nome: "Pontos BTG",                    bg: "#1a1a2e", letra: "BTG" },
  { nome: "Sicredi Empresarial",           bg: "#009900", letra: "SCE" },
  { nome: "Coopera PJ",                    bg: "#007b5e", letra: "CPJ" },
  // ── Internacionais ──────────────────────────────────────────────────
  { nome: "TAP Miles & Go",                bg: "#009900", letra: "TAP" },
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
  { nome: "Delta SkyMiles",                bg: "#c8102e", letra: "DL"  },
  { nome: "Emirates Skywards",             bg: "#c8102e", letra: "EK"  },
  { nome: "Flying Club Virgin Atlantic",   bg: "#e8003d", letra: "VS"  },
  { nome: "Finnair Plus",                  bg: "#003580", letra: "AY"  },
  { nome: "Wyndham Rewards",               bg: "#003087", letra: "WY"  },
];

// ── Componentes base ────────────────────────────────────────────────────
const Inp = ({ label, value, onChange, placeholder, suffix, readOnly, type = "text" }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    {label && <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>{label}</div>}
    <div style={{
      display: "flex", alignItems: "center",
      background: readOnly ? "#f4f6f9" : "#fff",
      border: "1px solid #dde1e9", borderRadius: 6,
      padding: "0 10px", minHeight: 36,
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

const Row2 = ({ children }) => (
  <div style={{ display: "flex", gap: 12 }}>{children}</div>
);

// ── Formatadores ────────────────────────────────────────────────────────
const fmtMilhas = (v) => Number(v || 0).toLocaleString("pt-BR");
const fmtReal   = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDelphi = (v) => Number(v || 0).toFixed(2).replace(".", ",");

// Máscara milhas: 3000 → 3.000, 9813000 → 9.813.000
const mascaraMilhas = (v = "") => {
  const nums = String(v).replace(/\D/g, "");
  if (!nums) return "";
  return Number(nums).toLocaleString("pt-BR");
};
// Remove máscara para enviar ao backend: "9.813.000" → "9813000"
const desmascaraMilhas = (v = "") => String(v).replace(/\./g, "");

// ══════════════════════════════════════════════════════════════════════
export default function Contas({ clienteId: clienteIdProp }) {
  const [loading, setLoading]     = useState(false);
  const [cartoes, setCartoes]     = useState([]);   // todos os cartões flat
  const [titulares, setTitulares] = useState([]);   // lista deduplic de titulares
  const [titular, setTitular]     = useState(null); // titular do gestor (para modais)
  const [clienteId, setClienteId] = useState(null);
  const [busca, setBusca]         = useState("");

  // Modal Editar Conta
  const [modalEditar, setModalEditar]       = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState(null);
  const [editSaldo, setEditSaldo]           = useState("");
  const [editCusto, setEditCusto]           = useState("0,00");
  const [editCpf, setEditCpf]               = useState("");
  const [editEmail, setEditEmail]           = useState("");
  const [editTelefone, setEditTelefone]     = useState("");
  const [editExpiracao, setEditExpiracao]   = useState("");
  const [salvandoEdit, setSalvandoEdit]     = useState(false);

  // Modal Excluir Conta
  const [modalExcluir, setModalExcluir]     = useState(false);
  const [cartaoExcluindo, setCartaoExcluindo] = useState(null);
  const [excluindo, setExcluindo]           = useState(false);

  // Modal Nova Conta (NOVA CONTA ou botão +)
  const [modalNova, setModalNova]       = useState(false);
  const [novaTitular, setNovaTitular]   = useState(null);
  const [novaProg, setNovaProg]         = useState(null);
  const [novaEmail, setNovaEmail]       = useState("");
  const [novaNumero, setNovaNumero]     = useState("");
  const [novaBusca, setNovaBusca]       = useState(null);
  const [savingNova, setSavingNova]     = useState(false);

  // Modal Abrir Conta (⋮ → Abrir Conta)
  const [modalAbrir, setModalAbrir]     = useState(false);
  const [cartaoSel, setCartaoSel]       = useState(null);
  const [abrirSaldo, setAbrirSaldo]     = useState("");
  const [abrirCusto, setAbrirCusto]     = useState("0,00");
  const [abrirExpiracao, setAbrirExpiracao] = useState("");  // "": não expira | "12"|"24"|"36"|"48"|"60": meses
  const [abrirCpfsUtil, setAbrirCpfsUtil] = useState("");
  const [cpfRegistros, setCpfRegistros] = useState([]); // [{data, qtde}]
  const [cpfData, setCpfData]           = useState(null);
  const [cpfQtde, setCpfQtde]           = useState("");
  const [savingAbrir, setSavingAbrir]   = useState(false);

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
      // 1. Busca todos os titulares do gestor
      // PesquisaTitular retorna: cli_id, cli_nome, cli_email, cli_cpf, car_id, car_nome_programa
      const titRes = await api.get("/ServerPrincipal/PesquisaTitular", { params: { Cliente: id } });
      const titRows = extractRows(titRes.data);

      // 2. Deduplica titulares pelo cli_id
      const seen = new Set();
      const titularesDeduplic = titRows.filter((t) => {
        const k = String(t.cli_id ?? t.CLI_ID ?? "");
        if (!k || k === "0" || seen.has(k)) return false;
        seen.add(k); return true;
      });

      // 3. Busca cartões de CADA titular individualmente (PesquisaCartoes usa cli_id do titular)
      // Faz todas as chamadas em paralelo
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
          });
        });
      });

      setTitulares(titularesDeduplic);
      setTitular(titularesDeduplic[0] || null);
      setCartoes(cartoesFlat);
    } catch (e) {
      message.error("Erro ao carregar contas.");
    } finally {
      setLoading(false);
    }
  };

  // ── Filtro ───────────────────────────────────────────────────────────
  const cartoesFiltrados = cartoes.filter((c) => {
    const q = busca.toLowerCase();
    const nome = (c.car_nome_programa || c.CAR_NOME_PROGRAMA || "").toLowerCase();
    return !q || nome.includes(q);
  });

  // ── Helpers ──────────────────────────────────────────────────────────
  const nomeCartao = (c) => {
    // cli_nome vem embutido no cartão (do PesquisaTitular LEFT JOIN)
    const tit  = c.cli_nome || c.CLI_NOME || titular?.cli_nome || "";
    const prog = c.car_nome_programa || c.CAR_NOME_PROGRAMA || "";
    return tit ? `${tit.split(" ")[0]} - ${prog}` : prog;
  };

  const saldoCartao    = (c) => Number(c.car_saldo_milhas    ?? c.CAR_SALDO_MILHAS    ?? 0);
  const custoCartao    = (c) => Number(c.car_vunitario       ?? c.CAR_VUNITARIO       ?? 0);
  const qtdeCpf        = (c) => Number(c.car_qtde_cpf        ?? c.CAR_QTDE_CPF        ?? 0);
  const cpfsUsados     = (c) => Number(c.car_cpfs_utilizados ?? c.CAR_CPFS_UTILIZADOS ?? 0);
  const temSaldo       = (c) => saldoCartao(c) > 0;

  // ── Editar Conta ─────────────────────────────────────────────────────
  const abrirEditar = (c) => {
    setCartaoEditando(c);
    setEditSaldo(mascaraMilhas(String(c.car_saldo_milhas ?? c.CAR_SALDO_MILHAS ?? "")));
    setEditCusto(
      Number(c.car_vunitario ?? c.CAR_VUNITARIO ?? 0).toFixed(2).replace(".", ",")
    );
    setEditCpf(String(c.car_qtde_cpf ?? c.CAR_QTDE_CPF ?? ""));
    setEditEmail(c.cli_email ?? c.CLI_EMAIL ?? "");
    setEditTelefone(c.cli_telefone ?? c.CLI_TELEFONE ?? "");
    setEditExpiracao("");
    setModalEditar(true);
  };

  const handleAtualizar = async () => {
    if (!editSaldo) { message.error("Informe o saldo."); return; }
    setSalvandoEdit(true);
    const carId = cartaoEditando?.car_id ?? cartaoEditando?.CAR_ID ?? 0;
    const prog  = cartaoEditando?.car_nome_programa ?? cartaoEditando?.CAR_NOME_PROGRAMA ?? "";

    // Calcula data de expiração
    const temExpiracao = !!editExpiracao;
    const hoje = new Date();
    let dataExp = "31/12/2099"; // não expira
    if (temExpiracao) {
      const dataFutura = new Date(hoje);
      dataFutura.setMonth(dataFutura.getMonth() + Number(editExpiracao));
      const d = String(dataFutura.getDate()).padStart(2,"0");
      const m = String(dataFutura.getMonth()+1).padStart(2,"0");
      const a = dataFutura.getFullYear();
      dataExp = `${d}/${m}/${a}`;
    }

    try {
      await api.post("/ServerPrincipal/AtualizarCartoes", {
        IDCartao:      Number(carId) || 0,
        NomePrograma:  prog,
        SaldoMilhas:   desmascaraMilhas(editSaldo),
        Status:        "1",
        Unitario:      editCusto.replace(/\./g, ""),   // vírgula decimal para StrToCurr
        CPF:           editCpf || "0",
        Email:         editEmail || "",
        Telefone:      editTelefone || "",
        DataExpiracao: dataExp,                         // DD/MM/YYYY para StrToDate
        Expira:        temExpiracao ? "1" : "0",        // 1 = expira, 0 = não expira
        QtdeExpira:    temExpiracao ? desmascaraMilhas(editSaldo) : "0", // saldo que expira
        IDPrograma:    "0",
      });
      message.success("Conta atualizada com sucesso!");
      setModalEditar(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao atualizar conta."));
    } finally {
      setSalvandoEdit(false);
    }
  };

  // ── Excluir Conta ─────────────────────────────────────────────────────
  const abrirExcluir = (c) => {
    setCartaoExcluindo(c);
    setModalExcluir(true);
  };

  const handleExcluir = async () => {
    if (!cartaoExcluindo) return;
    setExcluindo(true);
    const carId = cartaoExcluindo?.car_id ?? cartaoExcluindo?.CAR_ID ?? 0;
    try {
      await api.post("/ServerPrincipal/DeletarCartoes", {
        IDCartao: Number(carId) || 0,
      });
      message.success("Conta excluída com sucesso!");
      setModalExcluir(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao excluir conta."));
    } finally {
      setExcluindo(false);
    }
  };

  // ── Abrir modal Nova Conta ────────────────────────────────────────────
  const abrirNova = (cartaoBase = null) => {
    // Usa titular do cartão se disponível, senão o primeiro titular
    const titDoCartao = cartaoBase
      ? titulares.find((t) => String(t.cli_id ?? t.CLI_ID) === String(cartaoBase.cli_id)) || titulares[0]
      : titulares[0];
    setNovaTitular(titDoCartao || titular);
    setNovaProg(cartaoBase ? { nome: cartaoBase.car_nome_programa ?? "" } : null);
    setNovaEmail(titDoCartao?.cli_email || titular?.cli_email || "");
    setNovaNumero(titDoCartao?.cli_cpf  || titular?.cli_cpf  || "");
    setNovaBusca(null);
    setModalNova(true);
  };

  // ── Salvar Nova Conta ─────────────────────────────────────────────────
  const handleSalvarNova = async () => {
    if (!novaProg) { message.error("Selecione um programa."); return; }
    setSavingNova(true);
    try {
      const cliIdNova = novaTitular?.cli_id ?? novaTitular?.CLI_ID ?? clienteId;
      await api.post("/ServerPrincipal/InserirProgramas", {
        Nome:      novaProg.nome,
        Email:     novaEmail || "",
        Telefone:  novaNumero || "",
        IDCliente: String(cliIdNova),
      });
      message.success("Conta cadastrada com sucesso!");
      setModalNova(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao cadastrar conta."));
    } finally {
      setSavingNova(false);
    }
  };

  // ── Abrir modal Abrir Conta ───────────────────────────────────────────
  const abrirConta = (c) => {
    // Carrega o titular deste cartão para o modal
    const titDoCartao = titulares.find((t) => String(t.cli_id ?? t.CLI_ID) === String(c.cli_id));
    if (titDoCartao) setTitular(titDoCartao);
    setCartaoSel(c);
    setAbrirSaldo("");
    setAbrirCusto("0,00");
    setAbrirExpiracao("");
    setAbrirCpfsUtil(String(qtdeCpf(c) || ""));
    setCpfRegistros([]);
    setCpfData(null);
    setCpfQtde("");
    setModalAbrir(true);
  };

  // ── Registrar CPF na tabela local ─────────────────────────────────────
  const registrarCpf = () => {
    if (!cpfData) { message.error("Informe a data."); return; }
    if (!cpfQtde || Number(cpfQtde) <= 0) { message.error("Informe a quantidade."); return; }
    setCpfRegistros((p) => [...p, { data: cpfData.format("DD/MM/YYYY"), qtde: Number(cpfQtde) }]);
    setCpfData(null);
    setCpfQtde("");
  };

  // ── Salvar Abrir Conta ────────────────────────────────────────────────
  const handleSalvarAbrir = async () => {
    if (!abrirSaldo) { message.error("Informe o saldo inicial."); return; }
    if (!abrirCusto || abrirCusto === "0,00") { message.error("Informe o custo médio."); return; }
    setSavingAbrir(true);
    try {
      await api.post("/ServerPrincipal/InserirCartoes", {
        IDCliente:      String(clienteId || 0),
        IDCartao:       String(cartaoSel?.car_id ?? 0),
        SaldoMilhas:    desmascaraMilhas(abrirSaldo),
        Custo:          abrirCusto,
        // Delphi StrToDateTime espera DD/MM/YYYY HH:MM:SS com locale pt-BR
        DataExpiracao:  abrirExpiracao
          ? dayjs().add(Number(abrirExpiracao), "month").format("DD/MM/YYYY") + " 00:00:00"
          : "31/12/2099 00:00:00", // data fixa distante = não expira
        QtdeCPF:        String(Number(abrirCpfsUtil) || 0),
        Expira:         abrirExpiracao ? "1" : "0",
        NomePrograma:   cartaoSel?.car_nome_programa ?? "",
      });
      message.success("Conta aberta com sucesso!");
      setModalAbrir(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao abrir conta."));
    } finally {
      setSavingAbrir(false);
    }
  };

  const isAbrirValido = abrirSaldo && abrirCusto && abrirCusto !== "0,00";

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCardOutlined style={{ fontSize: 16, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Contas</span>
          </div>
          <button
            onClick={() => abrirNova()}
            style={{ background: "#1e3a4a", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }}
          >
            NOVA CONTA
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

            {/* Lista de cartões */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {cartoesFiltrados.length === 0 && !loading && (
                <div style={{ textAlign: "center", color: "#bbb", padding: "32px 0", fontSize: 13 }}>Nenhuma conta encontrada.</div>
              )}

              {cartoesFiltrados.map((c, idx) => {
                const nome  = nomeCartao(c);
                const prog  = c.car_nome_programa ?? c.CAR_NOME_PROGRAMA ?? "";
                const saldo = saldoCartao(c);
                const custo = custoCartao(c);
                const cpfLiv = qtdeCpf(c);
                const cpfUs  = cpfsUsados(c);
                const ativo  = temSaldo(c);

                return (
                  <div key={c.car_id ?? idx} style={{
                    display: "flex", alignItems: "center",
                    padding: "16px 4px",
                    borderBottom: "1px solid #f5f5f5",
                    background: idx % 2 === 1 ? "#fafbfc" : "#fff",
                  }}>
                    {/* Logo */}
                    <div style={{ marginRight: 14 }}>
                      <LogoCircle nome={prog} size={42} />
                    </div>

                    {/* Nome */}
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#222" }}>
                      {nome}
                    </div>

                    {/* Botão ABRIR CONTA (somente se sem saldo) */}
                    {!ativo && (
                      <button
                        onClick={() => abrirConta(c)}
                        style={{ marginRight: 16, padding: "5px 14px", fontSize: 12, border: "1px solid #dde1e9", borderRadius: 4, background: "#fff", cursor: "pointer", color: "#555", fontWeight: 500 }}
                      >
                        ABRIR CONTA
                      </button>
                    )}

                    {/* Stats (somente se tem saldo) */}
                    {ativo && (
                      <div style={{ display: "flex", alignItems: "center", gap: 24, marginRight: 12 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 1 }}>Saldo Disponível</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{fmtMilhas(saldo)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 1 }}>Custo Médio</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{fmtReal(custo)}</div>
                        </div>
                        {cpfLiv > 0 && (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 10, color: "#aaa", marginBottom: 1 }}>CPFs</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{cpfUs}/{cpfLiv}</div>
                          </div>
                        )}
                        {cpfLiv === 0 && (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 10, color: "#aaa", marginBottom: 1 }}>CPFs</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#bbb" }}>---</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Menu ⋮ */}
                    <Dropdown
                      menu={{
                        items: [
                          !ativo ? { key: "abrir", label: "Abrir Conta", onClick: () => abrirConta(c) } : null,
                          { key: "nova",   label: "Nova Conta",  onClick: () => abrirNova(c) },
                          { key: "editar",  label: "Editar",  onClick: () => abrirEditar(c)  },
                          { key: "excluir", label: "Excluir", danger: true, onClick: () => abrirExcluir(c) },
                        ].filter(Boolean),
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

      {/* ══ Modal NOVA CONTA ══ */}
      <Modal open={modalNova} onCancel={() => setModalNova(false)} footer={null} width={520} destroyOnHidden closable styles={{ body: { padding: "20px" } }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16 }}>
          Preencha as informações sobre a nova conta.
        </div>
        <div style={{ background: "#f7f9fc", borderRadius: 8, border: "1px solid #e4e8ef", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Header titular + logo — atualiza conforme seleção */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Titular</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>{novaTitular?.cli_nome ?? titular?.cli_nome ?? "—"}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{String(novaTitular?.cli_cpf ?? titular?.cli_cpf ?? "").replace(/\D/g,"")}</div>
            </div>
            {novaProg
              ? <LogoCircle nome={novaProg.nome} size={46} />
              : <span style={{ width: 46, height: 46, borderRadius: "50%", border: "1.5px dashed #ccc", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#bbb" }}>LOGO</span>
            }
          </div>

          {/* Titular select + Programa select */}
          <Row2>
            {/* Titular — select funcional com todos os titulares */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Titular</div>
              <select
                value={novaTitular ? String(novaTitular.cli_id ?? novaTitular.CLI_ID ?? "") : ""}
                onChange={(e) => {
                  const sel = titulares.find((t) => String(t.cli_id ?? t.CLI_ID) === e.target.value);
                  if (sel) {
                    setNovaTitular(sel);
                    setNovaEmail(sel.cli_email ?? sel.CLI_EMAIL ?? "");
                    setNovaNumero(sel.cli_cpf   ?? sel.CLI_CPF  ?? "");
                  }
                }}
                style={{
                  width: "100%", height: 36, borderRadius: 6,
                  border: "1px solid #dde1e9", background: "#fff",
                  fontSize: 13, color: "#333",
                  padding: "0 10px", outline: "none", cursor: "pointer",
                }}
              >
                {titulares.map((t) => {
                  const cliId  = t.cli_id  ?? t.CLI_ID  ?? "";
                  const nome   = t.cli_nome ?? t.CLI_NOME ?? "—";
                  const apelido = nome.split(" ")[0];
                  return (
                    <option key={cliId} value={String(cliId)}>
                      {nome} ({apelido})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Programa dropdown */}
            <div style={{ flex: 1, position: "relative" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Programa:</div>
              <div
                onClick={() => setNovaBusca(novaBusca === null ? "" : null)}
                style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #dde1e9", borderRadius: 6, padding: "0 10px", height: 36, fontSize: 13, cursor: "pointer", userSelect: "none", color: "#333" }}
              >
                {novaProg
                  ? <><LogoCircle nome={novaProg.nome} size={20} /><span style={{ marginLeft: 8 }}>{novaProg.nome}</span></>
                  : <span style={{ color: "#bbb" }}>Selecione...</span>
                }
                <span style={{ marginLeft: "auto", color: "#bbb", fontSize: 11 }}>{novaBusca === null ? "▴" : "▾"}</span>
              </div>
              {novaBusca !== null && (
                <div style={{ position: "absolute", top: 58, left: 0, right: 0, zIndex: 300, background: "#fff", borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid #dde1e9", maxHeight: 220, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "7px 10px", borderBottom: "1px solid #f0f0f0" }}>
                    <input autoFocus value={novaBusca || ""} onChange={(e) => setNovaBusca(e.target.value)}
                      placeholder="Buscar..." style={{ width: "100%", border: "none", outline: "none", fontSize: 13 }} />
                  </div>
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {PROGRAMAS_LISTA.filter((p) => !novaBusca || p.nome.toLowerCase().includes(novaBusca.toLowerCase())).map((p) => (
                      <div key={p.nome}
                        onClick={() => { setNovaProg(p); setNovaBusca(null); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", fontSize: 13, background: novaProg?.nome === p.nome ? "#1e3a4a" : "#fff", color: novaProg?.nome === p.nome ? "#fff" : "#333" }}
                        onMouseEnter={(e) => { if (novaProg?.nome !== p.nome) e.currentTarget.style.background = "#f5f5f5"; }}
                        onMouseLeave={(e) => { if (novaProg?.nome !== p.nome) e.currentTarget.style.background = "#fff"; }}
                      >
                        <LogoCircle nome={p.nome} size={28} />
                        <span>{p.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Row2>

          {/* Email + Número */}
          <Row2>
            <Inp label="Email no programa:" value={novaEmail} onChange={setNovaEmail} placeholder="email@exemplo.com" suffix={<MailOutlined style={{ fontSize: 12 }} />} />
            <Inp label="Número:" value={novaNumero} onChange={setNovaNumero} placeholder="Número do programa" />
          </Row2>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={() => setModalNova(false)} style={{ padding: "7px 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#555" }}>
            CANCELAR
          </button>
          <button onClick={handleSalvarNova} disabled={savingNova || !novaProg}
            style={{ padding: "7px 20px", borderRadius: 4, border: "none", background: savingNova || !novaProg ? "#bfbfbf" : "#1e3a4a", color: "#fff", cursor: savingNova || !novaProg ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
            {savingNova ? "SALVANDO..." : "CADASTRAR"}
          </button>
        </div>
      </Modal>

      {/* ══ Modal ABRIR CONTA ══ */}
      <Modal open={modalAbrir} onCancel={() => setModalAbrir(false)} footer={null} width={560} destroyOnHidden closable styles={{ body: { padding: "20px" } }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16 }}>
          Preencha as informações para abertura da conta.
        </div>
        <div style={{ background: "#f7f9fc", borderRadius: 8, border: "1px solid #e4e8ef", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Header titular + logo */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Titular</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>{titular?.cli_nome ?? "—"}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{String(titular?.cli_cpf ?? "").replace(/\D/g,"")}</div>
            </div>
            <LogoCircle nome={cartaoSel?.car_nome_programa ?? ""} size={46} />
          </div>

          {/* Saldo Inicial + Custo Médio */}
          <Row2>
            <Inp label="Saldo Inicial" value={abrirSaldo} onChange={(v) => setAbrirSaldo(mascaraMilhas(v))} placeholder="" suffix={<NumberOutlined style={{ fontSize: 12 }} />} />
            <Inp label="Custo Médio:" value={abrirCusto} onChange={setAbrirCusto} placeholder="0,00" suffix={<span style={{ fontSize: 12 }}>$</span>} />
          </Row2>

          {/* Expiração + CPFs utilizados */}
          <Row2>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Data de Expiração:</div>
              <select
                value={abrirExpiracao}
                onChange={(e) => setAbrirExpiracao(e.target.value)}
                style={{
                  width: "100%", height: 36, borderRadius: 6,
                  border: "1px solid #dde1e9", background: "#fff",
                  fontSize: 13, color: abrirExpiracao ? "#333" : "#aaa",
                  padding: "0 10px", outline: "none", cursor: "pointer",
                }}
              >
                <option value="">Não expira</option>
                <option value="12">12 meses</option>
                <option value="24">24 meses</option>
                <option value="36">36 meses</option>
                <option value="48">48 meses</option>
                <option value="60">60 meses</option>
              </select>
            </div>
            <Inp label="CPFs utilizados:" value={abrirCpfsUtil} onChange={setAbrirCpfsUtil} placeholder="" suffix={<NumberOutlined style={{ fontSize: 12 }} />} />
          </Row2>

          {/* Seção CPFs já utilizados */}
          <div style={{ borderTop: "1px solid #e0e4ea", paddingTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#222", marginBottom: 4 }}>CPFs já utilizados</div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
              Você pode registrar o uso de até {abrirCpfsUtil || 10} CPFs neste programa.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {/* Tabela esquerda */}
              <div style={{ flex: 1, border: "1px solid #e0e4ea", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ display: "flex", background: "#f5f7fa", borderBottom: "1px solid #e0e4ea" }}>
                  <div style={{ flex: 1, padding: "7px 10px", fontSize: 11, fontWeight: 600, color: "#555" }}>Data Emissão</div>
                  <div style={{ flex: 1, padding: "7px 10px", fontSize: 11, fontWeight: 600, color: "#555" }}>Qtde CPFs</div>
                </div>
                {cpfRegistros.length === 0 ? (
                  <div style={{ padding: "16px 10px", fontSize: 12, color: "#aaa", textAlign: "center", lineHeight: 1.6 }}>
                    Use o formulário ao lado para registrar a utilização de CPFs em sua conta.
                  </div>
                ) : (
                  cpfRegistros.map((r, i) => (
                    <div key={i} style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ flex: 1, padding: "7px 10px", fontSize: 12, color: "#333" }}>{r.data}</div>
                      <div style={{ flex: 1, padding: "7px 10px", fontSize: 12, color: "#333" }}>{r.qtde}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Formulário direita */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Data de Emissão:</div>
                  <DatePicker
                    value={cpfData}
                    onChange={setCpfData}
                    format="DD/MM/YYYY"
                    style={{ width: "100%", borderColor: "#dde1e9", borderRadius: 6, height: 36 }}
                    suffixIcon={<CalendarOutlined style={{ color: "#bbb" }} />}
                  />
                </div>
                <Inp label="Quantidade de CPFs:" value={cpfQtde} onChange={setCpfQtde} placeholder="" suffix={<NumberOutlined style={{ fontSize: 12 }} />} type="number" />
                <button
                  onClick={registrarCpf}
                  style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid #dde1e9", background: cpfData && cpfQtde ? "#1e3a4a" : "#f0f0f0", color: cpfData && cpfQtde ? "#fff" : "#bbb", fontSize: 12, fontWeight: 600, cursor: cpfData && cpfQtde ? "pointer" : "not-allowed", alignSelf: "flex-start" }}
                >
                  REGISTRAR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={() => setModalAbrir(false)} style={{ padding: "7px 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#555" }}>
            CANCELAR
          </button>
          <button onClick={handleSalvarAbrir} disabled={savingAbrir || !isAbrirValido}
            style={{ padding: "7px 20px", borderRadius: 4, border: "none", background: savingAbrir || !isAbrirValido ? "#bfbfbf" : "#1e3a4a", color: "#fff", cursor: savingAbrir || !isAbrirValido ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
            {savingAbrir ? "SALVANDO..." : "PREENCHA OS DADOS!"}
          </button>
        </div>
      </Modal>
      {/* ══ Modal EDITAR CONTA ══ */}
      <Modal open={modalEditar} onCancel={() => setModalEditar(false)} footer={null} width={500}
        destroyOnHidden closable styles={{ body: { padding: "20px" } }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16 }}>
          Atualizar dados da conta.
        </div>
        <div style={{ background: "#f7f9fc", borderRadius: 8, border: "1px solid #e4e8ef", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Titular</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>
                {cartaoEditando?.cli_nome ?? cartaoEditando?.CLI_NOME ?? "—"}
              </div>
            </div>
            <LogoCircle nome={cartaoEditando?.car_nome_programa ?? ""} size={46} />
          </div>

          <div style={{ borderTop: "1px solid #e0e4ea" }} />

          {/* Saldo + Custo Médio */}
          <Row2>
            <Inp label="Saldo de Milhas" value={editSaldo}
              onChange={(v) => setEditSaldo(mascaraMilhas(v))}
              suffix={<NumberOutlined style={{ fontSize: 12 }} />} />
            <Inp label="Custo Médio (R$/1000)" value={editCusto}
              onChange={setEditCusto} placeholder="0,00"
              suffix={<span style={{ fontSize: 12 }}>$</span>} />
          </Row2>

          {/* CPFs + Email */}
          <Row2>
            <Inp label="Qtde CPFs" value={editCpf}
              onChange={(v) => setEditCpf(v.replace(/\D/g, ""))}
              suffix={<NumberOutlined style={{ fontSize: 12 }} />} />
            <Inp label="Email" value={editEmail}
              onChange={setEditEmail} placeholder="email@exemplo.com"
              suffix={<MailOutlined style={{ fontSize: 12 }} />} />
          </Row2>

          {/* Telefone + Expiração */}
          <Row2>
            <Inp label="Telefone" value={editTelefone}
              onChange={setEditTelefone} placeholder="(00) 00000-0000" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Expiração</div>
              <select value={editExpiracao} onChange={(e) => setEditExpiracao(e.target.value)}
                style={{ width: "100%", height: 36, borderRadius: 6, border: "1px solid #dde1e9", background: "#fff", fontSize: 13, color: "#333", padding: "0 10px", outline: "none", cursor: "pointer" }}>
                <option value="">Não expira</option>
                <option value="12">12 meses</option>
                <option value="24">24 meses</option>
                <option value="36">36 meses</option>
                <option value="48">48 meses</option>
                <option value="60">60 meses</option>
              </select>
            </div>
          </Row2>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={() => setModalEditar(false)}
            style={{ padding: "7px 22px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#555" }}>
            CANCELAR
          </button>
          <button onClick={handleAtualizar} disabled={salvandoEdit}
            style={{ padding: "7px 22px", borderRadius: 4, border: "none", background: salvandoEdit ? "#bfbfbf" : "#1e3a4a", color: "#fff", cursor: salvandoEdit ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
            {salvandoEdit ? "SALVANDO..." : "SALVAR"}
          </button>
        </div>
      </Modal>

      {/* ══ Modal EXCLUIR CONTA ══ */}
      <Modal open={modalExcluir} onCancel={() => setModalExcluir(false)} footer={null} width={400}
        destroyOnHidden closable styles={{ body: { padding: "24px" } }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: 8 }}>
            Excluir Conta
          </div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 6, lineHeight: 1.6 }}>
            Tem certeza que deseja excluir a conta
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#333", marginBottom: 6 }}>
            {cartaoExcluindo?.cli_nome ?? ""} — {cartaoExcluindo?.car_nome_programa ?? ""}?
          </div>
          {(cartaoExcluindo?.car_saldo_milhas ?? 0) > 0 && (
            <div style={{ fontSize: 12, color: "#f0a000", marginBottom: 16 }}>
              ⚠️ Esta conta possui {fmtMilhas(cartaoExcluindo?.car_saldo_milhas)} milhas. O saldo será removido.
            </div>
          )}
          <div style={{ fontSize: 12, color: "#e00", marginBottom: 24 }}>Esta ação não pode ser desfeita.</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button onClick={() => setModalExcluir(false)}
              style={{ padding: "8px 24px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#555" }}>
              NÃO
            </button>
            <button onClick={handleExcluir} disabled={excluindo}
              style={{ padding: "8px 24px", borderRadius: 4, border: "none", background: excluindo ? "#bfbfbf" : "#e00", color: "#fff", cursor: excluindo ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
              {excluindo ? "EXCLUINDO..." : "SIM, EXCLUIR"}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}