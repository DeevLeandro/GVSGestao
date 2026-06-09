import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DARK_NAV = "#1e3a4a";

function DetalhesGestor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { gestor } = location.state || {};

  if (!gestor) {
    return (
      <div style={{ padding: 24, textAlign: "center", minHeight: "100vh", background: "#f0f2f5" }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: 40, maxWidth: 500, margin: "0 auto" }}>
          <p style={{ fontSize: 16, color: "#666" }}>Nenhum gestor selecionado</p>
          <button 
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "8px 20px",
              background: DARK_NAV,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              marginTop: 16
            }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <button 
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#666",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            ← Voltar
          </button>
          <h2 style={{ margin: 0 }}>Detalhes do Gestor</h2>
        </div>

        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e8e8", overflow: "hidden" }}>
          <div style={{ padding: 24, borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
            <h3 style={{ margin: 0 }}>Informações Pessoais</h3>
          </div>
          
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, color: "#666", fontSize: 12, display: "block", marginBottom: 8 }}>NOME COMPLETO</label>
              <div style={{ fontSize: 16, color: "#333", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>{gestor.nome}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, color: "#666", fontSize: 12, display: "block", marginBottom: 8 }}>E-MAIL</label>
              <div style={{ fontSize: 16, color: "#333", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>{gestor.email}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, color: "#666", fontSize: 12, display: "block", marginBottom: 8 }}>CONTATO</label>
              <div style={{ fontSize: 16, color: "#333", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>{gestor.contato}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, color: "#666", fontSize: 12, display: "block", marginBottom: 8 }}>STATUS</label>
              <div style={{ fontSize: 16, color: "#333", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ 
                  background: gestor.status === "Ativo" ? "#f6ffed" : "#fff1f0", 
                  border: `1px solid ${gestor.status === "Ativo" ? "#b7eb8f" : "#ffa39e"}`,
                  color: gestor.status === "Ativo" ? "#389e0d" : "#cf1322", 
                  borderRadius: 4, 
                  padding: "4px 12px", 
                  fontSize: 13, 
                  fontWeight: 600 
                }}>
                  {gestor.status}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, color: "#666", fontSize: 12, display: "block", marginBottom: 8 }}>ID DO GESTOR</label>
              <div style={{ fontSize: 14, color: "#999", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>{gestor.id}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, gap: 12 }}>
          <button 
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "8px 20px",
              background: "#fff",
              border: "1px solid #d9d9d9",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Fechar
          </button>
          <button 
            onClick={() => alert(`Editar gestor: ${gestor.nome}`)}
            style={{
              padding: "8px 20px",
              background: DARK_NAV,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Editar Gestor
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetalhesGestor;