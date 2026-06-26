/*App.tsx — con ruta /caja agregada*/
import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import NuevaOrden from "./NuevaOrden";
import DetalleOrden from "./DetalleOrden";
import Navbar from "./components/Nav";
import Reportes from "./Reportes";
import Configuraciones from "./Configuraciones";
import CajaDiaria from "./CajaDiaria"; // ← NUEVO

export interface User {
  id_usuario: number;
  username: string;
  nombre_completo: string;
  rol: string;
}

interface AppContentProps {
  user: User | null;
  onLogin: (datosUsuario: User) => void;
  onLogout: () => void;
}

function AppContent({ user, onLogin, onLogout }: AppContentProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/", { replace: true });
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Login onLogin={onLogin} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/nueva-orden" element={<NuevaOrden user={user} />} />
          <Route path="/orden/:id" element={<DetalleOrden />} />

          {/* Solo gerente */}
          <Route
            path="/reportes"
            element={
              user.rol === "gerente" ? (
                <Reportes />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/configuraciones"
            element={
              user.rol === "gerente" ? (
                <Configuraciones user={user} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Caja — gerente y mostrador */}
          <Route
            path="/caja"
            element={
              user.rol === "gerente" || user.rol === "mostrador" ? (
                <CajaDiaria user={user} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const guardado = localStorage.getItem("usuario_activo");
    return guardado ? JSON.parse(guardado) : null;
  });

  const handleLogin = (datosUsuario: User) => {
    setUser(datosUsuario);
    localStorage.setItem("usuario_activo", JSON.stringify(datosUsuario));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("usuario_activo");
  };

  return (
    <Router>
      <AppContent user={user} onLogin={handleLogin} onLogout={handleLogout} />
    </Router>
  );
}

export default App;
