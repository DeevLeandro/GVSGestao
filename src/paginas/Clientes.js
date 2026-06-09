import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import api from "../services/api";

// ─── TEMA (igual ao Dashboard) ────────────────────────────────────────────────
const DARK_NAV = "#1e3a4a";
const ORANGE   = "#f5a623";

export default function CadastroGestor() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "", sobrenome: "", email: "", celular: "", cpf: "",
    login: "", senha: "", confirmacao: "",
  });
  const [showSenha, setShowSenha]           = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);
  const [loading, setLoading]               = useState(false);
  const [emailError, setEmailError]         = useState("");
  const [senhaError, setSenhaError]         = useState("");

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "email") {
      setEmailError(value && !validarEmail(value) ? "Email inválido." : "");
    }
    if (field === "confirmacao" || field === "senha") {
      const senha = field === "senha" ? value : form.senha;
      const conf  = field === "confirmacao" ? value : form.confirmacao;
      setSenhaError(conf && senha !== conf ? "As senhas não coincidem." : "");
    }
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.email) {
      message.error("Nome e e-mail são obrigatórios.");
      return;
    }
    if (emailError) { message.error("Corrija o e-mail antes de continuar."); return; }
    if (form.senha !== form.confirmacao) { message.error("As senhas não coincidem."); return; }

    setLoading(true);
    try {
      const userId = localStorage.getItem("userID");
      const nomeCompleto = [form.nome, form.sobrenome].filter(Boolean).join(" ");

      await api.post("/ServerPrincipal/InserirClientes", {
        Login:     String(userId),
        Nome:      nomeCompleto,
        CPF:       form.cpf,
        Email:     form.email,
        Telefone:  form.celular,
        IDCliente: 0,
        Senha:     form.senha,
        LogLogin:  form.login || form.email,
      });

      message.success("Gestor cadastrado com sucesso!");
      navigate("/dashboard", { state: { currentPage: "gestores" } });
    } catch (err) {
      message.error("Erro ao cadastrar gestor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = form.nome && form.email && !emailError && !senhaError && !loading;

  // ─── ESTILOS ────────────────────────────────────────────────────────────────
  const labelStyle = {
    fontSize: 12, color: "#666", marginBottom: 4,
    display: "block", fontWeight: 500,
  };

  const inputBase = {
    width: "100%", padding: "9px 12px",
    border: "1px solid #d9d9d9", borderRadius: 6,
    fontSize: 14, outline: "none",
    boxSizing: "border-box", color: "#333",
    background: "#fff", transition: "border-color 0.2s",
    fontFamily: "inherit",
  };

  const inputWithIcon = { ...inputBase, paddingRight: 38 };

  const sectionTitle = {
    fontSize: 15, fontWeight: 700, color: "#1e3a4a",
    marginBottom: 18, marginTop: 8,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", flexDirection: "column" }}>

      {/* ── TOPBAR ── */}
      <div style={{
        height: 56, background: DARK_NAV,
        display: "flex", alignItems: "center",
        padding: "0 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
          Adm<span style={{ color: ORANGE }}>GVS</span>
        </span>
      </div>

      {/* ── CONTEÚDO ── */}
      <div style={{ flex: 1, padding: "32px", maxWidth: 860, width: "100%", margin: "0 auto" }}>

        {/* Cabeçalho da página */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate("/dashboard", { state: { currentPage: "gestores" } })}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: "none",
              color: "#555", cursor: "pointer", fontSize: 13,
              padding: "4px 0", marginBottom: 12,
            }}
            onMouseEnter={e => e.currentTarget.style.color = DARK_NAV}
            onMouseLeave={e => e.currentTarget.style.color = "#555"}
          >
            <ArrowLeftOutlined style={{ fontSize: 12 }} />
            Voltar para Gestores
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#222", margin: 0 }}>
            Preencha as informações sobre o novo gestor
          </h2>
        </div>

        {/* ── CARD PRINCIPAL ── */}
        <div style={{
          background: "#fff", borderRadius: 10,
          border: "1px solid #e8e8e8",
          padding: "28px 32px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>

          {/* SEÇÃO: Dados do gestor */}
          <div style={sectionTitle}>Dados do gestor</div>

          {/* Nome + Sobrenome */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px", marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Nome</label>
              <input
                style={inputBase}
                placeholder="Nome do gestor"
                value={form.nome}
                onChange={e => handleChange("nome", e.target.value)}
                onFocus={e => e.target.style.borderColor = DARK_NAV}
                onBlur={e => e.target.style.borderColor = "#d9d9d9"}
              />
            </div>
            <div>
              <label style={labelStyle}>Sobrenome</label>
              <input
                style={inputBase}
                placeholder="Sobrenome do gestor"
                value={form.sobrenome}
                onChange={e => handleChange("sobrenome", e.target.value)}
                onFocus={e => e.target.style.borderColor = DARK_NAV}
                onBlur={e => e.target.style.borderColor = "#d9d9d9"}
              />
            </div>
          </div>

          {/* Email + Celular + CPF */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr", gap: "0 20px", marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: "relative" }}>
                <input
                  style={{
                    ...inputWithIcon,
                    borderColor: emailError ? "#ff4d4f" : "#d9d9d9",
                  }}
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={e => handleChange("email", e.target.value)}
                  onFocus={e => { if (!emailError) e.target.style.borderColor = DARK_NAV; }}
                  onBlur={e => { if (!emailError) e.target.style.borderColor = "#d9d9d9"; }}
                />
                <span style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)", color: "#bbb", fontSize: 14, pointerEvents: "none",
                }}>✉</span>
              </div>
              {emailError && (
                <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>{emailError}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Celular</label>
              <div style={{ position: "relative" }}>
                <input
                  style={inputWithIcon}
                  placeholder="(XX) XXXXX-XXXXX"
                  value={form.celular}
                  onChange={e => handleChange("celular", e.target.value)}
                  onFocus={e => e.target.style.borderColor = DARK_NAV}
                  onBlur={e => e.target.style.borderColor = "#d9d9d9"}
                />
                <span style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)", color: "#bbb", fontSize: 14, pointerEvents: "none",
                }}>📞</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>CPF</label>
              <div style={{ position: "relative" }}>
                <input
                  style={inputWithIcon}
                  placeholder="XXX.XXX.XXX-XX"
                  value={form.cpf}
                  onChange={e => handleChange("cpf", e.target.value)}
                  onFocus={e => e.target.style.borderColor = DARK_NAV}
                  onBlur={e => e.target.style.borderColor = "#d9d9d9"}
                />
                <span style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)", color: "#bbb", fontSize: 14, pointerEvents: "none",
                }}>#</span>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Acesso ao sistema */}
          <div style={{ ...sectionTitle, marginTop: 28 }}>Acesso ao sistema</div>

          {/* Login + Senha + Confirmação */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>
            <div>
              <label style={labelStyle}>Login (Nome Usuário)</label>
              <input
                style={inputBase}
                placeholder="Nome usado para login"
                value={form.login}
                onChange={e => handleChange("login", e.target.value)}
                onFocus={e => e.target.style.borderColor = DARK_NAV}
                onBlur={e => e.target.style.borderColor = "#d9d9d9"}
              />
            </div>
            <div>
              <label style={labelStyle}>Senha</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showSenha ? "text" : "password"}
                  style={inputWithIcon}
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={e => handleChange("senha", e.target.value)}
                  onFocus={e => e.target.style.borderColor = DARK_NAV}
                  onBlur={e => e.target.style.borderColor = "#d9d9d9"}
                />
                <span
                  onClick={() => setShowSenha(v => !v)}
                  style={{
                    position: "absolute", right: 10, top: "50%",
                    transform: "translateY(-50%)", cursor: "pointer",
                    color: "#aaa", fontSize: 16,
                  }}
                >
                  {showSenha ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Confirmação</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmacao ? "text" : "password"}
                  style={{
                    ...inputWithIcon,
                    borderColor: senhaError ? "#ff4d4f" : "#d9d9d9",
                  }}
                  placeholder="Senha (novamente)"
                  value={form.confirmacao}
                  onChange={e => handleChange("confirmacao", e.target.value)}
                  onFocus={e => { if (!senhaError) e.target.style.borderColor = DARK_NAV; }}
                  onBlur={e => { if (!senhaError) e.target.style.borderColor = "#d9d9d9"; }}
                />
                <span
                  onClick={() => setShowConfirmacao(v => !v)}
                  style={{
                    position: "absolute", right: 10, top: "50%",
                    transform: "translateY(-50%)", cursor: "pointer",
                    color: "#aaa", fontSize: 16,
                  }}
                >
                  {showConfirmacao ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </span>
              </div>
              {senhaError && (
                <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>{senhaError}</div>
              )}
            </div>
          </div>
        </div>

        {/* ── BOTÃO CADASTRAR ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: "10px 32px",
              background: canSubmit ? DARK_NAV : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: canSubmit ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.5px",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = "#162d3a"; }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = DARK_NAV; }}
          >
            {loading ? "CADASTRANDO..." : "CADASTRAR"}
          </button>
        </div>
      </div>
    </div>
  );
}