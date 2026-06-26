import { useState, useEffect } from "react";
import {
  Settings,
  Smartphone,
  Wifi,
  Users,
  UserCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  Search,
  Edit2,
  Check,
  X,
} from "lucide-react";
import api from "./api";

// ─── TIPOS ───────────────────────────────────────
interface Marca {
  id: number;
  nombre: string;
}
interface Modelo {
  id: number;
  nombre: string;
  id_marca: number;
}
interface Compania {
  id: number;
  nombre: string;
}
interface Usuario {
  id_usuario: number;
  username: string;
  nombre_completo: string;
  rol: string;
  activo: number;
}
interface Cliente {
  id_cliente: number;
  nombre: string;
  telefono: string;
}

// ─── COMPONENTE PRINCIPAL ────────────────────────
export default function Configuraciones({ user }: { user: any }) {
  const [tabActiva, setTabActiva] = useState<
    "marcas" | "companias" | "usuarios" | "clientes" | "perfil"
  >("marcas");

  const tabs = [
    { id: "marcas", label: "Marcas & Modelos", icon: Smartphone },
    { id: "companias", label: "Compañías", icon: Wifi },
    { id: "usuarios", label: "Usuarios", icon: Users },
    { id: "clientes", label: "Clientes", icon: UserCircle },
    { id: "perfil", label: "Mi Cuenta", icon: Settings },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-900 p-2 rounded-lg">
          <Settings size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuraciones</h1>
          <p className="text-sm text-gray-500">
            Administra catálogos y usuarios del sistema
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                tabActiva === tab.id
                  ? "border-blue-700 text-blue-700 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        {tabActiva === "marcas" && <TabMarcas user={user} />}
        {tabActiva === "companias" && <TabCompanias user={user} />}
        {tabActiva === "usuarios" && <TabUsuarios user={user} />}
        {tabActiva === "clientes" && <TabClientes user={user} />}
        {tabActiva === "perfil" && <TabPerfil user={user} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TAB: MARCAS & MODELOS
// ═══════════════════════════════════════════════════
function TabMarcas({ user }: { user: any }) {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [marcaAbierta, setMarcaAbierta] = useState<number | null>(null);
  const [modelos, setModelos] = useState<Record<number, Modelo[]>>({});
  const [nuevoModelo, setNuevoModelo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarMarcas();
  }, []);

  const cargarMarcas = async () => {
    const res = await api.get("/catalogos/marcas");
    setMarcas(res.data);
  };

  const cargarModelos = async (idMarca: number) => {
    if (modelos[idMarca]) return; // ya cargados
    const res = await api.get(`/catalogos/marcas/${idMarca}/modelos`);
    setModelos((prev) => ({ ...prev, [idMarca]: res.data }));
  };

  const toggleMarca = async (idMarca: number) => {
    if (marcaAbierta === idMarca) {
      setMarcaAbierta(null);
    } else {
      setMarcaAbierta(idMarca);
      await cargarModelos(idMarca);
    }
  };

  const agregarMarca = async () => {
    if (!nuevaMarca.trim()) return;
    setError("");
    setCargando(true);
    try {
      await api.post("/catalogos/marcas", {
        nombre: nuevaMarca,
        id_usuario: user.id_usuario,
      });
      setNuevaMarca("");
      await cargarMarcas();
    } catch (e: any) {
      setError(e.response?.data?.error || "Error al guardar");
    } finally {
      setCargando(false);
    }
  };

  const eliminarMarca = async (id: number) => {
    if (!confirm("¿Eliminar esta marca y todos sus modelos?")) return;
    await api.delete(`/catalogos/marcas/${id}`, {
      data: { id_usuario: user.id_usuario },
    });
    await cargarMarcas();
    setMarcaAbierta(null);
  };

  const agregarModelo = async (idMarca: number) => {
    if (!nuevoModelo.trim()) return;
    await api.post(`/catalogos/marcas/${idMarca}/modelos`, {
      nombre: nuevoModelo,
      id_usuario: user.id_usuario,
    });
    setNuevoModelo("");
    // Recargar modelos de esa marca
    const res = await api.get(`/catalogos/marcas/${idMarca}/modelos`);
    setModelos((prev) => ({ ...prev, [idMarca]: res.data }));
  };

  const eliminarModelo = async (idModelo: number, idMarca: number) => {
    await api.delete(`/catalogos/modelos/${idModelo}`, {
      data: { id_usuario: user.id_usuario },
    });
    const res = await api.get(`/catalogos/marcas/${idMarca}/modelos`);
    setModelos((prev) => ({ ...prev, [idMarca]: res.data }));
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-700 mb-4">Marcas y Modelos</h2>

      {/* Agregar marca */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={nuevaMarca}
          onChange={(e) => setNuevaMarca(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregarMarca()}
          placeholder="Nueva marca (ej: Realme)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={agregarMarca}
          disabled={cargando}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

      {/* Lista de marcas */}
      <div className="space-y-2">
        {marcas.map((marca) => (
          <div
            key={marca.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Fila de marca */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
              <button
                onClick={() => toggleMarca(marca.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                {marcaAbierta === marca.id ? (
                  <ChevronDown size={16} className="text-blue-600" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
                <span className="font-semibold text-gray-800">
                  {marca.nombre}
                </span>
                {modelos[marca.id] && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({modelos[marca.id].length} modelos)
                  </span>
                )}
              </button>
              <button
                onClick={() => eliminarMarca(marca.id)}
                className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Modelos desplegables */}
            {marcaAbierta === marca.id && (
              <div className="px-6 py-3 bg-white border-t border-gray-100">
                {/* Agregar modelo */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={nuevoModelo}
                    onChange={(e) => setNuevoModelo(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && agregarModelo(marca.id)
                    }
                    placeholder={`Nuevo modelo de ${marca.nombre}...`}
                    className="flex-1 border border-gray-200 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    onClick={() => agregarModelo(marca.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Agregar
                  </button>
                </div>

                {/* Lista de modelos */}
                {modelos[marca.id]?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    Sin modelos aún
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {modelos[marca.id]?.map((m) => (
                      <span
                        key={m.id}
                        className="flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full"
                      >
                        {m.nombre}
                        <button
                          onClick={() => eliminarModelo(m.id, marca.id)}
                          className="text-blue-400 hover:text-red-500 ml-1 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {marcas.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">
            No hay marcas registradas aún
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TAB: COMPAÑÍAS
// ═══════════════════════════════════════════════════
function TabCompanias({ user }: { user: any }) {
  const [companias, setCompanias] = useState<Compania[]>([]);
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    const res = await api.get("/catalogos/companias");
    setCompanias(res.data);
  };

  const agregar = async () => {
    if (!nueva.trim()) return;
    setError("");
    try {
      await api.post("/catalogos/companias", {
        nombre: nueva,
        id_usuario: user.id_usuario,
      });
      setNueva("");
      await cargar();
    } catch (e: any) {
      setError(e.response?.data?.error || "Error al guardar");
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta compañía?")) return;
    await api.delete(`/catalogos/companias/${id}`, {
      data: { id_usuario: user.id_usuario },
    });
    await cargar();
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-700 mb-4">
        Compañías / Operadoras
      </h2>

      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregar()}
          placeholder="Nueva compañía (ej: Bait)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={agregar}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {companias.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Wifi size={15} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {c.nombre}
              </span>
            </div>
            <button
              onClick={() => eliminar(c.id)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {companias.length === 0 && (
          <p className="col-span-3 text-center text-gray-400 py-8 text-sm">
            No hay compañías registradas
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TAB: USUARIOS
// ═══════════════════════════════════════════════════
function TabUsuarios({ user }: { user: any }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    nombre_completo: "",
    rol: "mostrador",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    const res = await api.get("/usuarios");
    setUsuarios(res.data);
  };

  const crearUsuario = async () => {
    if (!form.username || !form.password || !form.nombre_completo) {
      setError("Todos los campos son obligatorios");
      return;
    }
    setError("");
    try {
      await api.post("/usuarios", {
        ...form,
        id_usuario_actual: user.id_usuario,
      });
      setForm({
        username: "",
        password: "",
        nombre_completo: "",
        rol: "mostrador",
      });
      setMostrarForm(false);
      await cargar();
    } catch (e: any) {
      setError(e.response?.data?.error || "Error al crear usuario");
    }
  };

  const toggleActivo = async (id: number, estadoActual: number) => {
    await api.put(`/usuarios/${id}/activo`, {
      activo: estadoActual === 1 ? 0 : 1,
      id_usuario_actual: user.id_usuario,
    });
    await cargar();
  };

  const colorRol = (rol: string) => {
    if (rol === "gerente") return "bg-purple-100 text-purple-700";
    if (rol === "tecnico") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-700">
          Usuarios del Sistema
        </h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
        >
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Formulario nuevo usuario */}
      {mostrarForm && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              value={form.nombre_completo}
              onChange={(e) =>
                setForm({ ...form, nombre_completo: e.target.value })
              }
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="juanp"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={verPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400 pr-10"
                placeholder="••••••••"
              />
              <button
                onClick={() => setVerPassword(!verPassword)}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Rol
            </label>
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="mostrador">Mostrador</option>
              <option value="tecnico">Técnico</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>
          {error && (
            <p className="md:col-span-2 text-red-500 text-xs">{error}</p>
          )}
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={crearUsuario}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Save size={15} /> Guardar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="pb-2 font-semibold text-gray-500">Nombre</th>
              <th className="pb-2 font-semibold text-gray-500">Username</th>
              <th className="pb-2 font-semibold text-gray-500">Rol</th>
              <th className="pb-2 font-semibold text-gray-500 text-center">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <tr key={u.id_usuario} className={!u.activo ? "bg-red-50" : ""}>
                <td className="py-3 font-medium text-gray-800">
                  <div className="flex items-center gap-2">
                    {u.nombre_completo}
                    {!u.activo && (
                      <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-normal">
                        Inactivo
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 text-gray-500">@{u.username}</td>
                <td className="py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorRol(u.rol)}`}
                  >
                    {u.rol}
                  </span>
                </td>
                <td className="py-3 text-center">
                  {u.id_usuario !== user.id_usuario && (
                    <button
                      onClick={() => toggleActivo(u.id_usuario, u.activo)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        u.activo
                          ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600"
                          : "bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-700"
                      }`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </button>
                  )}
                  {u.id_usuario === user.id_usuario && (
                    <span className="text-xs text-gray-400">(tú)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TAB: CLIENTES
// ═══════════════════════════════════════════════════
function TabClientes({ user }: { user: any }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [formEdit, setFormEdit] = useState({ nombre: "", telefono: "" });

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async (q = "") => {
    const res = await api.get(`/clientes${q ? `?q=${q}` : ""}`);
    setClientes(res.data);
  };

  const buscar = (e: any) => {
    const val = e.target.value;
    setBusqueda(val);
    cargar(val);
  };

  const iniciarEdicion = (c: Cliente) => {
    setEditando(c.id_cliente);
    setFormEdit({ nombre: c.nombre, telefono: c.telefono });
  };

  const guardarEdicion = async (id: number) => {
    await api.put(`/clientes/${id}`, {
      ...formEdit,
      id_usuario: user.id_usuario,
    });
    setEditando(null);
    await cargar(busqueda);
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-700 mb-4">Clientes</h2>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={buscar}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="pb-2 font-semibold text-gray-500">Nombre</th>
              <th className="pb-2 font-semibold text-gray-500">Teléfono</th>
              <th className="pb-2 font-semibold text-gray-500 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientes.map((c) => (
              <tr key={c.id_cliente}>
                <td className="py-2.5">
                  {editando === c.id_cliente ? (
                    <input
                      value={formEdit.nombre}
                      onChange={(e) =>
                        setFormEdit({ ...formEdit, nombre: e.target.value })
                      }
                      className="border border-blue-300 rounded px-2 py-1 text-sm w-full outline-none"
                    />
                  ) : (
                    <span className="font-medium text-gray-800">
                      {c.nombre}
                    </span>
                  )}
                </td>
                <td className="py-2.5">
                  {editando === c.id_cliente ? (
                    <input
                      value={formEdit.telefono}
                      onChange={(e) =>
                        setFormEdit({ ...formEdit, telefono: e.target.value })
                      }
                      className="border border-blue-300 rounded px-2 py-1 text-sm w-full outline-none"
                    />
                  ) : (
                    <span className="text-gray-500">{c.telefono}</span>
                  )}
                </td>
                <td className="py-2.5 text-right">
                  {editando === c.id_cliente ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => guardarEdicion(c.id_cliente)}
                        className="text-green-600 hover:text-green-700 p-1"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => iniciarEdicion(c)}
                      className="text-blue-500 hover:text-blue-700 p-1 transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-gray-400 py-8">
                  No se encontraron clientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabPerfil({ user }: { user: any }) {
  const [form, setForm] = useState({
    password_actual: "",
    password_nueva: "",
    password_confirmar: "",
  });
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  const cambiarPassword = async () => {
    setError("");
    setExito(false);

    if (
      !form.password_actual ||
      !form.password_nueva ||
      !form.password_confirmar
    ) {
      setError("Todos los campos son obligatorios");
      return;
    }
    if (form.password_nueva !== form.password_confirmar) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }
    if (form.password_nueva.length < 6) {
      setError("La contraseña nueva debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);
    try {
      await api.put(`/usuarios/${user.id_usuario}/password`, {
        password_actual: form.password_actual,
        password_nueva: form.password_nueva,
        id_usuario_actual: user.id_usuario,
      });
      setExito(true);
      setForm({
        password_actual: "",
        password_nueva: "",
        password_confirmar: "",
      });
    } catch (e: any) {
      setError(e.response?.data?.error || "Error al cambiar contraseña");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-bold text-gray-700 mb-1">Mi Cuenta</h2>
      <p className="text-sm text-gray-500 mb-6">
        Usuario:{" "}
        <span className="font-bold text-blue-700">@{user.username}</span>
        {" · "}
        <span className="capitalize">{user.rol}</span>
      </p>

      <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">
        Cambiar Contraseña
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Contraseña Actual
          </label>
          <div className="relative">
            <input
              type={verActual ? "text" : "password"}
              value={form.password_actual}
              onChange={(e) =>
                setForm({ ...form, password_actual: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <button
              onClick={() => setVerActual(!verActual)}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            >
              {verActual ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Contraseña Nueva
          </label>
          <div className="relative">
            <input
              type={verNueva ? "text" : "password"}
              value={form.password_nueva}
              onChange={(e) =>
                setForm({ ...form, password_nueva: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 6 caracteres"
            />
            <button
              onClick={() => setVerNueva(!verNueva)}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            >
              {verNueva ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Confirmar Contraseña Nueva
          </label>
          <input
            type="password"
            value={form.password_confirmar}
            onChange={(e) =>
              setForm({ ...form, password_confirmar: e.target.value })
            }
            onKeyDown={(e) => e.key === "Enter" && cambiarPassword()}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Repite la contraseña nueva"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            ❌ {error}
          </p>
        )}
        {exito && (
          <p className="text-green-600 text-sm bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            ✅ Contraseña actualizada correctamente
          </p>
        )}

        <button
          onClick={cambiarPassword}
          disabled={cargando}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors"
        >
          <Save size={16} />
          {cargando ? "Guardando..." : "Actualizar Contraseña"}
        </button>
      </div>
    </div>
  );
}
