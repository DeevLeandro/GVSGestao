import React, { useState, useEffect, useRef } from "react";
import {
  Select,  message,
  DatePicker, Tooltip, 
  Typography, 
} from "antd";
import {
  HomeOutlined, DownloadOutlined, EditOutlined,
  SwapOutlined, PercentageOutlined, GlobalOutlined,
  RocketOutlined, BankOutlined, CreditCardOutlined,
  ShopOutlined, TeamOutlined,  IdcardOutlined,
   MenuFoldOutlined, MenuUnfoldOutlined,
 ExportOutlined,
  SendOutlined,
  UserOutlined,
  WalletOutlined,
  CrownOutlined,
  CheckOutlined,
  ShoppingOutlined,

  BarChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";
import TransferenciaEntreContas from "./TransferenciaEntreContas";
import TransferenciaParidade from "./TransferenciaParidade";
import TransferenciaDireta from "./TransferenciaDireta";
import VendaMilhas from "./VendaMilhas";
import SaidaManual from "./SaidaManual";
import RegistroPassagemEmitida from "./RegistroPassagemEmitida";
import RegistroPassageiros from "./RegistroPassageiros";
import RegistroHospedagem from "./RegistroHospedagem";
import VendaDireta from "./VendaDireta";
import ConsultaPassageiroCPF from "./ConsultaPassageiroCPF";
import { useNavigate, useLocation } from "react-router-dom";
import PassagemEmitida from "./PassagemEmitida";
import Relatorio from "./Relatorio";
import Titulares from "./Titulares";
import Contas from "./Contas";
import Cartoes from "./Cartoes";
import Clube from "./Clube";
import Compensar from "./Compensar";
import EntradaManual from "./EntradaManual";
import Compra from "./Compra";
import PromocaoBumerangue from "./PromocaoBumerangue";
import CompraTurbinada from "./CompraTurbinada";
import DashboardFinal from "./DashboarFinal";

const { Option }      = Select;
const { RangePicker } = DatePicker;
const { Text }        = Typography;

// ─── MENU ─────────────────────────────────────────────────────────────────────
const MENU_GROUPS = [
  {
    groupKey: "movimentacao",
    label: "MOVIMENTAÇÃO",
    items: [
      { key: "dashboard",              icon: <HomeOutlined />,        label: "Dashboard" },
      { key: "compra",                 icon: <DownloadOutlined />,    label: "Compra" },
      { key: "entrada-manual",         icon: <EditOutlined />,        label: "Entrada Manual" },
      { key: "compra-turbinada",       icon: <RocketOutlined />,      label: "Compra Turbinada" },
      { key: "promocao-bumerangue",    icon: <SwapOutlined />,        label: "Bumerangue" },
      { key: "transferencia-contas",   icon: <PercentageOutlined />,  label: "Transfer com Bônus" },
      { key: "transferencia-paridade", icon: <BankOutlined />,        label: "Transfer com Paridade" },
      { key: "transferencia-direta",   icon: <CreditCardOutlined />,  label: "Transfer do CC" },
      { key: "venda-milhas",           icon: <ShopOutlined />,        label: "Venda de Milhas" },
      { key: "Passagem-emitida",       icon: <SendOutlined />,        label: "Passagem Emitida" },
      { key: "saida-manual",           icon: <ExportOutlined />,      label: "Saída Manual" },
      { key: "registro-passagem",      icon: <GlobalOutlined />,      label: "Registro de Passagem Emitida" },
      { key: "Compensar",              icon: <CheckOutlined />,       label: "Compensar" },
    ],
  },
  {
    groupKey: "Relatorio",
    label: "Relatório",
    items: [
      { key: "Relatorio-operacoes", icon: <BarChartOutlined />, label: "Relatório Operações" },
    ],
  },
  {
    groupKey: "agencia",
    label: "AGÊNCIA",
    items: [
      { key: "registro-passageiros", icon: <TeamOutlined />,    label: "Registro de Passageiros" },
      { key: "emissao-venda-direta", icon: <ShoppingOutlined />, label: "Emissão Venda Direta" },
      { key: "registro-hospedagem",  icon: <HomeOutlined />,   label: "Registro de Hospedagem" },
      { key: "consulta-passageiro",  icon: <IdcardOutlined />, label: "Consulta Passageiro/CPF" },
    ],
  },
  {
    groupKey: "Cadastro",
    label: "Cadastro",
    items: [
      { key: "titulares-conta",  icon: <UserOutlined />,        label: "Titulares de Conta" },
      { key: "contas",           icon: <WalletOutlined />,      label: "Contas" },
      { key: "cartoes",          icon: <CreditCardOutlined />,  label: "Cartões" },
      { key: "clube-assinante",  icon: <CrownOutlined />,       label: "Clube do Assinante" },
    ],
  },
];

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ clienteNome }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      setNomeUsuario(u.nome || u.cli_nome || u.login || localStorage.getItem("userName") || "Usuário");
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // CORREÇÃO: Adiciona o state para voltar para a página Carteira
  const menuItems = [
    { label: "Assinaturas", onClick: () => navigate("/dashboard", { state: { currentPage: "carteira" } }) },
    { label: "Sair",        onClick: handleLogout, danger: true },
  ];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      height: 52, background: "#1c2025",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px 0 0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
    }}>
      <div style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 20px" }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>
          GVS<span style={{ color: "#fff" }}> Gestão</span>
        </span>
      </div>

      <div ref={menuRef} style={{ position: "relative" }}>
        <div
          onClick={() => setMenuOpen(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            cursor: "pointer", padding: "6px 10px", borderRadius: 6,
            background: menuOpen ? "rgba(255,255,255,0.08)" : "transparent",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { if (!menuOpen) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = menuOpen ? "rgba(255,255,255,0.08)" : "transparent"; }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: "50%", background: "#4a6a7a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 700, color: "#ccc", flexShrink: 0,
          }}>
            {nomeUsuario.charAt(0).toUpperCase()}
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{nomeUsuario}</div>
            {clienteNome && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                Gerido: {clienteNome}
              </div>
            )}
          </div>
        </div>

        {menuOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: "#fff", borderRadius: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            minWidth: 180, overflow: "hidden", zIndex: 300,
          }}>
            {menuItems.map((item, i) => (
              <div
                key={i}
                onClick={() => { setMenuOpen(false); item.onClick(); }}
                style={{
                  padding: "12px 20px", fontSize: 14,
                  color: item.danger ? "#cf1322" : "#333",
                  cursor: "pointer",
                  borderBottom: i < menuItems.length - 1 ? "1px solid #f0f0f0" : "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
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
function Sidebar({ active, onChange, collapsed, onToggle }) {
  const W = collapsed ? 52 : 220;
  return (
    <div style={{
      width: W, minWidth: W, background: "#fff", borderRight: "1px solid #e8e8e8",
      display: "flex", flexDirection: "column",
      position: "fixed", top: 52, left: 0,
      height: "calc(100vh - 52px)",
      zIndex: 100, overflowX: "hidden", overflowY: "auto",
      transition: "width 0.2s ease", flexShrink: 0,
    }}>
      <div onClick={onToggle} style={{
        height: 44, display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-end",
        padding: collapsed ? 0 : "0 14px",
        cursor: "pointer", borderBottom: "1px solid #f0f0f0",
        color: "#8c8c8c", fontSize: 18, flexShrink: 0,
      }}>
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>

      {MENU_GROUPS.map(group => (
        <div key={group.groupKey} style={{ marginTop: 8 }}>
          {!collapsed && group.label && (
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em",
              padding: "6px 16px 2px", textTransform: "uppercase", whiteSpace: "nowrap",
            }}>
              {group.label}
            </div>
          )}
          {group.items.map(item => {
            const isActive = active === item.key;
            const inner = (
              <div
                key={item.key}
                onClick={() => onChange(item.key)}
                style={{
                  height: 38, display: "flex", alignItems: "center", gap: 10,
                  padding: collapsed ? "0" : "0 16px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  cursor: "pointer", borderRadius: 6, margin: "1px 6px",
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#1677ff" : "#444",
                  background: isActive ? "#e6f4ff" : "transparent",
                  transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#f5f5f5"; e.currentTarget.style.color = "#1677ff"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#444"; } }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </div>
            );
            return collapsed
              ? <Tooltip key={item.key} title={item.label} placement="right">{inner}</Tooltip>
              : <div key={item.key}>{inner}</div>;
          })}
        </div>
      ))}
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function extractCartoes(data) {
  if (data?.Table) return data.Table;
  if (data?.FDBS) {
    const t = data.FDBS.Manager?.TableList;
    if (t?.length > 0 && t[0].RowList) return t[0].RowList.map(r => r.Original);
  }
  if (Array.isArray(data)) return data;
  return [];
}

const lbl    = { fontSize: 12, color: "#666", fontWeight: 500, marginBottom: 4, display: "block" };
const fi     = { marginBottom: 14 };
const cardSt = { width: "100%", maxWidth: 700, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", background: "#fff" };

function PageWrapper({ children, wide }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ width: "100%", maxWidth: wide ? 820 : 700 }}>{children}</div>
    </div>
  );
}

// ─── EM BREVE ─────────────────────────────────────────────────────────────────
function EmBreve({ label }) {
  return (
    <PageWrapper>
      <div style={{ ...cardSt, padding: "48px 24px", textAlign: "center", color: "#aaa", fontSize: 15 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
        <div><strong>{label}</strong> — em breve</div>
      </div>
    </PageWrapper>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Operar() {
  const [activePage, setActivePage]   = useState("dashboard");
  const [collapsed, setCollapsed]     = useState(true);
  const [clienteId, setClienteId]     = useState(null);
  const [clienteNome, setClienteNome] = useState("");

  const location = useLocation();

  useEffect(() => {
    const clienteState = location.state?.cliente;

    if (clienteState?.id) {
      setClienteId(clienteState.id);
      setClienteNome(clienteState.nome || "");
      return;
    }

    try {
      const u  = JSON.parse(localStorage.getItem("user") || "{}");
      const id = u.cli_id || u.id || parseInt(localStorage.getItem("userID") || "0");
      if (id) {
        setClienteId(id);
        setClienteNome(u.cli_nome || u.nome || "");
      } else {
        message.error("Usuário não autenticado.");
      }
    } catch {
      message.error("Usuário não autenticado.");
    }
  }, [location.state]);

  const SIDEBAR_W = collapsed ? 52 : 220;

  const renderPage = () => {
    const p = { clienteId };
    switch (activePage) {
      // ── Dashboard com clienteNome e botão "Outras Pendências" → Compensar ──
      case "dashboard":
        return (
          <DashboardFinal
            {...p}
            clienteNome={clienteNome}
            onCompensarClick={() => setActivePage("Compensar")}
          />
        );
      case "compra":                 return <Compra {...p} />;
      case "entrada-manual":         return <EntradaManual {...p} />;
      case "compra-turbinada":       return <CompraTurbinada {...p} />;
      case "promocao-bumerangue":    return <PromocaoBumerangue {...p} />;
      case "Relatorio-operacoes":    return <Relatorio {...p} />;
      case "transferencia-contas":   return <TransferenciaEntreContas {...p} />;
      case "transferencia-paridade": return <TransferenciaParidade {...p} />;
      case "transferencia-direta":   return <TransferenciaDireta {...p} />;
      case "venda-milhas":           return <VendaMilhas {...p} />;
      case "Passagem-emitida":       return <PassagemEmitida {...p} />;
      case "saida-manual":           return <SaidaManual {...p} />;
      case "registro-passagem":      return <RegistroPassagemEmitida {...p} />;
      case "registro-passageiros":   return <RegistroPassageiros {...p} />;
      case "emissao-venda-direta":   return <VendaDireta {...p} />;
      case "registro-hospedagem":    return <RegistroHospedagem {...p} />;
      case "consulta-passageiro":    return <ConsultaPassageiroCPF {...p} />;
      case "titulares-conta":        return <Titulares {...p} />;
      case "contas":                 return <Contas {...p} />;
      case "cartoes":                return <Cartoes {...p} />;
      case "clube-assinante":        return <Clube {...p} />;
      case "Compensar":              return <Compensar {...p} />;
      default:                       return (
        <DashboardFinal
          {...p}
          clienteNome={clienteNome}
          onCompensarClick={() => setActivePage("Compensar")}
        />
      );
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}>
      <Topbar clienteNome={clienteNome} />
      <Sidebar
        active={activePage}
        onChange={key => { setActivePage(key); setCollapsed(true); }}
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
      />
      <div style={{
        marginLeft: SIDEBAR_W,
        marginTop: 52,
        flex: 1, minWidth: 0,
        transition: "margin-left 0.2s ease",
      }}>
        {renderPage()}
      </div>
    </div>
  );
}