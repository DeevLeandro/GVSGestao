import React, { useState, useEffect } from "react";
import { Spin, Modal, message, Dropdown } from "antd";
import {
  CreditCardOutlined, FilterOutlined, MoreOutlined,
  EditOutlined, DeleteOutlined,
  EyeOutlined,
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

// ── Bandeiras de cartão ─────────────────────────────────────────────────
const BANDEIRAS = [
  "Visa", "Mastercard", "American Express", "Elo", "Hipercard",
  "Diners Club", "Discover", "JCB", "Aura", "Cabal",
];

// Ícone simples por bandeira
const iconeBandeira = (bandeira = "") => {
  const b = bandeira.toLowerCase();
  const cores = {
    visa:       { bg: "#1a1f71", letra: "VISA"  },
    mastercard: { bg: "#eb001b", letra: "MC"    },
    elo:        { bg: "#ff5f00", letra: "ELO"   },
    american:   { bg: "#006fcf", letra: "AMEX"  },
    hipercard:  { bg: "#cc0000", letra: "HIPER" },
    diners:     { bg: "#004a97", letra: "DC"    },
    discover:   { bg: "#ff6600", letra: "DISC"  },
  };
  for (const [key, val] of Object.entries(cores)) {
    if (b.includes(key)) return val;
  }
  return { bg: "#607d8b", letra: (bandeira || "??").slice(0, 2).toUpperCase() };
};

const BandeiraCircle = ({ bandeira, size = 42 }) => {
  const { bg, letra } = iconeBandeira(bandeira);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: 8,
      background: bg, color: "#fff",
      fontSize: size * 0.22, fontWeight: 800, flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)", letterSpacing: "0.03em",
    }}>{letra}</span>
  );
};

// ── Máscaras ────────────────────────────────────────────────────────────
const mascaraValidade = (v = "") => {
  const d = v.replace(/\D/g, "").slice(0, 6);
  if (d.length <= 2) return d;
  return `${d.slice(0,2)}/${d.slice(2)}`;
};

