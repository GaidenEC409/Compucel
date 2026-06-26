/*Dashboard*/
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import { Search, Eye, Ban, AlertTriangle, X, PlusCircle } from "lucide-react";
import { puede } from "./Permisos";

interface User {
  id_usuario: number;
  username: string;
  nombre_completo: string;
  rol: string;
}

interface Orden {
  id_orden: number;
  cliente: string;
  marca_modelo: string;
  estado: string;
  fecha_creacion: string;
  recibido_por: string;
}

// Traduce el valor del estado a etiqueta legible
function etiquetaEstado(estado: string): string {
  const mapa: Record<string, string> = {
    recibido: "Recibido",
    pendiente: "Recibido", // órdenes viejas
    en_revision: "En Revisión",
    en_reparacion: "En Reparación",
    reparado: "Reparado",
    listo: "Reparado", // órdenes viejas
    entregado: "Entregado",
    cancelada: "Cancelada",
  };
  return mapa[estado] ?? estado.replace(/_/g, " ");
}

export default function Dashboard({ user }: { user: User }) {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");

  const puedeCancelar = puede(user.rol, "cancelar_ordenes");
  const puedeCrearOrdenes = puede(user.rol, "crear_ordenes");

  const cargarOrdenes = async () => {
    try {
      const res = await api.get("/ordenes");
      setOrdenes(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al conectar:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const handleClickCancelar = (id: number) => {
    setSelectedOrdenId(id);
    setMotivoSeleccionado("");
    setMotivoPersonalizado("");
    setShowCancelModal(true);
  };

  const confirmarCancelacion = async () => {
    const motivoFinal =
      motivoSeleccionado === "OTRO" ? motivoPersonalizado : motivoSeleccionado;
    if (!motivoFinal?.trim()) return alert("Indica un motivo");
    try {
      await api.put(`/ordenes/${selectedOrdenId}/cancelar`, {
        motivo: motivoFinal,
        id_usuario_actual: user.id_usuario,
      });
      setShowCancelModal(false);
      cargarOrdenes();
      alert("Orden cancelada");
    } catch {
      alert("Error al cancelar");
    }
  };

  const ordenesFiltradas = ordenes.filter(
    (o) =>
      o.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.id_orden.toString().includes(busqueda) ||
      o.marca_modelo.toLowerCase().includes(busqueda.toLowerCase()),
  );

  // ── Colores por estado (incluye nuevos nombres + legacy) ──
  const badgeColor = (estado: string) => {
    switch (estado) {
      case "recibido":
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "en_revision":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "en_reparacion":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "reparado":
      case "listo":
        return "bg-green-100 text-green-800 border border-green-200";
      case "entregado":
        return "bg-gray-100 text-gray-600 border border-gray-200";
      case "cancelada":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatearFecha = (f: string) => {
    const d = new Date(f);
    return `${d.toLocaleDateString("es-MX")} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  // ── NOTIFICACIONES ──
  const hoy = new Date();

  // Detecta tanto "reparado" (nuevo) como "listo" (órdenes viejas)
  const ordenesListasParaEntregar = ordenes.filter(
    (o) => o.estado === "reparado" || o.estado === "listo",
  );

  const ordenesEstancadas = ordenes.filter((o) => {
    if (["entregado", "cancelada"].includes(o.estado)) return false;
    const dias = Math.floor(
      (hoy.getTime() - new Date(o.fecha_creacion).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return dias >= 5;
  });

  return (
    <div className="space-y-6 relative">
      {/* BARRA SUPERIOR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tablero</h2>
          <p className="text-gray-500 text-sm">
            Gestión operativa del taller ·{" "}
            <span className="font-bold text-blue-600 capitalize">
              {user.rol}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-2 top-2.5 text-gray-400"
              size={20}
            />
            <input
              className="pl-10 w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-blue-500 transition"
              placeholder="Buscar por cliente, folio o equipo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {puedeCrearOrdenes && (
            <Link
              to="/nueva-orden"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition hover:scale-105 whitespace-nowrap"
            >
              <PlusCircle size={20} />
              <span className="font-bold hidden md:inline">Nueva Orden</span>
            </Link>
          )}
        </div>
      </div>

      {/* NOTIFICACIONES */}
      {(ordenesListasParaEntregar.length > 0 ||
        ordenesEstancadas.length > 0) && (
        <div className="space-y-3">
          {/* Reparadas listas para entregar */}
          {ordenesListasParaEntregar.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600 text-lg">✅</span>
                <span className="font-bold text-green-800">
                  {ordenesListasParaEntregar.length} equipo
                  {ordenesListasParaEntregar.length > 1
                    ? "s reparado(s)"
                    : " reparado"}{" "}
                  listo{ordenesListasParaEntregar.length > 1 ? "s" : ""} para
                  entregar
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ordenesListasParaEntregar.map((o) => (
                  <Link
                    key={o.id_orden}
                    to={`/orden/${o.id_orden}`}
                    className="flex items-center gap-1 bg-white border border-green-200 hover:border-green-400 text-green-800 text-xs px-3 py-1.5 rounded-full transition-colors"
                  >
                    <span className="font-bold">#{o.id_orden}</span>
                    <span className="text-green-600">·</span>
                    <span>{o.cliente}</span>
                    <span className="text-green-500">·</span>
                    <span className="text-gray-500">{o.marca_modelo}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Órdenes estancadas */}
          {ordenesEstancadas.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-500 text-lg">⚠️</span>
                <span className="font-bold text-orange-800">
                  {ordenesEstancadas.length} orden
                  {ordenesEstancadas.length > 1 ? "es llevan" : " lleva"} más de
                  5 días sin moverse
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ordenesEstancadas.map((o) => {
                  const dias = Math.floor(
                    (hoy.getTime() - new Date(o.fecha_creacion).getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return (
                    <Link
                      key={o.id_orden}
                      to={`/orden/${o.id_orden}`}
                      className="flex items-center gap-1 bg-white border border-orange-200 hover:border-orange-400 text-orange-800 text-xs px-3 py-1.5 rounded-full transition-colors"
                    >
                      <span className="font-bold">#{o.id_orden}</span>
                      <span className="text-orange-400">·</span>
                      <span>{o.cliente}</span>
                      <span className="text-orange-400">·</span>
                      <span className="text-gray-500">{dias}d</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TABLA */}
      <div className="bg-white rounded shadow overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Cargando datos...
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            {busqueda
              ? "No se encontraron resultados."
              : "No hay órdenes registradas."}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-4">Folio</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Equipo</th>
                <th className="p-4">Estado</th>
                <th className="p-4 hidden sm:table-cell">Fecha</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ordenesFiltradas.map((orden) => (
                <tr
                  key={orden.id_orden}
                  className="hover:bg-blue-50 transition"
                >
                  <td className="p-4 font-bold text-blue-900">
                    #{orden.id_orden}
                  </td>
                  <td className="p-4">{orden.cliente}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {orden.marca_modelo}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${badgeColor(orden.estado)}`}
                    >
                      {/* ← AQUÍ está el cambio: usa etiquetaEstado() en vez de .replace(/_/g, " ") */}
                      {etiquetaEstado(orden.estado)}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500 hidden sm:table-cell">
                    {formatearFecha(orden.fecha_creacion)}
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <Link
                      to={`/orden/${orden.id_orden}`}
                      className="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition"
                      title="Ver detalle"
                    >
                      <Eye size={18} />
                    </Link>

                    {puedeCancelar &&
                      orden.estado !== "cancelada" &&
                      orden.estado !== "entregado" && (
                        <button
                          onClick={() => handleClickCancelar(orden.id_orden)}
                          className="text-red-500 hover:bg-red-100 p-2 rounded-full transition"
                          title="Cancelar orden"
                        >
                          <Ban size={18} />
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CANCELACIÓN */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle size={18} /> Cancelar #{selectedOrdenId}
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona el motivo de cancelación:
            </p>
            <select
              className="w-full border p-2 rounded mb-2"
              value={motivoSeleccionado}
              onChange={(e) => setMotivoSeleccionado(e.target.value)}
            >
              <option value="">-- Motivo --</option>
              <option value="Precio no aceptado">Precio no aceptado</option>
              <option value="Sin repuesto">Sin repuesto</option>
              <option value="Equipo irreparable">Equipo irreparable</option>
              <option value="Cliente retiró equipo">
                Cliente retiró equipo
              </option>
              <option value="OTRO">Otro...</option>
            </select>
            {motivoSeleccionado === "OTRO" && (
              <textarea
                className="w-full border p-2 rounded mb-2"
                rows={2}
                placeholder="Escribe la razón..."
                value={motivoPersonalizado}
                onChange={(e) => setMotivoPersonalizado(e.target.value)}
              />
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCancelacion}
                className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
