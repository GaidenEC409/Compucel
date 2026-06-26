import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  User,
  BarChart2,
  Menu,
  X,
  Settings,
  DollarSign,
} from "lucide-react";
import { puede } from "../Permisos";

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const linkClass = (path: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
      location.pathname === path
        ? "bg-blue-700 text-white shadow-md"
        : "text-blue-100 hover:bg-blue-800 hover:text-white"
    }`;

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* LOGO */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-90 transition-opacity shrink-0"
          >
            <div className="bg-white text-blue-900 p-1.5 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span>
              Compucel<span className="text-blue-300 font-normal">System</span>
            </span>
          </Link>

          {/* BOTÓN HAMBURGUESA (SOLO MÓVIL) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="p-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {menuAbierto ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* MENÚ CENTRAL (SOLO PC) */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className={linkClass("/")}>
              <LayoutDashboard size={18} />
              <span>Tablero</span>
            </Link>

            {puede(user.rol, "crear_ordenes") && (
              <Link to="/nueva-orden" className={linkClass("/nueva-orden")}>
                <PlusCircle size={18} />
                <span>Nueva Orden</span>
              </Link>
            )}

            {/* Caja — gerente y mostrador */}
            {(user.rol === "gerente" || user.rol === "mostrador") && (
              <Link to="/caja" className={linkClass("/caja")}>
                <DollarSign size={18} />
                <span>Caja</span>
              </Link>
            )}

            {user.rol === "gerente" && (
              <Link to="/reportes" className={linkClass("/reportes")}>
                <BarChart2 size={18} />
                <span>Reportes</span>
              </Link>
            )}

            {user.rol === "gerente" && (
              <Link
                to="/configuraciones"
                className={linkClass("/configuraciones")}
              >
                <Settings size={18} />
                <span>Configuraciones</span>
              </Link>
            )}
          </div>

          {/* ZONA USUARIO (SOLO PC) */}
          <div className="hidden md:flex items-center gap-4 pl-4 border-l border-blue-800">
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">
                {user.nombre_completo}
              </p>
              <p className="text-xs text-blue-300 uppercase tracking-wide mt-1">
                {user.rol}
              </p>
            </div>
            <div className="bg-blue-800 p-2 rounded-full">
              <User size={20} />
            </div>
            <button
              onClick={onLogout}
              className="ml-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>

        {/* MENÚ DESPLEGABLE (SOLO MÓVIL) */}
        {menuAbierto && (
          <div className="md:hidden py-4 border-t border-blue-800 flex flex-col gap-3">
            <Link to="/" className={linkClass("/")} onClick={cerrarMenu}>
              <LayoutDashboard size={18} />
              <span>Tablero</span>
            </Link>

            {puede(user.rol, "crear_ordenes") && (
              <Link
                to="/nueva-orden"
                className={linkClass("/nueva-orden")}
                onClick={cerrarMenu}
              >
                <PlusCircle size={18} />
                <span>Nueva Orden</span>
              </Link>
            )}

            {/* Caja móvil — gerente y mostrador */}
            {(user.rol === "gerente" || user.rol === "mostrador") && (
              <Link
                to="/caja"
                className={linkClass("/caja")}
                onClick={cerrarMenu}
              >
                <DollarSign size={18} />
                <span>Caja</span>
              </Link>
            )}

            {user.rol === "gerente" && (
              <Link
                to="/reportes"
                className={linkClass("/reportes")}
                onClick={cerrarMenu}
              >
                <BarChart2 size={18} />
                <span>Reportes</span>
              </Link>
            )}

            {user.rol === "gerente" && (
              <Link
                to="/configuraciones"
                className={linkClass("/configuraciones")}
                onClick={cerrarMenu}
              >
                <Settings size={18} />
                <span>Configuraciones</span>
              </Link>
            )}

            {/* Perfil y Salir en Móvil */}
            <div className="mt-4 pt-4 border-t border-blue-800 flex justify-between items-center px-2">
              <div className="flex items-center gap-3">
                <div className="bg-blue-800 p-2 rounded-full">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">
                    {user.nombre_completo}
                  </p>
                  <p className="text-xs text-blue-300 uppercase mt-1">
                    {user.rol}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Salir</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
