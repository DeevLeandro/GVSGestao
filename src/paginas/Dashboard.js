import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Spin, Input, Select, message } from "antd";
import {
  HomeOutlined,
  ShoppingCartOutlined,
  ApartmentOutlined,
  PlusOutlined,
  MenuOutlined,
  SearchOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  MoreOutlined,
  DownOutlined,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import api, { extractFireDACData } from "../services/api";
import Empresa from "./Empresa";

const DARK_NAV  = "#1c2025";
const ORANGE    = "#f5a623";
const SIDEBAR_W = 240;

// ── Helper FireDAC robusto (mesmo padrão dos outros arquivos) ────────────────
const extractRows = (data) => {
  if (!data) return [];
  if (data.FDBS) {
    try {
      const mgr    = data.FDBS.Manager ?? data.FDBS.manager;
      const tables = mgr?.TableList ?? mgr?.tablelist ?? [];
      if (tables.length > 0) {
        const rowList = tables[0].RowList ?? tables[0].rowlist ?? [];
        if (rowList.length > 0)
          return rowList.map((r) => r.Original ?? r.Current ?? r);
      }
    } catch (e) {}
  }
  if (data.Table && Array.isArray(data.Table)) return data.Table;
  if (Array.isArray(data)) return data;
  return [];
};

const normalize = (row) => {
  if (!row || typeof row !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(row)) out[k.toLowerCase()] = v;
  return out;
};

// Soma ven_veconomia de todas as vendas de um cliente
const calcularEconomia = (vendasRows) => {
  return vendasRows.reduce((acc, v) => {
    const val = Number(v.ven_veconomia ?? 0);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);
};

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ userName, userRole, onMenuToggle }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const items = [
    { label: "Dashboard", onClick: () => navigate("/dashboard") },
    { label: "Sair", onClick: () => { localStorage.clear(); navigate("/login"); }, danger: true },
  ];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      height: 56, background: DARK_NAV,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div onClick={onMenuToggle} style={{ cursor: "pointer", color: "#fff", fontSize: 20, display: "flex" }}>
          <MenuOutlined />
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
          GVS<span style={{ color: "#fff" }}> Gestão</span>
        </span>
      </div>

      <div ref={ref} style={{ position: "relative" }}>
        <div onClick={() => setOpen(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 10px", borderRadius: 6, background: open ? "rgba(255,255,255,0.08)" : "transparent" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#4a6a7a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#ccc" }}>
            {(userName || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{userName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{userRole || "coordenador"}</div>
          </div>
        </div>
        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", minWidth: 160, overflow: "hidden", zIndex: 300 }}>
            {items.map((item, i) => (
              <div key={i} onClick={() => { setOpen(false); item.onClick(); }}
                style={{ padding: "12px 20px", fontSize: 14, color: item.danger ? "#cf1322" : "#333", cursor: "pointer", borderBottom: i < items.length - 1 ? "1px solid #f0f0f0" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "gestores",      icon: <HomeOutlined />,         label: "Gestores" },
  { key: "carteira",      icon: <ShoppingCartOutlined />, label: "Carteira" },
  { key: "dados-empresa", icon: <ApartmentOutlined />,    label: "Dados da Empresa" },
];

function Sidebar({ current, onChange, visible }) {
  return (
    <div style={{
      position: "fixed", top: 56, left: visible ? 0 : -SIDEBAR_W,
      width: SIDEBAR_W, height: "calc(100vh - 56px)",
      background: "#fff", borderRight: "1px solid #e8e8e8",
      zIndex: 100, transition: "left 0.25s ease",
      display: "flex", flexDirection: "column", paddingTop: 8,
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = current === item.key;
        return (
          <div key={item.key} onClick={() => onChange(item.key)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 20px", cursor: "pointer", fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? DARK_NAV : "#555",
              background: isActive ? "#f0f4f7" : "transparent",
              borderLeft: isActive ? `3px solid ${ORANGE}` : "3px solid transparent",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f7f8fa"; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── MODAL DETALHES ───────────────────────────────────────────────────────────
function ModalDetalhes({ cliente, onClose }) {
  if (!cliente) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 12, width: 520, maxWidth: "95vw", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: DARK_NAV, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff" }}>
              {(cliente.nome || "C").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{cliente.nome}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Detalhes do Assinante</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6, color: "#fff", fontSize: 18, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "24px" }}>
          {[
            { label: "NOME COMPLETO", value: cliente.nome },
            { label: "E-MAIL",        value: cliente.email },
            { label: "CONTATO",       value: cliente.contato || "—" },
            { label: "PLANO",         value: cliente.plano || "GESTAO" },
            { label: "GESTOR",        value: cliente.gestor || "—" },
          ].map((field, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 4 ? "1px solid #f0f0f0" : "none" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#999", letterSpacing: "0.5px" }}>{field.label}</span>
              <span style={{ fontSize: 14, color: "#333", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{field.value}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#999", letterSpacing: "0.5px" }}>STATUS ASSINATURA</span>
            <span style={{ background: cliente.assinatura === "ATIVA" ? "#f6ffed" : "#fff7e6", border: `1px solid ${cliente.assinatura === "ATIVA" ? "#b7eb8f" : "#ffd591"}`, color: cliente.assinatura === "ATIVA" ? "#389e0d" : "#d46b08", borderRadius: 4, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>
              {cliente.assinatura || "ATIVA"}
            </span>
          </div>
          <div style={{ marginTop: 16, background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 8, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#389e0d" }}>💰 Economia Apurada</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#389e0d" }}>
              R$ {Number(cliente.economiaApurada || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", background: "#fff", border: "1px solid #d9d9d9", borderRadius: 6, cursor: "pointer", fontSize: 14, color: "#555" }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL NOVO CLIENTE ───────────────────────────────────────────────────────
function ModalNovoCliente({ userId, gestores, onClose, onSuccess }) {
  const [form, setForm] = useState({ nome: "", sobrenome: "", email: "", celular: "", cpf: "", login: "", senha: "", plano: "", gestor: "" });
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [emailError, setEmailError] = useState("");

  const validarEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "email") setEmailError(value && !validarEmail(value) ? "Email inválido." : "");
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.email) { message.error("Nome e e-mail são obrigatórios."); return; }
    if (emailError) { message.error("Corrija o e-mail antes de continuar."); return; }
    setLoading(true);
    try {
      const nomeCompleto = [form.nome, form.sobrenome].filter(Boolean).join(" ");
      await api.post("/ServerPrincipal/InserirClientes", {
        Login: String(form.gestor || userId),
        Nome: nomeCompleto, CPF: form.cpf, Email: form.email,
        Telefone: form.celular, IDCliente: form.gestor || 0,
        Senha: form.senha, LogLogin: form.login || form.email,
      });
      message.success("Cliente cadastrado com sucesso!");
      onSuccess(); onClose();
    } catch (err) {
      message.error("Erro ao cadastrar cliente."); console.error(err);
    } finally { setLoading(false); }
  };

  const labelStyle  = { fontSize: 12, color: "#666", marginBottom: 4, display: "block" };
  const inputStyle  = { width: "100%", padding: "8px 10px", border: "1px solid #d9d9d9", borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box", color: "#333" };
  const sectionTitle = { fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 14, marginTop: 20, paddingBottom: 8, borderBottom: "1px solid #f0f0f0" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 12, width: 540, maxWidth: "95vw", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: DARK_NAV, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Nova assinatura</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6, color: "#fff", fontSize: 18, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <div style={sectionTitle}>Dados do assinante</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Nome</label><input style={inputStyle} placeholder="Nome do gerido" value={form.nome} onChange={e => handleChange("nome", e.target.value)} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Sobrenome</label><input style={inputStyle} placeholder="Sobrenome do gerido" value={form.sobrenome} onChange={e => handleChange("sobrenome", e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input style={{ ...inputStyle, borderColor: emailError ? "#ff4d4f" : "#d9d9d9" }} placeholder="email@exemplo.com" value={form.email} onChange={e => handleChange("email", e.target.value)} />
            {emailError && <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>{emailError}</div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Celular</label><input style={inputStyle} placeholder="(xx) xxxxx-xxxxx" value={form.celular} onChange={e => handleChange("celular", e.target.value)} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>CPF</label><input style={inputStyle} placeholder="xxx.xxx.xxx-xx" value={form.cpf} onChange={e => handleChange("cpf", e.target.value)} /></div>
          </div>
          <div style={sectionTitle}>Acesso ao sistema</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Login (Nome Usuário)</label><input style={inputStyle} placeholder="Nome usado para login" value={form.login} onChange={e => handleChange("login", e.target.value)} /></div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Senha</label>
              <div style={{ position: "relative" }}>
                <input type={showSenha ? "text" : "password"} style={{ ...inputStyle, paddingRight: 36 }} placeholder="••••••••" value={form.senha} onChange={e => handleChange("senha", e.target.value)} />
                <span onClick={() => setShowSenha(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa", fontSize: 16 }}>
                  {showSenha ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </span>
              </div>
            </div>
          </div>
          <div style={sectionTitle}>Dados da assinatura</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Plano</label>
              <select style={{ ...inputStyle, cursor: "pointer", background: "#fff" }} value={form.plano} onChange={e => handleChange("plano", e.target.value)}>
                <option value="">Selecione...</option>
                <option value="GESTAO">Gestão</option>
                <option value="BASICO">Básico</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Gestor</label>
              <select style={{ ...inputStyle, cursor: "pointer", background: "#fff" }} value={form.gestor} onChange={e => handleChange("gestor", e.target.value)}>
                <option value="">Selecione o gestor...</option>
                {gestores.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
              </select>
            </div>
          </div>
          <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8, padding: "12px 16px", marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#d48806", marginBottom: 4 }}>💳 Forma de Pagamento</div>
            <div style={{ fontSize: 12, color: "#ad6800", lineHeight: 1.6 }}>A cobrança da assinatura será realizada no cartão cadastrado da empresa. Se o gateway de pagamento indicar falha na cobrança, você ainda poderá pagar a assinatura através da fatura.</div>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", background: "#fff", border: "1px solid #d9d9d9", borderRadius: 6, cursor: "pointer", fontSize: 14, color: "#555" }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || !!emailError || !form.nome || !form.email}
            style={{ padding: "8px 24px", background: loading || !form.nome || !form.email || emailError ? "#ccc" : DARK_NAV, color: "#fff", border: "none", borderRadius: 6, cursor: loading || !form.nome || !form.email || emailError ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
            {loading ? "Cadastrando..." : "CADASTRAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA GESTORES ──────────────────────────────────────────────────────────
function GestoresPage({ userId }) {
  const [gestores, setGestores]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [gestorDetalhes, setGestorDetalhes] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get("/ServerPrincipal/PesquisaGestor", { params: { Login: userId } })
      .then(r => {
        const data = extractFireDACData(r.data);
        setGestores(data.map((g, i) => ({
          key: i.toString(),
          id:      g.log_id      || g.id,
          nome:    g.log_nome    || g.nome,
          email:   g.log_email   || g.email,
          contato: g.log_contato || g.telefone || "—",
          status:  g.log_ativo === 1 || g.log_ativo === "1" ? "Ativo" : (g.status || "Ativo"),
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const COLS = "2fr 2.5fr 1.5fr 1fr 60px";
  const th   = { fontSize: 12, fontWeight: 600, color: "#888" };

  return (
    <div>
      {gestorDetalhes && <ModalDetalhes cliente={{ ...gestorDetalhes, assinatura: gestorDetalhes.status }} onClose={() => setGestorDetalhes(null)} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HomeOutlined style={{ fontSize: 18, color: "#555" }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: "#222" }}>Gestores</span>
        </div>
        <button onClick={() => navigate("/cadastro-gestor")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: DARK_NAV, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <PlusOutlined style={{ fontSize: 12 }} /> NOVO GESTOR
        </button>
      </div>
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e8e8", overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: COLS, padding: "10px 20px", background: "#fafafa", borderBottom: "1px solid #f0f0f0", minWidth: 600 }}>
          {["Gestor", "Email", "Contato", "Status", ""].map((h, i) => <div key={i} style={th}>{h}</div>)}
        </div>
        <Spin spinning={loading}>
          {gestores.length === 0 && !loading ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}>Nenhum gestor encontrado</div>
          ) : gestores.map((g, idx) => (
            <div key={g.key}
              style={{ display: "grid", gridTemplateColumns: COLS, padding: "13px 20px", borderBottom: "1px solid #f5f5f5", alignItems: "center", background: idx % 2 === 0 ? "#fff" : "#fafcff", position: "relative", minWidth: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0f7ff"}
              onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafcff"}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{g.nome}</div>
              <div style={{ fontSize: 13, color: "#666", wordBreak: "break-all" }}>{g.email}</div>
              <div style={{ fontSize: 13, color: "#666" }}>{g.contato}</div>
              <div>
                <span style={{ background: g.status === "Ativo" ? "#f6ffed" : "#fff1f0", border: `1px solid ${g.status === "Ativo" ? "#b7eb8f" : "#ffa39e"}`, color: g.status === "Ativo" ? "#389e0d" : "#cf1322", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>
                  {g.status === "Ativo" ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
                <div style={{ cursor: "pointer", padding: "8px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", background: openMenuId === g.key ? "#f0f0f0" : "transparent" }}
                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === g.key ? null : g.key); }}>
                  <MoreOutlined style={{ fontSize: 18, color: "#555" }} />
                </div>
                {openMenuId === g.key && (
                  <div ref={menuRef} style={{ position: "fixed", right: "20px", marginTop: "8px", background: "#fff", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: "1px solid #e8e8e8", zIndex: 9999, minWidth: "140px", overflow: "hidden" }}>
                    <button onClick={() => { setOpenMenuId(null); setGestorDetalhes(g); }}
                      style={{ width: "100%", padding: "12px 16px", border: "none", background: "#fff", textAlign: "left", fontSize: "14px", color: "#333", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                      <span style={{ fontSize: "16px" }}>📋</span> Detalhes
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Spin>
      </div>
    </div>
  );
}

// ─── PÁGINA CARTEIRA ──────────────────────────────────────────────────────────
function CarteiraPage({ userId }) {
  const navigate = useNavigate();
  const [clientes, setClientes]               = useState([]);
  const [gestores, setGestores]               = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [filtroAberto, setFiltroAberto]       = useState(true);
  const [searchTerm, setSearchTerm]           = useState("");
  const [filtroStatus, setFiltroStatus]       = useState(null);
  const [filtroPlano, setFiltroPlano]         = useState(null);
  const [gestorExpandido, setGestorExpandido] = useState({});
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [openMenuClienteId, setOpenMenuClienteId] = useState(null);
  const [nomeGestorLogado, setNomeGestorLogado]   = useState("");
  const [compensacaoData, setCompensacaoData]     = useState({});
  const menuRef = useRef(null);

  // ── CARREGA DADOS ──────────────────────────────────────────────────────────
  const carregarDados = () => {
    if (!userId) return;
    setLoading(true);

    // 1. Busca dados do gestor logado
    api.get("/ServerPrincipal/PesquisaGestor", { params: { Login: userId } })
      .then(r => {
        const data = extractFireDACData(r.data);
        if (data && data.length > 0) setNomeGestorLogado(data[0].log_nome || data[0].nome || "Sem Gestor");
        setGestores(data.map(g => ({ id: g.log_id || g.id, nome: g.log_nome || g.nome })));
      })
      .catch(console.error);

    // 2. Busca lista de clientes
    api.get("/ServerPrincipal/PesquisaClientes", { params: { Login: userId } })
      .then(async r => {
        const data = extractFireDACData(r.data);

        // Formata clientes com economia zerada por enquanto
        const formatted = data.map((c, i) => ({
          key:             i.toString(),
          id:              c.cli_id       || c.id,
          nome:            c.cli_nome     || c.nome,
          email:           c.cli_email    || c.email,
          economiaApurada: 0,             // ← será preenchido abaixo
          plano:           c.cli_plano    || c.plano    || "GESTAO",
          status:          c.cli_status   || c.status   || "Ativo",
          assinatura:      c.cli_assinatura || c.assinatura || "ATIVA",
          contato:         c.cli_telefone || c.telefone || "—",
          pendencias:      c.cli_pendencias || c.pendencias || 0,
        }));

        setClientes(formatted);

        // 3. Para cada cliente, busca vendas e soma ven_veconomia EM PARALELO
        //    Também busca compensação em paralelo
        await Promise.all(
          formatted.map(async (cliente) => {
            // Busca vendas para somar a economia
            try {
              const vendasRes  = await api.get("/ServerPrincipal/PesquisaVendas", { params: { Cliente: cliente.id } });
              const vendasRows = extractRows(vendasRes.data).map(normalize);
              const totalEconomia = calcularEconomia(vendasRows);

              // Atualiza só o campo economiaApurada deste cliente
              setClientes(prev =>
                prev.map(c =>
                  c.id === cliente.id ? { ...c, economiaApurada: totalEconomia } : c
                )
              );
            } catch (e) {
              console.warn(`[Economia] Erro ao buscar vendas do cliente ${cliente.id}:`, e);
            }

            // Busca compensação
            try {
              const compensaRes  = await api.get("/ServerPrincipal/PesquisaCompensa", { params: { Cliente: cliente.id } });
              const compensaData = extractFireDACData(compensaRes.data);
              if (compensaData && compensaData.length > 0) {
                setCompensacaoData(prev => ({ ...prev, [cliente.id]: compensaData }));
              }
            } catch (e) {
              console.warn(`[Compensação] Erro cliente ${cliente.id}:`, e);
            }
          })
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregarDados(); }, [userId]);

  useEffect(() => {
    if (nomeGestorLogado) {
      setGestorExpandido(prev => ({
        ...prev,
        [nomeGestorLogado]: prev[nomeGestorLogado] !== undefined ? prev[nomeGestorLogado] : true,
      }));
    }
  }, [nomeGestorLogado]);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuClienteId(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtrados = clientes.filter(c => {
    const t = searchTerm.toLowerCase();
    return (
      (!t || c.nome?.toLowerCase().includes(t) || c.email?.toLowerCase().includes(t)) &&
      (!filtroStatus || c.assinatura === filtroStatus) &&
      (!filtroPlano  || c.plano === filtroPlano)
    );
  });

  const grupos = {};
  if (filtrados.length > 0) grupos[nomeGestorLogado || "Sem Gestor"] = filtrados;

  const toggleGestor = (g) => setGestorExpandido(prev => ({ ...prev, [g]: !prev[g] }));

  const handleAbrirRelatorioEconomia = (cliente) => {
    navigate(`/extrato/${cliente.id}`, { state: { cliente, abaAtiva: "utilizacao" } });
  };

  const handleAbrirOperar = (cliente) => {
    navigate("/operar", { state: { cliente, compensacaoData: compensacaoData[cliente.id] } });
  };

  const hasCompensacao      = (id) => compensacaoData[id] && compensacaoData[id].length > 0;
  const getCompensacaoCount = (id) => compensacaoData[id]?.length || 0;

  const renderEconomia = (valor, assinatura, cliente) => {
    const isFinalizado = assinatura?.toLowerCase().includes("finalizado") || assinatura?.toLowerCase().includes("ciclo");
    if (isFinalizado) return (
      <span style={{ background: "#fff7e6", border: "1px solid #ffd591", color: "#d46b08", borderRadius: 4, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
        CICLO FINALIZADO
      </span>
    );
    return (
      <span onClick={() => handleAbrirRelatorioEconomia(cliente)}
        style={{ background: "#f6ffed", border: "1px solid #b7eb8f", color: "#389e0d", borderRadius: 4, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s", display: "inline-block" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#d9f7be"; e.currentTarget.style.transform = "scale(1.02)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#f6ffed"; e.currentTarget.style.transform = "scale(1)"; }}>
        R$ {Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
    );
  };

  const COLS = "2fr 2fr 1fr 1.6fr 1fr 190px 36px";

  return (
    <div>
      {clienteSelecionado && <ModalDetalhes cliente={clienteSelecionado} onClose={() => setClienteSelecionado(null)} />}
      {showNovoCliente && <ModalNovoCliente userId={userId} gestores={gestores} onClose={() => setShowNovoCliente(false)} onSuccess={carregarDados} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShoppingCartOutlined style={{ fontSize: 18, color: "#555" }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: "#222" }}>Carteira</span>
        </div>
        <button onClick={() => setShowNovoCliente(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: DARK_NAV, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <PlusOutlined style={{ fontSize: 12 }} /> NOVO CLIENTE
        </button>
      </div>

      {/* Filtros */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e8e8", marginBottom: 16, overflow: "hidden" }}>
        <div onClick={() => setFiltroAberto(v => !v)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", cursor: "pointer", borderBottom: filtroAberto ? "1px solid #f0f0f0" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "#333" }}>
            <SearchOutlined /> Filtrar Clientes por Interesses
          </div>
          <DownOutlined style={{ color: "#aaa", fontSize: 12, transform: filtroAberto ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </div>
        {filtroAberto && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Buscar cliente</div>
                <Input placeholder="Nome ou e-mail..." prefix={<SearchOutlined style={{ color: "#bbb" }} />} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} allowClear />
              </div>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Status assinatura</div>
                <Select placeholder="Todos" allowClear style={{ width: "100%" }} onChange={setFiltroStatus} value={filtroStatus}>
                  <Select.Option value="ATIVA">Ativa</Select.Option>
                  <Select.Option value="INATIVA">Inativa</Select.Option>
                  <Select.Option value="CICLO FINALIZADO">Ciclo Finalizado</Select.Option>
                </Select>
              </div>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Plano</div>
                <Select placeholder="Todos" allowClear style={{ width: "100%" }} onChange={setFiltroPlano} value={filtroPlano}>
                  <Select.Option value="GESTAO">Gestão</Select.Option>
                  <Select.Option value="BASICO">Básico</Select.Option>
                  <Select.Option value="PREMIUM">Premium</Select.Option>
                </Select>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#888" }}>
              Exibindo {filtrados.length > 0 ? "todos os clientes." : "nenhum cliente."}
            </div>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e8e8", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: COLS, padding: "10px 20px", background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
          {["Gestor/Cliente", "Email", "Plano", "Economia Apurada", "Status\nAssinatura", "", ""].map((h, i) => (
            <div key={i} style={{ fontSize: 12, fontWeight: 600, color: "#888", whiteSpace: "pre-line" }}>{h}</div>
          ))}
        </div>
        <Spin spinning={loading}>
          {Object.keys(grupos).length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb", fontSize: 14 }}>Nenhum cliente encontrado</div>
          )}
          {Object.entries(grupos).map(([gestor, membros]) => (
            <div key={gestor}>
              <div onClick={() => toggleGestor(gestor)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#fafafa", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#333" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f0f4f7"}
                onMouseLeave={e => e.currentTarget.style.background = "#fafafa"}>
                <DownOutlined style={{ fontSize: 11, color: "#aaa", transform: gestorExpandido[gestor] ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
                <UserOutlined style={{ color: "#aaa", fontSize: 14 }} />
                {gestor}
              </div>
              {gestorExpandido[gestor] && membros.map((c, idx) => (
                <div key={c.key}
                  style={{ display: "grid", gridTemplateColumns: COLS, padding: "12px 20px", borderBottom: "1px solid #f5f5f5", alignItems: "center", background: idx % 2 === 0 ? "#fff" : "#fafcff", position: "relative" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f7ff"}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafcff"}>
                  <div style={{ fontSize: 13, color: "#333", paddingLeft: 28 }}>{c.nome}</div>
                  <div style={{ fontSize: 13, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                  <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{c.plano}</div>
                  <div>{renderEconomia(c.economiaApurada, c.assinatura, c)}</div>
                  <div>
                    <span style={{ border: "1px solid #d9d9d9", borderRadius: 4, padding: "2px 8px", fontSize: 12, color: "#555", fontWeight: 500 }}>
                      {c.assinatura || "ATIVA"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => navigate(`/extrato/${c.id}`, { state: { cliente: c } })}
                      style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: `1px solid ${ORANGE}`, color: ORANGE, borderRadius: 4, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                      onMouseEnter={e => { e.currentTarget.style.background = ORANGE; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ORANGE; }}>
                      <FileTextOutlined style={{ fontSize: 11 }} /> EXTRATO
                    </button>
                    <button onClick={() => handleAbrirOperar(c)}
                      style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "1px solid #020a15", color: "#020a15", borderRadius: 4, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", position: "relative" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#153766"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#0f213a"; }}>
                      <ThunderboltOutlined style={{ fontSize: 11 }} /> OPERAR
                      {hasCompensacao(c.id) && (
                        <span style={{ position: "absolute", top: -6, right: -6, background: "#ff4d4f", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                          {getCompensacaoCount(c.id)}
                        </span>
                      )}
                    </button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
                    <div style={{ cursor: "pointer", padding: "8px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", background: openMenuClienteId === c.key ? "#f0f0f0" : "transparent" }}
                      onClick={(e) => { e.stopPropagation(); setOpenMenuClienteId(openMenuClienteId === c.key ? null : c.key); }}>
                      <MoreOutlined style={{ fontSize: 18, color: "#555" }} />
                    </div>
                    {openMenuClienteId === c.key && (
                      <div ref={menuRef} style={{ position: "fixed", right: "20px", background: "#fff", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: "1px solid #e8e8e8", zIndex: 9999, minWidth: "140px", overflow: "hidden" }}>
                        <button onClick={() => { setOpenMenuClienteId(null); setClienteSelecionado(c); }}
                          style={{ width: "100%", padding: "12px 16px", border: "none", background: "#fff", textAlign: "left", fontSize: "14px", color: "#333", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                          onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                          <span>📋</span> Detalhes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Spin>
      </div>
    </div>
  );
}

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate                      = useNavigate();
  const location                      = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(() => location.state?.currentPage || "gestores");
  const [userName, setUserName]       = useState("");
  const [userRole, setUserRole]       = useState("");
  const [userId, setUserId]           = useState(null);

  useEffect(() => {
    if (location.state?.currentPage) setCurrentPage(location.state.currentPage);
  }, [location.state]);

  useEffect(() => {
    const id   = localStorage.getItem("userID");
    const name = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole") || "coordenador";
    if (!id) { navigate("/login"); return; }
    setUserId(id);
    setUserName(name || "Usuário");
    setUserRole(role);
  }, [navigate]);

  const renderPage = () => {
    switch (currentPage) {
      case "gestores":      return <GestoresPage userId={userId} />;
      case "carteira":      return <CarteiraPage userId={userId} />;
      case "dados-empresa": return <Empresa clienteId={userId} />;
      default:              return <GestoresPage userId={userId} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Topbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Sidebar current={currentPage} onChange={setCurrentPage} visible={sidebarOpen} />
      <div style={{ marginLeft: sidebarOpen ? SIDEBAR_W : 0, marginTop: 56, padding: "28px 32px", transition: "margin-left 0.25s ease", minHeight: "calc(100vh - 56px)" }}>
        {renderPage()}
      </div>
    </div>
  );
}