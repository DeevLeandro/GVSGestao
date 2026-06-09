import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Login() {
  const [login, setLogin]     = useState("");
  const [senha, setSenha]     = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!login || !senha) {
      toast.error("Preencha login e senha");
      return;
    }

    setLoading(true);

    try {
      const response = await api.get("/ServerPrincipal/PesqLogin", {
        params: { login, senha },
      });

      let userData = null;

      if (
        response.data?.FDBS?.Manager?.TableList?.length > 0 &&
        response.data.FDBS.Manager.TableList[0].RowList?.length > 0
      ) {
        userData = response.data.FDBS.Manager.TableList[0].RowList[0].Original;
      }

      if (userData) {
        const userId    = userData.log_id;
        const userLogin = userData.log_login;
        const userEmail = userData.log_email;
        const userAtivo = userData.log_ativo;

        if (userAtivo === 0) {
          toast.error("Usuário inativo. Contate o administrador.");
          return;
        }

        localStorage.setItem("userID",    userId.toString());
        localStorage.setItem("userName",  userLogin);
        localStorage.setItem("userEmail", userEmail || "");
        localStorage.setItem("userLogin", login);

        toast.success(`Bem-vindo, ${userLogin}!`);
        navigate("/dashboard");
      } else {
        toast.error("Login ou senha inválidos");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.logoWrap}>
          <span style={styles.logoText}>
            GVS<span style={styles.logoAccent}> Gestão</span>
          </span>
          <p style={styles.subtitle}>Faça login para continuar</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Login</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Seu usuário"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div style={styles.fieldWrap}>
            <label style={styles.label}>Senha</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#F6F5F3",
  },
  card: {
    background: "#fff",
    padding: "40px 36px 36px",
    borderRadius: 14,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: 380,
    border: "1px solid #E5E5E3",
  },
  logoWrap: {
    textAlign: "center",
    marginBottom: 28,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 800,
    color: "#0A0A0A",
    letterSpacing: "-0.5px",
  },
  logoAccent: {
    color: "#1b1941",
  },
  subtitle: {
    fontSize: 13,
    color: "#9A9A9A",
    margin: "6px 0 0",
    fontWeight: 400,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#3A3A3A",
    letterSpacing: "0.2px",
  },
  input: {
    padding: "10px 14px",
    border: "1.5px solid #E5E5E3",
    borderRadius: 8,
    fontSize: 14,
    color: "#0A0A0A",
    outline: "none",
    background: "#FAFAF9",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
  },
  button: {
    marginTop: 4,
    padding: "11px",
    background: "#0A0A0A",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.03em",
    transition: "background 0.15s",
    fontFamily: "inherit",
  },
};