import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './paginas/Login';
import Dashboard from './paginas/Dashboard';
import Extrato from './paginas/Extrato';
import Operar from './paginas/Operar';
import Clientes from "./paginas/Clientes";
import Compra from "./paginas/Compra";
import EntradaManual from "./paginas/EntradaManual";
import CompraTurbinada from "./paginas/CompraTurbinada";
import PromocaoBumerangue from "./paginas/PromocaoBumerangue";
import TransferenciaEntreContas from "./paginas/TransferenciaEntreContas";
import TransferenciaParidade from "./paginas/TransferenciaParidade";
import TransferenciaDireta from "./paginas/TransferenciaDireta";
import VendaMilhas from "./paginas/VendaMilhas";
import Programas from "./paginas/Programas";
import RegistroPassagemEmitida from "./paginas/RegistroPassagemEmitida";
import SaidaManual from "./paginas/SaidaManual";
import RegistroPassageiros from "./paginas/RegistroPassageiros";
import VendaDireta from "./paginas/VendaDireta";
import RegistroHospedagem from "./paginas/RegistroHospedagem";
import ConsultaPassageiroCPF from "./paginas/ConsultaPassageiroCPF";
import DetalhesGestor from "./paginas/DetalhesGestor";
import CadastroGestor from './paginas/Clientes';


const isAutenticado = () => !!localStorage.getItem('userID');

const RotaPrivada = ({ children }) => {
  return isAutenticado() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#363636', color: '#fff' } }} />
      <Routes>
        <Route path="/login"    element={<Login />} />

        <Route path="/dashboard"       element={<RotaPrivada><Dashboard /></RotaPrivada>} />
        <Route path="/detalhes-gestor" element={<RotaPrivada><DetalhesGestor /></RotaPrivada>} />
        <Route path="/clientes"        element={<RotaPrivada><Clientes /></RotaPrivada>} />
        <Route path="/extrato/:id"     element={<RotaPrivada><Extrato /></RotaPrivada>} />
        <Route path="/cadastro-gestor" element={<CadastroGestor />} />
        <Route path="/operar"          element={<RotaPrivada><Operar /></RotaPrivada>} />

        {/* Grupo Movimentação */}
        <Route path="/operar/compra"                  element={<RotaPrivada><Compra /></RotaPrivada>} />
        <Route path="/operar/entrada-manual"          element={<RotaPrivada><EntradaManual /></RotaPrivada>} />
        <Route path="/operar/compra-turbinada"        element={<RotaPrivada><CompraTurbinada /></RotaPrivada>} />
        <Route path="/operar/promocao-bumerangue"     element={<RotaPrivada><PromocaoBumerangue /></RotaPrivada>} />
        <Route path="/operar/transferencia-contas"    element={<RotaPrivada><TransferenciaEntreContas /></RotaPrivada>} />
        <Route path="/operar/transferencia-paridade"  element={<RotaPrivada><TransferenciaParidade /></RotaPrivada>} />
        <Route path="/operar/transferencia-direta"    element={<RotaPrivada><TransferenciaDireta /></RotaPrivada>} />
        <Route path="/operar/venda-milhas"            element={<RotaPrivada><VendaMilhas /></RotaPrivada>} />
        <Route path="/operar/programas"               element={<RotaPrivada><Programas /></RotaPrivada>} />

        {/* Grupo Agência */}
        <Route path="/operar/registro-passageiros"       element={<RotaPrivada><RegistroPassageiros /></RotaPrivada>} />
        <Route path="/operar/emissao-venda-direta"       element={<RotaPrivada><VendaDireta /></RotaPrivada>} />
        <Route path="/operar/registro-hospedagem"        element={<RotaPrivada><RegistroHospedagem /></RotaPrivada>} />
        <Route path="/operar/consulta-passageiro-cpf"    element={<RotaPrivada><ConsultaPassageiroCPF /></RotaPrivada>} />
        <Route path="/operar/registro-passagem-emitida"  element={<RotaPrivada><RegistroPassagemEmitida /></RotaPrivada>} />
        <Route path="/operar/saida-manual"               element={<RotaPrivada><SaidaManual /></RotaPrivada>} />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;