// ══════════════════════════════════════════════════════════════════════
export default function Cartoes({ clienteId: clienteIdProp }) {
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [cartoes, setCartoes]     = useState([]);
  const [titulares, setTitulares] = useState([]);
  const [clienteId, setClienteId] = useState(null);
  const [busca, setBusca]         = useState("");

  // Modal Editar
  const [modalEditar, setModalEditar]         = useState(false);
  const [cartaoEditando, setCartaoEditando]   = useState(null);
  const [editBandeira, setEditBandeira]       = useState("");
  const [editNome, setEditNome]               = useState("");
  const [editNumero, setEditNumero]           = useState("");
  const [editValidade, setEditValidade]       = useState("");
  const [editVencimento, setEditVencimento]   = useState("");
  const [salvandoEdit, setSalvandoEdit]       = useState(false);

  // Modal Excluir
  const [modalExcluir, setModalExcluir]       = useState(false);
  const [cartaoExcluindo, setCartaoExcluindo] = useState(null);
  const [excluindo, setExcluindo]             = useState(false);

  // Modal Detalhe
  const [modalDetalhe, setModalDetalhe] = useState(false);
  const [cartaoDetalhe, setCartaoDetalhe] = useState(null);
  const [mostrarDados, setMostrarDados]   = useState(false);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  // Modal Novo Cartão
  const [modalNovo, setModalNovo]         = useState(false);
  const [novaTitularId, setNovaTitularId] = useState("");
  const [novoNomeCartao, setNovoNomeCartao] = useState("");
  const [novoBandeira, setNovoBandeira]   = useState("");
  const [novoNomePessoa, setNovoNomePessoa] = useState("");
  const [novoUltimos4, setNovoUltimos4]   = useState("");
  const [novoValidade, setNovoValidade]   = useState("");
  const [novoVencimento, setNovoVencimento] = useState("");

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
      const [carRes, titRes] = await Promise.all([
        api.get("/ServerPrincipal/PesquisaCartaoCredito", { params: { Cliente: id } }),
        api.get("/ServerPrincipal/PesquisaTitular",       { params: { Cliente: id } }),
      ]);
      setCartoes(extractRows(carRes.data));

      // Deduplica titulares pelo cli_id
      const titRows = extractRows(titRes.data);
      const seen = new Set();
      setTitulares(titRows.filter((t) => {
        const k = String(t.cli_id ?? t.CLI_ID ?? "");
        if (!k || k === "0" || seen.has(k)) return false;
        seen.add(k); return true;
      }));
    } catch (e) {
      message.error("Erro ao carregar cartões.");
    } finally {
      setLoading(false);
    }
  };

  // ── Filtro ────────────────────────────────────────────────────────────
  const cartoesFiltrados = cartoes.filter((c) => {
    const q = busca.toLowerCase();
    const nome    = (c.cre_nome_cartao ?? c.CRE_NOME_CARTAO ?? "").toLowerCase();
    const bandeira = (c.cre_bandeira   ?? c.CRE_BANDEIRA    ?? "").toLowerCase();
    const cliNome  = (c.cli_nome       ?? c.CLI_NOME        ?? "").toLowerCase();
    return !q || nome.includes(q) || bandeira.includes(q) || cliNome.includes(q);
  });

  // ── Editar cartão ────────────────────────────────────────────────────
  const abrirEditar = (c) => {
    setCartaoEditando(c);
    setEditBandeira(c.cre_bandeira    ?? c.CRE_BANDEIRA    ?? "");
    setEditNome(c.cre_nome_cartao     ?? c.CRE_NOME_CARTAO ?? "");
    setEditNumero(c.cre_numero        ?? c.CRE_NUMERO      ?? "");
    setEditValidade(c.cre_validade    ?? c.CRE_VALIDADE    ?? "");
    setEditVencimento(c.cre_cvv       ?? c.CRE_CVV         ?? "");
    setModalEditar(true);
  };

  const handleAtualizar = async () => {
    if (!editBandeira.trim())   { message.error("Informe a bandeira."); return; }
    if (!editNumero.trim())     { message.error("Informe os últimos 4 dígitos."); return; }
    if (!editValidade.trim())   { message.error("Informe a validade."); return; }
    if (!editVencimento.trim()) { message.error("Informe o vencimento."); return; }
    setSalvandoEdit(true);
    const creId = String(cartaoEditando?.cre_id ?? cartaoEditando?.CRE_ID ?? "");
    try {
      await api.post("/ServerPrincipal/AtualizarCartaoCredito", {
        Nome:      editNome,
        Numero:    editNumero,
        Bandeira:  editBandeira,
        Validade:  editValidade,
        CVV:       editVencimento,
        IDCredito: Number(creId) || 0,
      });
      message.success("Cartão atualizado com sucesso!");
      setModalEditar(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao atualizar cartão."));
    } finally {
      setSalvandoEdit(false);
    }
  };

  // ── Excluir cartão ────────────────────────────────────────────────────
  const abrirExcluir = (c) => {
    setCartaoExcluindo(c);
    setModalExcluir(true);
  };

  const handleExcluir = async () => {
    if (!cartaoExcluindo) return;
    setExcluindo(true);
    const creId = String(cartaoExcluindo?.cre_id ?? cartaoExcluindo?.CRE_ID ?? "");
    try {
      await api.post("/ServerPrincipal/DeletarCredito", { IDCredito: Number(creId) || 0 });
      message.success("Cartão excluído com sucesso!");
      setModalExcluir(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao excluir cartão."));
    } finally {
      setExcluindo(false);
    }
  };

  // ── Abrir detalhe ────────────────────────────────────────────────────
  const abrirDetalhe = async (c) => {
    setCartaoDetalhe(c);   // abre com dados já disponíveis
    setMostrarDados(false);
    setModalDetalhe(true);

    // Recarrega todos os cartões do cliente deste cartão para garantir dados completos
    const cliId = c.cli_id ?? c.CLI_ID ?? clienteId;
    setLoadingDetalhe(true);
    try {
      const res = await api.get("/ServerPrincipal/PesquisaCartaoCredito", { params: { Cliente: cliId } });
      const rows = extractRows(res.data);
      const creId = String(c.cre_id ?? c.CRE_ID ?? "");
      const match = rows.find((r) => String(r.cre_id ?? r.CRE_ID ?? "") === creId);
      if (match) setCartaoDetalhe(match);
    } catch (e) {
      // mantém dados já carregados
    } finally {
      setLoadingDetalhe(false);
    }
  };

  // ── Abrir modal ───────────────────────────────────────────────────────
  const abrirModalNovo = () => {
    // Pré-seleciona o primeiro titular e preenche nome
    const primTit = titulares[0];
    setNovaTitularId(primTit ? String(primTit.cli_id ?? primTit.CLI_ID ?? "") : "");
    setNovoNomePessoa(primTit?.cli_nome ?? "");
    setNovoNomeCartao("");
    setNovoBandeira("");
    setNovoUltimos4("");
    setNovoValidade("");
    setNovoVencimento("");
    setModalNovo(true);
  };

  const handleTitularChange = (cliId) => {
    setNovaTitularId(cliId);
    const sel = titulares.find((t) => String(t.cli_id ?? t.CLI_ID) === cliId);
    setNovoNomePessoa(sel?.cli_nome ?? "");
  };

  // ── Salvar ────────────────────────────────────────────────────────────
  const handleSalvar = async () => {
    if (!novoBandeira.trim())    { message.error("Informe o cartão/bandeira."); return; }
    if (!novoUltimos4.trim())    { message.error("Informe os últimos 4 dígitos."); return; }
    if (!novoValidade.trim())    { message.error("Informe a validade."); return; }
    if (!novoVencimento.trim())  { message.error("Informe o dia de vencimento."); return; }

    setSaving(true);
    try {
      await api.post("/ServerPrincipal/InserirCartaoCredito", {
        Nome:      novoNomePessoa || novoNomeCartao,
        Numero:    novoUltimos4,
        Bandeira:  novoBandeira,
        Validade:  novoValidade,
        CVV:       novoVencimento, // usa campo CVV para vencimento conforme backend
        IDCliente: String(novaTitularId || clienteId || 0),
      });
      message.success("Cartão cadastrado com sucesso!");
      setModalNovo(false);
      carregarDados(clienteId);
    } catch (e) {
      message.error(getErroMsg(e, "Erro ao cadastrar cartão."));
    } finally {
      setSaving(false);
    }
  };

  const isValido = novoBandeira && novoUltimos4 && novoValidade && novoVencimento;

  // ── Helpers de campo ──────────────────────────────────────────────────
  const Campo = ({ label, value, onChange, placeholder, readOnly, maxLength, style = {} }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
      <input
        readOnly={readOnly}
        value={value ?? ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder || ""}
        maxLength={maxLength}
        style={{
          width: "100%", boxSizing: "border-box",
          border: "1px solid #dde1e9", borderRadius: 6,
          padding: "7px 10px", fontSize: 13,
          background: readOnly ? "#f4f6f9" : "#fff",
          color: "#333", outline: "none",
          ...style,
        }}
      />
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCardOutlined style={{ fontSize: 16, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Cartões de Crédito</span>
          </div>
          <button
            onClick={abrirModalNovo}
            style={{ background: "#1e3a4a", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }}
          >
            NOVO CARTÃO
          </button>
        </div>

        <Spin spinning={loading}>
          <div style={{ padding: "16px 20px" }}>

            {/* Busca */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#eef1f5", borderRadius: 6, padding: "8px 14px", marginBottom: 16 }}>
              <FilterOutlined style={{ color: "#aaa", fontSize: 15 }} />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#333", width: "100%" }}
              />
            </div>

            {/* Lista */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {cartoesFiltrados.length === 0 && !loading && (
                <div style={{ textAlign: "center", color: "#bbb", padding: "32px 0", fontSize: 13 }}>
                  Nenhum cartão encontrado.
                </div>
              )}

              {cartoesFiltrados.map((c, idx) => {
                const bandeira = c.cre_bandeira    ?? c.CRE_BANDEIRA    ?? "";
                const nome     = c.cre_nome_cartao ?? c.CRE_NOME_CARTAO ?? bandeira;
                const cliNome  = c.cli_nome        ?? c.CLI_NOME        ?? "";
                const numero   = c.cre_numero      ?? c.CRE_NUMERO      ?? "";
                const validade = c.cre_validade     ?? c.CRE_VALIDADE    ?? "";

                return (
                  <div key={c.cre_id ?? idx} style={{
                    display: "flex", alignItems: "center",
                    padding: "14px 8px",
                    borderBottom: "1px solid #f5f5f5",
                    background: "#fff",
                  }}>
                    {/* Ícone bandeira */}
                    <div style={{ marginRight: 14 }}>
                      <BandeiraCircle bandeira={bandeira} size={42} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>
                        {nome || bandeira}
                      </div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        {cliNome}
                        {numero ? ` • •••• ${numero}` : ""}
                        {validade ? ` • ${validade}` : ""}
                      </div>
                    </div>

                    {/* Menu ⋮ */}
                    <Dropdown
                      menu={{
                        items: [
                          { key: "detalhe", icon: <EyeOutlined />,    label: "Detalhes", onClick: () => abrirDetalhe(c) },
                          { key: "editar",  icon: <EditOutlined />,   label: "Editar",   onClick: () => abrirEditar(c)  },
                          { key: "excluir", icon: <DeleteOutlined />, label: "Excluir",  danger: true, onClick: () => abrirExcluir(c) },
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

            {/* Contador */}
            {cartoesFiltrados.length > 0 && (
              <div style={{ textAlign: "right", fontSize: 12, color: "#aaa", marginTop: 14 }}>
                {cartoesFiltrados.length} {cartoesFiltrados.length === 1 ? "cartão." : "cartões."}
              </div>
            )}
          </div>
        </Spin>
      </div>

      {/* ══ Modal NOVO CARTÃO ══ */}
      <Modal
        open={modalNovo}
        onCancel={() => setModalNovo(false)}
        footer={null}
        width={680}
        destroyOnHidden
        closable
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16 }}>
          Preencha as informações do novo cartão.
        </div>

        <div style={{ background: "#f7f9fc", borderRadius: 8, border: "1px solid #e4e8ef", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Titular + Cartão (bandeira) */}
          <div style={{ display: "flex", gap: 12 }}>
            {/* Select Titular */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Titular associado ao cartão</div>
              <select
                value={novaTitularId}
                onChange={(e) => handleTitularChange(e.target.value)}
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
                    <option key={String(cliId)} value={String(cliId)}>
                      {nome} ({apelido})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Bandeira do cartão - input texto */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Cartão</div>
              <input
                value={novoBandeira}
                onChange={(e) => setNovoBandeira(e.target.value)}
                placeholder="Ex. Visa, Mastercard"
                list="bandeiras-list"
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: "1px solid #dde1e9", borderRadius: 6,
                  padding: "7px 10px", fontSize: 13,
                  background: "#fff", color: "#333", outline: "none", height: 36,
                }}
              />
              <datalist id="bandeiras-list">
                {BANDEIRAS.map((b) => <option key={b} value={b} />)}
              </datalist>
            </div>
          </div>

          {/* Linha 2: Nome no cartão + Últimos 4 dígitos */}
          <div style={{ display: "flex", gap: 12 }}>
            <Campo
              label="Nome da Pessoa no Cartão"
              value={novoNomePessoa}
              onChange={setNovoNomePessoa}
              placeholder="Como aparece no cartão"
            />
            <div style={{ flex: "0 0 140px" }}>
              <Campo
                label="Últimos 4 dígitos"
                value={novoUltimos4}
                onChange={(v) => setNovoUltimos4(v.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                maxLength={4}
              />
            </div>
          </div>

          {/* Linha 3: Validade + Dia de Vencimento */}
          <div style={{ display: "flex", gap: 12 }}>
            <Campo
              label="Validade do Cartão"
              value={novoValidade}
              onChange={(v) => setNovoValidade(mascaraValidade(v))}
              placeholder="MM/AAAA"
              maxLength={7}
            />
            <Campo
              label="Dia de Vencimento da Fatura"
              value={novoVencimento}
              onChange={(v) => setNovoVencimento(v.replace(/\D/g, "").slice(0, 2))}
              placeholder="00"
              maxLength={2}
            />
          </div>
        </div>

        {/* Botões */}
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
            style={{ padding: "7px 22px", borderRadius: 4, border: "none", background: saving || !isValido ? "#bfbfbf" : "#1e3a4a", color: "#fff", cursor: saving || !isValido ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em" }}
          >
            {saving ? "SALVANDO..." : isValido ? "CADASTRAR" : "PREENCHA OS DADOS!"}
          </button>
        </div>
      </Modal>
      {/* ══ Modal DETALHE DO CARTÃO ══ */}
      <Modal
        open={modalDetalhe}
        onCancel={() => setModalDetalhe(false)}
        footer={null}
        width={520}
        destroyOnHidden
        closable
        styles={{ body: { padding: "24px" } }}
        title={null}
      >
        {cartaoDetalhe && (() => {
          const cd  = cartaoDetalhe;
          // Tenta todas as variações de campo (minúsculo e maiúsculo)
          const fld = (k) => {
            const v = cd[k] ?? cd[k?.toUpperCase()] ?? cd[k?.toLowerCase()] ?? "";
            return String(v).trim();
          };
          const bandeira  = fld("cre_bandeira")   || fld("CRE_BANDEIRA");
          const nomeCartao= fld("cre_nome_cartao") || fld("CRE_NOME_CARTAO");
          const numero    = fld("cre_numero")      || fld("CRE_NUMERO");
          const validade  = fld("cre_validade")    || fld("CRE_VALIDADE");
          const cvv       = fld("cre_cvv")         || fld("CRE_CVV");
          const cliNome   = fld("cli_nome")        || fld("CLI_NOME");
          const cliEmail  = fld("cli_email")       || fld("CLI_EMAIL");
          const cliTel    = fld("cli_telefone")    || fld("CLI_TELEFONE");

          const CampoDetalhe = ({ label, value, oculto }) => (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>{label}</div>
              <div style={{ background: "#f0f2f5", borderRadius: 6, border: "1px solid #e0e4ea", padding: "7px 10px", fontSize: 13, color: "#333", textAlign: "center", letterSpacing: oculto ? "0.15em" : "normal" }}>
                {oculto && !mostrarDados ? "••••••" : (value || "—")}
              </div>
            </div>
          );

          return (
            <Spin spinning={loadingDetalhe}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16 }}>
                Detalhes do Cartão
              </div>

              <div style={{ background: "#f7f9fc", borderRadius: 8, border: "1px solid #e4e8ef", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Header titular + logo bandeira */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Titular</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>{cliNome || "—"}</div>
                    {cliEmail && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{cliEmail}</div>}
                    {cliTel   && <div style={{ fontSize: 12, color: "#888" }}>{cliTel}</div>}
                  </div>
                  <BandeiraCircle bandeira={bandeira || nomeCartao} size={48} />
                </div>

                <div style={{ borderTop: "1px solid #e0e4ea" }} />

                {/* Nome no cartão + Bandeira */}
                <div style={{ display: "flex", gap: 12 }}>
                  <CampoDetalhe label="Nome no Cartão" value={nomeCartao} />
                  <CampoDetalhe label="Bandeira"       value={bandeira}   />
                </div>

                {/* Número + Validade + Vencimento */}
                <div style={{ display: "flex", gap: 12 }}>
                  <CampoDetalhe label="Últimos 4 dígitos"    value={numero  ? `•••• ${numero}`  : "—"} oculto />
                  <CampoDetalhe label="Validade"             value={validade} oculto />
                  <CampoDetalhe label="Dia de Vencimento"    value={cvv}      oculto />
                </div>

                {/* Botão mostrar/ocultar dados sensíveis */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={() => setMostrarDados((v) => !v)}
                    style={{
                      padding: "6px 18px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                      border: "1px solid #dde1e9", background: mostrarDados ? "#f0f2f5" : "#1e3a4a",
                      color: mostrarDados ? "#555" : "#fff", cursor: "pointer",
                    }}
                  >
                    {mostrarDados ? "🙈 Ocultar dados" : "👁 Mostrar dados"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  onClick={() => setModalDetalhe(false)}
                  style={{ padding: "7px 22px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#555" }}
                >
                  FECHAR
                </button>
              </div>
            </Spin>
          );
        })()}
      </Modal>

      {/* ══ Modal EDITAR CARTÃO ══ */}
      <Modal
        open={modalEditar}
        onCancel={() => setModalEditar(false)}
        footer={null}
        width={680}
        destroyOnHidden
        closable
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16 }}>
          Editar informações do cartão.
        </div>
        <div style={{ background: "#f7f9fc", borderRadius: 8, border: "1px solid #e4e8ef", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Header titular + bandeira atual */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Titular</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>
                {cartaoEditando?.cli_nome ?? cartaoEditando?.CLI_NOME ?? "—"}
              </div>
            </div>
            <BandeiraCircle bandeira={editBandeira || "??"} size={46} />
          </div>

          <div style={{ borderTop: "1px solid #e0e4ea" }} />

          {/* Bandeira + Nome */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Bandeira</div>
              <input value={editBandeira} onChange={(e) => setEditBandeira(e.target.value)}
                list="bandeiras-edit-list" placeholder="Ex. Visa, Mastercard"
                style={{ width: "100%", boxSizing: "border-box", border: "1px solid #dde1e9", borderRadius: 6, padding: "7px 10px", fontSize: 13, background: "#fff", color: "#333", outline: "none", height: 36 }}
              />
              <datalist id="bandeiras-edit-list">
                {BANDEIRAS.map((b) => <option key={b} value={b} />)}
              </datalist>
            </div>
            <Campo label="Nome no Cartão" value={editNome} onChange={setEditNome} placeholder="Como aparece no cartão" />
          </div>

          {/* Últimos 4 + Validade + Vencimento */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: "0 0 160px" }}>
              <Campo label="Últimos 4 dígitos" value={editNumero}
                onChange={(v) => setEditNumero(v.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000" maxLength={4}
              />
            </div>
            <Campo label="Validade" value={editValidade}
              onChange={(v) => setEditValidade(mascaraValidade(v))}
              placeholder="MM/AAAA" maxLength={7}
            />
            <Campo label="Dia Vencimento" value={editVencimento}
              onChange={(v) => setEditVencimento(v.replace(/\D/g, "").slice(0, 2))}
              placeholder="00" maxLength={2}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
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

      {/* ══ Modal EXCLUIR CARTÃO ══ */}
      <Modal
        open={modalExcluir}
        onCancel={() => setModalExcluir(false)}
        footer={null}
        width={400}
        destroyOnHidden
        closable
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: 8 }}>
            Excluir Cartão
          </div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 6, lineHeight: 1.6 }}>
            Tem certeza que deseja excluir o cartão
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#333", marginBottom: 20 }}>
            {cartaoExcluindo?.cre_bandeira ?? cartaoExcluindo?.CRE_BANDEIRA ?? ""}
            {cartaoExcluindo?.cre_numero   ?? cartaoExcluindo?.CRE_NUMERO
              ? ` •••• ${cartaoExcluindo?.cre_numero ?? cartaoExcluindo?.CRE_NUMERO}` : ""}?
          </div>
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