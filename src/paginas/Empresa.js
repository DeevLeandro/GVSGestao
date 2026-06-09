import React, { useState, useEffect } from "react";
import { message, Spin } from "antd";
import { ApartmentOutlined } from "@ant-design/icons";
import api, { extractFireDACData } from "../services/api";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const DARK_NAV = "#1e3a4a";

// ── Helpers ───────────────────────────────────────────────────────────
const maskCpf = (v = "") => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const maskCnpj = (v = "") => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const maskCelular = (v = "") => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
};

const maskCep = (v = "") => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d{0,3})/, "$1-$2");
};

// ── Campo genérico ────────────────────────────────────────────────────
function Campo({ label, value, onChange, placeholder, type = "text", readOnly, suffix, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 500, letterSpacing: "0.3px" }}>
        {label}
      </div>
      <div style={{
        display: "flex", alignItems: "center",
        background: readOnly ? "#f7f8fa" : "#fff",
        border: "1px solid #dde1e9", borderRadius: 6,
        height: 38, paddingLeft: 12, paddingRight: suffix ? 10 : 12,
        transition: "border-color 0.15s",
      }}
        onFocus={() => {}}
      >
        <input
          type={type}
          readOnly={readOnly}
          value={value ?? ""}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder || ""}
          style={{
            flex: 1, border: "none", background: "transparent",
            outline: "none", fontSize: 13, color: "#333",
            cursor: readOnly ? "default" : "text",
          }}
        />
        {suffix && <span style={{ color: "#bbb", fontSize: 14, marginLeft: 6 }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────
export default function DadosEmpresa({ clienteId: clienteIdProp }) {
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [clienteId, setClienteId] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [form, setForm] = useState({
    tipo:         "Pessoa Física",
    cpfCnpj:      "",
    nome:         "",
    email:        "",
    celular:      "",
    cep:          "",
    logradouro:   "",
    numero:       "",
    complemento:  "",
    bairro:       "",
    cidade:       "",
    estado:       "",
  });

  // ── Resolve clienteId ────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (!id) id = u.cli_id || u.id;
    } catch (e) {}
    if (!id) id = parseInt(localStorage.getItem("userID") || "0") || null;
    if (id) setClienteId(id);
    else message.error("Usuário não autenticado.");
  }, [clienteIdProp]);

  // ── Carrega dados existentes ─────────────────────────────────────
  useEffect(() => {
    if (!clienteId) return;
    setLoading(true);
    api.get("/ServerPrincipal/PesquisaEmpresa", { params: { Login: clienteId } })
      .then((r) => {
        const rows = extractFireDACData(r.data);
        if (rows && rows.length > 0) {
          const d = rows[0];
          setForm({
            tipo:        d.emp_tipo        ?? d.tipo        ?? "Pessoa Física",
            cpfCnpj:     d.emp_cpf         ?? d.cpf         ?? "",
            nome:        d.emp_nome        ?? d.nome        ?? "",
            email:       d.emp_email       ?? d.email       ?? "",
            celular:     d.emp_celular     ?? d.celular     ?? "",
            cep:         d.emp_cep         ?? d.cep         ?? "",
            logradouro:  d.emp_logradouro  ?? d.logradouro  ?? "",
            numero:      d.emp_numero      ?? d.numero      ?? "",
            complemento: d.emp_complemento ?? d.complemento ?? "",
            bairro:      d.emp_bairro      ?? d.bairro      ?? "",
            cidade:      d.emp_cidade      ?? d.cidade      ?? "",
            estado:      d.emp_estado      ?? d.estado      ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clienteId]);

  // ── Busca CEP (ViaCEP) ───────────────────────────────────────────
  const buscarCep = async (cep) => {
    const raw = cep.replace(/\D/g, "");
    if (raw.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro:     data.bairro     || prev.bairro,
          cidade:     data.localidade || prev.cidade,
          estado:     data.uf         || prev.estado,
        }));
      }
    } catch (_) {}
    finally { setBuscandoCep(false); }
  };

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  // ── Salvar ────────────────────────────────────────────────────────
  const handleSalvar = async () => {
    if (!form.nome || !form.email) {
      message.error("Nome e e-mail são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/ServerPrincipal/InserirEmpresa", {
        Tipo:        form.tipo,
        CpfCnpj:     form.cpfCnpj.replace(/\D/g, ""),
        Nome:        form.nome,
        Email:       form.email,
        Celular:     form.celular.replace(/\D/g, ""),
        Cep:         form.cep.replace(/\D/g, ""),
        Largadouro:  form.logradouro,
        Numero:      form.numero,
        Complemento: form.complemento,
        Bairro:      form.bairro,
        Cidade:      form.cidade,
        Estado:      form.estado,
        IDLogin:     clienteId,
      });
      message.success("Dados gravados com sucesso.");
    } catch (e) {
      message.error(e.response?.data || "Erro ao salvar dados.");
    } finally {
      setSaving(false);
    }
  };

  // ── Máscara CPF/CNPJ conforme tipo ───────────────────────────────
  const handleCpfCnpj = (v) => {
    const masked = form.tipo === "Pessoa Física" ? maskCpf(v) : maskCnpj(v);
    setForm((prev) => ({ ...prev, cpfCnpj: masked }));
  };

  const handleTipo = (v) => {
    setForm((prev) => ({ ...prev, tipo: v, cpfCnpj: "" }));
  };

  // ── Estilos base ─────────────────────────────────────────────────
  const sectionLabel = {
    fontSize: 13, fontWeight: 700, color: "#444",
    marginBottom: 14, marginTop: 24,
    display: "flex", alignItems: "center", gap: 6,
  };
  const grid = (cols) => ({
    display: "grid",
    gridTemplateColumns: cols,
    gap: "14px 16px",
    marginBottom: 4,
  });
  const selectStyle = {
    width: "100%", height: 38, borderRadius: 6,
    border: "1px solid #dde1e9", background: "#fff",
    fontSize: 13, color: "#333",
    padding: "0 10px", outline: "none", cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "24px" }}>
      <Spin spinning={loading || buscandoCep}>
        <div style={{
          maxWidth: 780,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "16px 24px",
            borderBottom: "1px solid #f0f0f0",
          }}>
            <ApartmentOutlined style={{ fontSize: 16, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Dados da Empresa</span>
          </div>

          <div style={{ padding: "4px 24px 28px" }}>

            {/* Tipo + CPF/CNPJ */}
            <div style={grid("1fr 1fr")}>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 500 }}>
                  Tipo do Negócio:
                </div>
                <select
                  value={form.tipo}
                  onChange={(e) => handleTipo(e.target.value)}
                  style={selectStyle}
                >
                  <option value="Pessoa Física">Pessoa Física</option>
                  <option value="Pessoa Jurídica">Pessoa Jurídica</option>
                </select>
              </div>

              <Campo
                label="CPF"
                value={form.cpfCnpj}
                onChange={handleCpfCnpj}
                placeholder={form.tipo === "Pessoa Física" ? "000.000.000-00" : "00.000.000/0000-00"}
                suffix="#"
              />
            </div>

            {/* Nome + Email + Celular */}
            <div style={{ ...grid("1fr 1fr 1fr"), marginTop: 14 }}>
              <Campo
                label="Nome da Empresa"
                value={form.nome}
                onChange={set("nome")}
                placeholder="Nome completo ou razão social"
                span={1}
              />
              <Campo
                label="Email de contato"
                value={form.email}
                onChange={set("email")}
                placeholder="email@exemplo.com"
                suffix="✉"
              />
              <Campo
                label="Celular de contato"
                value={form.celular}
                onChange={(v) => set("celular")(maskCelular(v))}
                placeholder="(xx) xxxxx-xxxx"
                suffix="📞"
              />
            </div>

            {/* Seção Endereço */}
            <div style={{ ...sectionLabel, marginTop: 28 }}>
              ENDEREÇO
            </div>
            <div style={{ height: 1, background: "#f0f0f0", marginBottom: 16, marginTop: -8 }} />

            {/* CEP + Logradouro + Número + Complemento */}
            <div style={grid("160px 1fr 120px 160px")}>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 500 }}>CEP</div>
                <div style={{
                  display: "flex", alignItems: "center",
                  background: "#fff", border: "1px solid #dde1e9",
                  borderRadius: 6, height: 38, paddingLeft: 12, paddingRight: 12,
                }}>
                  <input
                    value={form.cep}
                    onChange={(e) => {
                      const masked = maskCep(e.target.value);
                      set("cep")(masked);
                      if (masked.replace(/\D/g, "").length === 8) buscarCep(masked);
                    }}
                    placeholder="00000-000"
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#333" }}
                  />
                </div>
              </div>
              <Campo label="Logradouro"   value={form.logradouro}  onChange={set("logradouro")}  placeholder="Rua, Avenida..." />
              <Campo label="Número"       value={form.numero}      onChange={set("numero")}      placeholder="Nº" />
              <Campo label="Complemento"  value={form.complemento} onChange={set("complemento")} placeholder="Apto, Sala..." />
            </div>

            {/* Bairro + Cidade + Estado */}
            <div style={{ ...grid("1fr 1fr 120px"), marginTop: 14 }}>
              <Campo label="Bairro" value={form.bairro} onChange={set("bairro")} placeholder="Bairro" />
              <Campo label="Cidade" value={form.cidade} onChange={set("cidade")} placeholder="Cidade" />
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 500 }}>Estado</div>
                <select
                  value={form.estado}
                  onChange={(e) => set("estado")(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">UF</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botão Salvar */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
              <button
                onClick={handleSalvar}
                disabled={saving}
                style={{
                  padding: "9px 28px",
                  background: saving ? "#bfbfbf" : DARK_NAV,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {saving ? "SALVANDO..." : "SALVAR"}
              </button>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
}