import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, DatePicker, Row, Col,
  Spin, message, Dropdown,
} from "antd";
import {
  IdcardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../services/api";

const { Option } = Select;

// ── Helper FireDAC (padronizado) ────────────────────────────────────────
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

export default function Passageiros({ clienteId: clienteIdProp }) {
  const [loading, setLoading]       = useState(false);
  const [passageiros, setPassageiros] = useState([]);
  const [filtro, setFiltro]         = useState("");
  const [clienteId, setClienteId]   = useState(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [saving, setSaving]               = useState(false);
  const [passageiroSelecionado, setPassSel] = useState(null);
  const [form] = Form.useForm();

  // ── Resolve clienteId ──────────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    if (!id) {
      const storedUser = localStorage.getItem("user");
      const storedUserId = localStorage.getItem("userID");
      if (storedUser) {
        try { const u = JSON.parse(storedUser); id = u.cli_id || u.id; } catch (e) {}
      }
      if (!id && storedUserId) id = parseInt(storedUserId);
    }
    if (id) { setClienteId(id); }
    else message.error("Usuário não autenticado.");
  }, [clienteIdProp]);

  useEffect(() => {
    if (clienteId) carregarPassageiros();
  }, [clienteId]);

  const carregarPassageiros = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ServerPrincipal/PesquisaPassageiros", {
        params: { Cliente: clienteId },
      });
      setPassageiros(extractRows(res.data));
    } catch (e) {
      message.error("Erro ao carregar passageiros");
    } finally {
      setLoading(false);
    }
  };

  // ── Abre modal com dados preenchidos ─────────────────────────────────
  const abrirDetalhes = (p) => {
    setPassSel(p);
    const nomePartes = (p.pag_nome || "").split(" ");
    const nome      = nomePartes[0] || "";
    const sobrenome = nomePartes.slice(1).join(" ") || "";
    form.setFieldsValue({
      nome,
      sobrenome,
      email:         p.pag_email       || "",
      celular:       p.pag_telefone    || "",
      cpf:           p.pag_cpf         || "",
      passaporte:    p.pag_passaporte  || "",
      cnh:           p.pag_cnh         || "",
      rg:            p.pag_rg          || "",
      nacionalidade: p.pag_nascionalidade || "",
      sexo:          p.pag_sexo        || "NAO_DECLARADO",
      nascimento:    p.pag_data_nascimento ? dayjs(p.pag_data_nascimento) : null,
    });
    setModalOpen(true);
  };

  const abrirNovo = () => {
    setPassSel(null);
    form.resetFields();
    setModalOpen(true);
  };

  // ── Filtro de busca ───────────────────────────────────────────────────
  const passageirosFiltrados = passageiros.filter((p) => {
    const q = filtro.toLowerCase();
    return (
      (p.pag_nome  || "").toLowerCase().includes(q) ||
      (p.pag_email || "").toLowerCase().includes(q) ||
      (p.pag_cpf   || "").toLowerCase().includes(q)
    );
  });

  // ── Submit novo passageiro ────────────────────────────────────────────
  const handleSalvar = async (values) => {
    const temDoc = values.cpf || values.passaporte || values.cnh || values.rg;
    if (!temDoc) {
      message.error("Pelo menos um documento é obrigatório.");
      return;
    }
    if (!values.nacionalidade) {
      message.error("Nacionalidade é obrigatória.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/ServerPrincipal/InserirPassageiros", {
        IDCliente:      clienteId,
        Nome:           `${values.nome || ""} ${values.sobrenome || ""}`.trim(),
        CPF:            values.cpf          || "",
        RG:             values.rg           || "",
        Email:          values.email        || "",
        Telefone:       values.celular      || "",
        CNH:            values.cnh          || "",
        Nascionalidade: values.nacionalidade || "",
        Sexo:           values.sexo         || "NAO_DECLARADO",
        Nascimento:     values.nascimento   ? values.nascimento.format("DD/MM/YYYY") : "",
        Passaporte:     values.passaporte   || "",
      });
      message.success("Passageiro cadastrado com sucesso!");
      form.resetFields();
      setModalOpen(false);
      carregarPassageiros();
    } catch (e) {
      message.error(e.response?.data || "Erro ao cadastrar passageiro");
    } finally {
      setSaving(false);
    }
  };

  // ── Documento exibido na tabela ───────────────────────────────────────
  const docPrincipal = (p) =>
    p.pag_cpf || p.pag_passaporte || p.pag_cnh || p.pag_rg || "—";

  // ── Styles ────────────────────────────────────────────────────────────
  const pageStyle = {
    minHeight: "100vh",
    background: "#f0f2f5",
    padding: "24px",
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "16px 20px 14px",
    borderBottom: "1px solid #f0f0f0",
  };

  const filterBarStyle = {
    background: "#1a3a4a",
    padding: "16px 20px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  };

  const tableHeaderStyle = {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 40px",
    padding: "10px 20px",
    background: "#fafafa",
    borderBottom: "1px solid #f0f0f0",
  };

  const thStyle = {
    fontSize: 12,
    color: "#888",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 4,
  };

  const rowStyle = (i) => ({
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 40px",
    padding: "12px 20px",
    borderBottom: "1px solid #f5f5f5",
    background: i % 2 === 0 ? "#fff" : "#fafafa",
    alignItems: "center",
  });

  const tdStyle = { fontSize: 13, color: "#333" };

  // Modal styles
  const overlayStyle = {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  const modalStyle = {
    background: "#fff",
    borderRadius: 8,
    width: "100%",
    maxWidth: 700,
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    overflow: "hidden",
  };

  const modalHeaderStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "16px 24px",
    borderBottom: "1px solid #f0f0f0",
  };

  const modalBodyStyle = {
    padding: "24px",
    maxHeight: "70vh",
    overflowY: "auto",
  };

  const modalFooterStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    padding: "14px 24px",
    borderTop: "1px solid #f0f0f0",
    background: "#fafafa",
  };

  const lbl = { fontSize: 12, color: "#555", fontWeight: 500, marginBottom: 4, display: "block" };

  const inp = {
    width: "100%",
    borderRadius: 4,
    border: "1px solid #d9d9d9",
    background: "#fff",
    height: 36,
    fontSize: 13,
    padding: "0 10px",
    outline: "none",
    boxSizing: "border-box",
  };

  const divider = {
    borderTop: "1px solid #f0f0f0",
    margin: "16px 0",
  };

  const btnOrange = {
    height: 36,
    background: "#f5a623",
    border: "none",
    borderRadius: 4,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "0 20px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const btnCancel = {
    height: 36,
    background: "#fff",
    border: "1px solid #d9d9d9",
    borderRadius: 4,
    color: "#555",
    fontSize: 13,
    padding: "0 20px",
    cursor: "pointer",
  };

  const btnSave = {
    height: 36,
    background: saving ? "#bfbfbf" : "#1e3a4a",
    border: "none",
    borderRadius: 4,
    color: saving ? "#fff" : "#fff",
    fontSize: 13,
    fontWeight: 600,
    padding: "0 20px",
    cursor: saving ? "not-allowed" : "pointer",
  };

  return (
    <div style={pageStyle}>
      <Spin spinning={loading}>
        <div style={cardStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <IdcardOutlined style={{ fontSize: 18, color: "#555" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Passageiros</span>
          </div>

          {/* Filter bar */}
          <div style={filterBarStyle}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: "#aac", fontWeight: 500, display: "block", marginBottom: 4 }}>
                Filtrar por:
              </span>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...inp, paddingLeft: 12, height: 40, fontSize: 14 }}
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Nome, email ou CPF"
                />
              </div>
            </div>
            <button style={btnOrange} onClick={abrirNovo}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
              NOVO PASSAGEIRO
            </button>
          </div>

          {/* Table header */}
          <div style={tableHeaderStyle}>
            <div style={thStyle}>Nome</div>
            <div style={thStyle}>Email</div>
            <div style={thStyle}>Contato</div>
            <div style={thStyle}>Documento</div>
            <div />
          </div>

          {/* Table rows */}
          {passageirosFiltrados.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#bbb", fontSize: 13 }}>
              Nenhum passageiro encontrado.
            </div>
          ) : (
            passageirosFiltrados.map((p, i) => (
              <div key={p.pag_id} style={rowStyle(i)}>
                <span style={tdStyle}>{p.pag_nome || "—"}</span>
                <span style={{ ...tdStyle, color: "#555" }}>{p.pag_email || "—"}</span>
                <span style={tdStyle}>{p.pag_telefone || "—"}</span>
                <span style={tdStyle}>{docPrincipal(p)}</span>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Dropdown
                    trigger={["click"]}
                    placement="bottomRight"
                    menu={{
                      items: [
                        {
                          key: "detalhes",
                          label: (
                            <span style={{ fontSize: 13 }}>👤 Detalhes</span>
                          ),
                          onClick: () => abrirDetalhes(p),
                        },
                      ],
                    }}
                  >
                    <button
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#aaa", fontSize: 20, padding: "0 6px", lineHeight: 1,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      ⋮
                    </button>
                  </Dropdown>
                </div>
              </div>
            ))
          )}
        </div>
      </Spin>

      {/* ── Modal Novo Passageiro ── */}
      {modalOpen && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div style={modalStyle}>
            {/* Modal Header */}
            <div style={modalHeaderStyle}>
              <IdcardOutlined style={{ fontSize: 16, color: "#555" }} />
              {passageiroSelecionado ? <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Detalhes do Passageiro</span> : <span style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>Novo Passageiro</span>}
            </div>

            {/* Modal Body */}
            <div style={modalBodyStyle}>
              <Form form={form} layout="vertical" onFinish={handleSalvar}>

                {/* Nome + Sobrenome + Nascimento */}
                <Row gutter={12} style={{ marginBottom: 14 }}>
                  <Col xs={24} sm={8}>
                    <Form.Item name="nome" label="Nome" style={{ marginBottom: 0 }}>
                      <Input size="middle" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="sobrenome" label="Sobrenome" style={{ marginBottom: 0 }}>
                      <Input size="middle" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="nascimento" label="Nascimento" style={{ marginBottom: 0 }}>
                      <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        size="middle"
                        placeholder=""
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Email + Celular */}
                <Row gutter={12} style={{ marginBottom: 14 }}>
                  <Col xs={24} sm={14}>
                    <Form.Item name="email" label="Email" style={{ marginBottom: 0 }}>
                      <Input
                        size="middle"
                        placeholder="Ex. fulano@example.org"
                        suffix={<span style={{ color: "#bbb" }}>✉</span>}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={10}>
                    <Form.Item name="celular" label="Celular" style={{ marginBottom: 0 }}>
                      <Input
                        size="middle"
                        placeholder="(XX) XXXXX-XXXXX"
                        suffix={<span style={{ color: "#bbb" }}>📞</span>}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={divider} />

                {/* CPF + Passaporte + CNH + RG */}
                <Row gutter={12} style={{ marginBottom: 4 }}>
                  <Col xs={12} sm={6}>
                    <Form.Item name="cpf" label="CPF" style={{ marginBottom: 0 }}>
                      <Input size="middle" placeholder="XXX.XXX-XX" suffix={<span style={{ color: "#bbb" }}>#</span>} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item name="passaporte" label="Passaporte" style={{ marginBottom: 0 }}>
                      <Input size="middle" placeholder="XXXXXXXX" suffix={<span style={{ color: "#bbb" }}>#</span>} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item name="cnh" label="CNH" style={{ marginBottom: 0 }}>
                      <Input size="middle" placeholder="Habilitação" suffix={<span style={{ color: "#bbb" }}>#</span>} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item name="rg" label="RG" style={{ marginBottom: 0 }}>
                      <Input size="middle" placeholder="Registro geral" suffix={<span style={{ color: "#bbb" }}>#</span>} />
                    </Form.Item>
                  </Col>
                </Row>
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: "#cf1322" }}>Pelo menos um documento é obrigatório.</span>
                </div>

                <div style={divider} />

                {/* Nacionalidade + Sexo */}
                <Row gutter={12} style={{ marginBottom: 14 }}>
                  <Col xs={24} sm={14}>
                    <Form.Item
                      name="nacionalidade"
                      label="Nacionalidade"
                      rules={[{ required: true, message: "Campo obrigatório." }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        size="middle"
                        placeholder="Digite a nacionalidade"
                        suffix={<span style={{ color: "#bbb" }}>🔍</span>}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={10}>
                    <Form.Item name="sexo" label="Sexo" style={{ marginBottom: 0 }} initialValue="NAO_DECLARADO">
                      <Select size="middle" style={{ width: "100%" }}>
                        <Option value="NAO_DECLARADO">Não declarado</Option>
                        <Option value="MASCULINO">Masculino</Option>
                        <Option value="FEMININO">Feminino</Option>
                        <Option value="OUTRO">Outro</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

              </Form>
            </div>

            {/* Modal Footer */}
            <div style={modalFooterStyle}>
              <button
                style={btnCancel}
                onClick={() => { form.resetFields(); setModalOpen(false); }}
              >
                CANCELAR
              </button>
              <button
                style={btnSave}
                onClick={() => form.submit()}
                disabled={saving}
              >
                {saving ? "SALVANDO..." : "CADASTRAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}