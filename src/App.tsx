import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import Kanban from './pages/Kanban'
import Envios from './pages/Envios'
import AsaasClientes from './pages/AsaasClientes'
import AsaasCobranca from './pages/AsaasCobranca'
import AsaasCobrancasEditar from './pages/AsaasCobrancasEditar'
import EditarContatos from './pages/EditarContatos'
import Monitoramento from './pages/Monitoramento'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lancamentos" element={<Lancamentos />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/envios" element={<Envios />} />
          <Route path="/asaas-clientes" element={<AsaasClientes />} />
          <Route path="/asaas-cobranca" element={<AsaasCobranca />} />
          <Route path="/asaas-cobrancas-editar" element={<AsaasCobrancasEditar />} />
          <Route path="/editar-contatos" element={<EditarContatos />} />
          <Route path="/monitoramento" element={<Monitoramento />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
