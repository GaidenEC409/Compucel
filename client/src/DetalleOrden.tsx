/*DetalleOrden*/
import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";
import FotosOrden from "./components/FotosOrden";
import RefaccionesOrden from "./components/RefaccionesOrden";
import {
  ArrowLeft,
  Printer,
  Save,
  CheckCircle,
  DollarSign,
  Briefcase,
  Package,
  Unlock,
  AlertTriangle,
  PlusCircle,
  X,
  Edit2,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { TicketImprimible } from "./components/TicketImprimible";
import PatronVisual from "./components/PatronVisual";
import { puede } from "./Permisos";
import { MessageCircle } from "lucide-react";

interface Pago {
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
}

interface OrdenDetalle {
  id_orden: number;
  cliente: string;
  telefono: string;
  tipo_equipo: string;
  marca: string;
  modelo: string;
  imei_logico: string;
  imei_impreso: string;
  imei2: string;
  numero_serie: string;
  patron: string;
  marca_modelo: string;
  falla_reportada: string;
  accesorios: string;
  diagnostico_tecnico: string;
  total: number;
  estado: string;
  fecha_creacion: string;
  historial_pagos: Pago[];
}

const ESTADOS_FLUJO = [
  {
    valor: "recibido",
    label: "Recibido",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  {
    valor: "en_revision",
    label: "En Revisión",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    valor: "en_reparacion",
    label: "En Reparación",
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    valor: "reparado",
    label: "Reparado ✓",
    color: "bg-green-100 text-green-800 border-green-300",
  },
];

const MENSAJES_WHATSAPP: Record<string, any> = {
  recibido: (c: string, m: string, id: number) =>
    `Hola ${c}, confirmamos que hemos recibido su equipo *${m}* con folio *#${id}*. En cuanto iniciemos el diagnóstico le avisamos. ¡Gracias por preferirnos!`,
  en_revision: (c: string, m: string, id: number) =>
    `Hola ${c}, su equipo *${m}* (folio *#${id}*) está siendo revisado por nuestro técnico. En cuanto tengamos el diagnóstico le informamos. ¡Gracias por su espera!`,
  en_reparacion: (c: string, m: string, id: number) =>
    `Hola ${c}, su equipo *${m}* (folio *#${id}*) ya está en proceso de reparación. Le avisamos cuando esté listo. ¡Gracias por su paciencia!`,
  reparado: (c: string, m: string, id: number) =>
    `Hola ${c}, su equipo *${m}* ya está listo para recoger en Compucel. Su folio es *#${id}*. ¡Le esperamos!`,
  entregado: (c: string, m: string, id: number) =>
    `Hola ${c}, gracias por recoger su equipo *${m}* (folio *#${id}*). Recuerde que tiene garantía en la reparación. ¡Fue un placer atenderle!`,
};

const METODOS_PAGO = ["efectivo", "transferencia", "tarjeta"];
const TIPOS_CON_IMEI = ["celular", "tablet"];
const TIPOS_CON_PATRON = ["celular", "tablet", "laptop", "pc", "otro"];
const TIPOS_CON_SERIE = ["laptop", "pc", "bocina", "otro"];

function etiquetaEstado(estado: string): string {
  const mapa: Record<string, string> = {
    recibido: "Recibido",
    pendiente: "Recibido",
    en_revision: "En Revisión",
    en_reparacion: "En Reparación",
    reparado: "Reparado",
    listo: "Reparado",
    entregado: "Entregado",
    cancelada: "Cancelada",
  };
  return mapa[estado] ?? estado.replace(/_/g, " ");
}

export default function DetalleOrden() {
  const { id } = useParams();
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [diagnostico, setDiagnostico] = useState("");
  const [costo, setCosto] = useState<number | string>(0);

  const [editando, setEditando] = useState(false);
  const [editData, setEditData] = useState({
    cliente: "",
    telefono: "",
    falla_reportada: "",
    accesorios: "",
  });

  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [montoAbono, setMontoAbono] = useState<string>("");
  const [metodoAbono, setMetodoAbono] = useState("efectivo");
  const [guardandoAbono, setGuardandoAbono] = useState(false);

  const [showWaModal, setShowWaModal] = useState(false);
  const [mensajeWa, setMensajeWa] = useState("");

  const user = JSON.parse(localStorage.getItem("usuario_activo") || "{}");
  const puedeCambiarEstado = puede(user.rol, "cambiar_estados");
  const puedeGuardarDiag = puede(user.rol, "guardar_diagnostico");
  const puedeCobrar = puede(user.rol, "cobrar_entregar");
  const puedeEditarPrecio = puede(user.rol, "editar_precio");

  const ticketRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket_${id}`,
  });

  const cargarDetalles = async () => {
    try {
      const res = await api.get(`/ordenes/${id}`);
      setOrden(res.data);
      setDiagnostico(res.data.diagnostico_tecnico || "");
      setCosto(res.data.total || 0);
      setEditData({
        cliente: res.data.cliente || "",
        telefono: res.data.telefono || "",
        falla_reportada: res.data.falla_reportada || "",
        accesorios: res.data.accesorios || "",
      });
      setLoading(false);
    } catch (error) {
      console.error("Error cargando orden:", error);
      setLoading(false);
    }
    cargarLogEstados();
  };

  useEffect(() => {
    cargarDetalles();
  }, [id]);

  const coincidenImeis = orden?.imei_logico === orden?.imei_impreso;

  const guardarCambios = async () => {
    try {
      await api.put(`/ordenes/${id}`, {
        diagnostico_tecnico: diagnostico,
        total: Number(costo),
      });
      alert("✅ Diagnóstico y precio actualizados.");
      cargarDetalles();
    } catch {
      alert("Error al guardar cambios.");
    }
  };

  const guardarEdicion = async () => {
    try {
      await api.put(`/ordenes/${id}/editar`, {
        cliente: editData.cliente.toUpperCase(),
        telefono: editData.telefono,
        falla_reportada: editData.falla_reportada.toUpperCase(),
        accesorios: editData.accesorios.toUpperCase(),
        id_usuario: user.id_usuario,
      });
      alert("✅ Datos actualizados correctamente.");
      setEditando(false);
      cargarDetalles();
    } catch {
      alert("Error al actualizar los datos.");
    }
  };

  // ── Estado para el modal de cambio de estado ──
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [estadoPendiente, setEstadoPendiente] = useState("");
  const [notaEstado, setNotaEstado] = useState("");
  const [logEstados, setLogEstados] = useState<any[]>([]);

  const cargarLogEstados = async () => {
    try {
      const res = await api.get(`/ordenes/${id}/log-estados`);
      setLogEstados(res.data);
    } catch {
      /* silencioso */
    }
  };

  // Agregar cargarLogEstados() al final de cargarDetalles:
  // cargarLogEstados();

  const abrirModalEstado = (nuevoEstado: string) => {
    setEstadoPendiente(nuevoEstado);
    setNotaEstado("");
    setShowEstadoModal(true);
  };

  const confirmarCambioEstado = async () => {
    try {
      await api.put(`/ordenes/${id}/estado`, {
        estado: estadoPendiente,
        id_usuario_actual: user.id_usuario,
        nota: notaEstado || null,
      });
      setShowEstadoModal(false);
      setNotaEstado("");
      setEstadoPendiente("");
      cargarDetalles();
    } catch {
      alert("Error al cambiar estado");
    }
  };

  const registrarAbono = async () => {
    const monto = Number(montoAbono);
    if (!monto || monto <= 0) return alert("Ingresa un monto válido");
    if (monto > restante)
      return alert(
        `El abono no puede ser mayor al restante ($${restante.toFixed(2)})`,
      );
    try {
      setGuardandoAbono(true);
      await api.post(`/ordenes/${id}/pagar`, {
        id_usuario: user.id_usuario,
        monto,
        metodo: metodoAbono,
        solo_abono: true,
      });
      setShowAbonoModal(false);
      setMontoAbono("");
      setMetodoAbono("efectivo");
      cargarDetalles();
      alert(`✅ Abono de $${monto.toFixed(2)} registrado correctamente.`);
    } catch (error: any) {
      alert(`❌ Error:\n${error.response?.data?.error || "Error de conexión"}`);
    } finally {
      setGuardandoAbono(false);
    }
  };

  const cobrarYEntregar = async () => {
    if (!user?.id_usuario) {
      alert("Error de sesión. Recarga la página.");
      return;
    }
    const totalCalculado = Number(costo);
    if (totalCalculado <= 0) {
      if (
        !window.confirm(
          "⚠️ EL COSTO TOTAL ES $0.\n\n¿Es garantía o reparación gratuita?",
        )
      )
        return;
    }
    const restante = Math.max(0, totalCalculado - totalPagado);
    const msg =
      restante > 0
        ? `💰 COBRO FINAL\n\nEl cliente debe pagar: $${restante}\n\n¿Confirmas el cobro y entrega?`
        : `✅ ENTREGA\n\nEl equipo ya está pagado. ¿Confirmas la entrega?`;
    if (!window.confirm(msg)) return;
    try {
      setLoading(true);
      await api.put(`/ordenes/${id}`, {
        diagnostico_tecnico: diagnostico,
        total: totalCalculado,
      });
      await api.post(`/ordenes/${id}/pagar`, {
        id_usuario: user.id_usuario,
        monto: restante,
        metodo: "efectivo",
      });
      alert("🎉 ¡LISTO!\nOrden cerrada y equipo entregado.");
      cargarDetalles();
    } catch (error: any) {
      alert(`❌ Error:\n${error.response?.data?.error || "Error de conexión"}`);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalWhatsApp = () => {
    if (!orden) return;
    const generador =
      MENSAJES_WHATSAPP[orden.estado] || MENSAJES_WHATSAPP["reparado"];
    const msg =
      typeof generador === "function"
        ? generador(orden.cliente, orden.marca_modelo, orden.id_orden)
        : generador;
    setMensajeWa(msg);
    setShowWaModal(true);
  };

  const enviarWhatsApp = () => {
    if (!orden) return;
    const telefono = orden.telefono.replace(/\D/g, "");
    window.open(
      `https://wa.me/52${telefono}?text=${encodeURIComponent(mensajeWa)}`,
      "_blank",
    );
    setShowWaModal(false);
  };

  if (loading)
    return (
      <div className="p-10 text-center font-bold text-gray-500">
        Cargando detalles...
      </div>
    );
  if (!orden)
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        Orden no encontrada
      </div>
    );

  const totalPagado = orden.historial_pagos
    ? orden.historial_pagos.reduce((acc, p) => acc + Number(p.monto), 0)
    : 0;
  const restante = Number(costo) - totalPagado;
  const esEntregado =
    orden.estado === "entregado" || orden.estado === "cancelada";

  const badgeEstado = () => {
    switch (orden.estado) {
      case "entregado":
        return "bg-gray-200 text-gray-600";
      case "cancelada":
        return "bg-red-100 text-red-600";
      case "reparado":
      case "listo":
        return "bg-green-100 text-green-700";
      case "en_reparacion":
        return "bg-purple-100 text-purple-700 animate-pulse";
      case "en_revision":
        return "bg-blue-100 text-blue-700 animate-pulse";
      default:
        return "bg-yellow-100 text-yellow-700 animate-pulse";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <Link
          to="/"
          className="text-gray-500 hover:text-blue-600 flex items-center gap-2 font-medium transition"
        >
          <ArrowLeft size={20} /> Volver al Dashboard
        </Link>
        <span
          className={`px-4 py-1.5 rounded-full font-bold text-sm uppercase shadow-sm ${badgeEstado()}`}
        >
          {etiquetaEstado(orden.estado)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── COLUMNA IZQUIERDA ── */}
        <div className="md:col-span-2 space-y-6">
          {/* TARJETA INFORMACIÓN */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />

            {!esEntregado && (
              <button
                onClick={() => setEditando(!editando)}
                className="absolute top-4 right-4 flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 transition"
              >
                <Edit2 size={13} /> {editando ? "Cancelar" : "Editar datos"}
              </button>
            )}

            {editando ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Nombre Cliente
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2 uppercase"
                    value={editData.cliente}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        cliente: e.target.value
                          .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s.]/g, "")
                          .toUpperCase(),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Teléfono
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={editData.telefono}
                    onChange={(e) =>
                      setEditData({ ...editData, telefono: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Falla Reportada
                  </label>
                  <textarea
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg p-2 uppercase"
                    value={editData.falla_reportada}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        falla_reportada: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Accesorios
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2 uppercase"
                    value={editData.accesorios}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        accesorios: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => setEditando(false)}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarEdicion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {/* Cliente */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Cliente
                  </h3>
                  <p className="text-xl font-bold text-gray-800">
                    {orden.cliente}
                  </p>
                  <p className="text-blue-600 font-medium">{orden.telefono}</p>
                </div>

                {/* Equipo */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase">
                    Equipo
                  </h3>
                  <p className="text-lg font-medium">{orden.marca_modelo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-bold border border-gray-200">
                      {orden.tipo_equipo === "celular" && "📱"}
                      {orden.tipo_equipo === "tablet" && "📟"}
                      {orden.tipo_equipo === "laptop" && "💻"}
                      {orden.tipo_equipo === "pc" && "🖥️"}
                      {orden.tipo_equipo === "bocina" && "🔊"}
                      {orden.tipo_equipo === "otro" && "🔧"}{" "}
                      {orden.tipo_equipo || "celular"}
                    </span>
                  </div>

                  {/* IMEIs — celular / tablet */}
                  {TIPOS_CON_IMEI.includes(orden.tipo_equipo) &&
                    (orden.imei_logico || orden.imei_impreso) && (
                      <div className="mt-3 space-y-1 border-t pt-2 border-dashed border-gray-200">
                        <p className="text-sm flex items-center gap-2">
                          <span className="text-gray-400 text-xs uppercase w-16">
                            Sistema:
                          </span>
                          <span className="font-mono font-bold text-gray-700 select-all">
                            {orden.imei_logico || "N/A"}
                          </span>
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <span className="text-gray-400 text-xs uppercase w-16">
                            Etiqueta:
                          </span>
                          <span
                            className={`font-mono font-bold select-all ${coincidenImeis ? "text-gray-700" : "text-red-600"}`}
                          >
                            {orden.imei_impreso || "N/A"}
                          </span>
                        </p>
                        {!coincidenImeis &&
                          orden.imei_logico &&
                          orden.imei_impreso && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold flex items-center gap-1 w-fit mt-1">
                              <AlertTriangle size={12} /> IMEIs No coinciden
                            </span>
                          )}
                        {/* IMEI 2 — dual SIM */}
                        {orden.imei2 && (
                          <p className="text-sm flex items-center gap-2">
                            <span className="text-gray-400 text-xs uppercase w-16">
                              IMEI 2:
                            </span>
                            <span className="font-mono font-bold text-gray-700 select-all">
                              {orden.imei2}
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                  {/* Número de serie — laptop / PC / bocina / otro */}
                  {TIPOS_CON_SERIE.includes(orden.tipo_equipo) &&
                    orden.numero_serie && (
                      <div className="mt-2 border-t pt-2 border-dashed border-gray-200">
                        <p className="text-sm flex items-center gap-2">
                          <span className="text-gray-400 text-xs uppercase w-16">
                            Serie:
                          </span>
                          <span className="font-mono font-bold text-gray-700 select-all">
                            {orden.numero_serie}
                          </span>
                        </p>
                      </div>
                    )}
                </div>

                {/* Falla */}
                <div className="md:col-span-2 bg-red-50 p-3 rounded-lg border border-red-100">
                  <h3 className="text-xs font-bold text-red-400 uppercase mb-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> Falla Reportada
                  </h3>
                  <p className="text-gray-800 font-medium">
                    {orden.falla_reportada}
                  </p>
                </div>

                {/* Patrón */}
                {TIPOS_CON_PATRON.includes(orden.tipo_equipo) && (
                  <div className="md:col-span-1">
                    <h3 className="text-xs font-bold text-purple-500 uppercase mb-2 flex items-center gap-1">
                      <Unlock size={14} /> Patrón / Contraseña
                    </h3>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex justify-center min-h-[60px] items-center">
                      <PatronVisual valor={orden.patron} />
                    </div>
                  </div>
                )}

                {/* Accesorios */}
                <div className="md:col-span-1">
                  <h3 className="text-xs font-bold text-orange-500 uppercase mb-2 flex items-center gap-1">
                    <Package size={14} /> Accesorios
                  </h3>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-orange-900 text-sm font-medium min-h-[60px]">
                    {orden.accesorios || "Ninguno"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DIAGNÓSTICO Y COSTOS */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 relative">
            <div className="flex items-center gap-2 mb-4 text-blue-900 border-b pb-2">
              <Briefcase size={20} />
              <h2 className="text-lg font-bold">Diagnóstico y Costos</h2>
            </div>

            {(esEntregado || !puedeGuardarDiag) && (
              <div className="absolute inset-0 bg-gray-50/60 z-10 cursor-not-allowed rounded-xl" />
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Diagnóstico Técnico
                </label>
                <textarea
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 uppercase"
                  rows={4}
                  placeholder="Detalles de la reparación..."
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value.toUpperCase())}
                  disabled={esEntregado || !puedeGuardarDiag}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Costo Total ($)
                </label>
                <input
                  type="number"
                  className="w-full md:w-1/3 border border-gray-300 p-3 rounded-lg text-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  disabled={
                    esEntregado ||
                    !puedeGuardarDiag ||
                    (Number(orden.total) > 0 && !puedeEditarPrecio)
                  }
                />
                {Number(orden.total) > 0 &&
                  !puedeEditarPrecio &&
                  !esEntregado && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      🔒 El precio ya fue establecido. Solo el gerente puede
                      modificarlo.
                    </p>
                  )}
              </div>
            </div>

            {!esEntregado && puedeGuardarDiag && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={guardarCambios}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
                >
                  <Save size={18} /> Guardar Progreso
                </button>
              </div>
            )}
          </div>

          {/* REFACCIONES */}
          <RefaccionesOrden
            idOrden={orden.id_orden}
            idUsuario={user.id_usuario}
            esEntregado={esEntregado}
            onCambio={cargarDetalles}
          />

          {/* FOTOS */}
          <FotosOrden
            idOrden={orden.id_orden}
            idUsuario={user.id_usuario}
            esEntregado={esEntregado}
          />
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div className="space-y-6">
          {/* FLUJO DE TRABAJO */}
          {!esEntregado && puedeCambiarEstado && (
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">
                Flujo de trabajo
              </h3>
              <div className="space-y-2">
                {ESTADOS_FLUJO.map((e) => {
                  const estadoNorm =
                    orden.estado === "pendiente"
                      ? "recibido"
                      : orden.estado === "listo"
                        ? "reparado"
                        : orden.estado;
                  const esActual = estadoNorm === e.valor;
                  return (
                    <button
                      key={e.valor}
                      onClick={() => abrirModalEstado(e.valor)}
                      disabled={esActual}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition
                        ${esActual ? e.color + " cursor-default font-bold" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 cursor-pointer"}`}
                    >
                      {esActual ? "● " : "○ "}
                      {e.label}
                      {esActual && " (actual)"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* HISTORIAL DE ESTADOS */}
          {logEstados.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">
                Historial de estados
              </h3>
              <div className="space-y-2">
                {logEstados.map((l, i) => (
                  <div
                    key={i}
                    className="text-xs border-l-2 border-blue-200 pl-3 py-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700">
                        {etiquetaEstado(l.estado_nuevo)}
                      </span>
                      <span className="text-gray-400">
                        {new Date(l.fecha).toLocaleDateString("es-MX")}{" "}
                        {new Date(l.fecha).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-gray-400">{l.usuario}</p>
                    {l.nota && (
                      <p className="text-gray-600 mt-0.5 bg-gray-50 rounded px-2 py-0.5 italic">
                        {l.nota}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BALANCE FINANCIERO */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg font-bold text-green-700 flex items-center gap-2 mb-4 pb-2 border-b">
              <DollarSign /> Balance Financiero
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Costo Total:</span>
                <span className="font-bold text-gray-800 text-lg">
                  ${Number(costo).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-green-600 bg-green-50 p-2 rounded">
                <span>Pagado:</span>
                <span className="font-bold">-${totalPagado.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-600">Restante:</span>
                <span
                  className={`text-2xl font-black ${restante <= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ${Math.max(0, restante).toFixed(2)}
                </span>
              </div>
            </div>

            {orden.historial_pagos && orden.historial_pagos.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                  Pagos registrados
                </p>
                {orden.historial_pagos.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-xs text-gray-500 py-1 border-b border-dashed last:border-0"
                  >
                    <span>
                      {new Date(p.fecha_pago).toLocaleDateString("es-MX")} ·{" "}
                      {p.metodo_pago}
                    </span>
                    <span className="font-bold text-green-700">
                      ${Number(p.monto).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!esEntregado && puedeCobrar && restante > 0 && (
              <button
                onClick={() => setShowAbonoModal(true)}
                className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg font-bold flex justify-center items-center gap-2 border border-blue-200 transition text-sm"
              >
                <PlusCircle size={16} /> Registrar Abono
              </button>
            )}

            {!esEntregado && puedeCobrar ? (
              <button
                onClick={cobrarYEntregar}
                className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition transform hover:scale-[1.02]"
              >
                <CheckCircle size={24} />
                {restante > 0 ? "COBRAR Y ENTREGAR" : "ENTREGAR (PAGADO)"}
              </button>
            ) : !esEntregado ? (
              <div className="mt-3 bg-gray-50 text-gray-400 p-4 rounded-xl text-center text-sm border border-gray-200">
                Sin permiso para cobrar
              </div>
            ) : (
              <div className="mt-3 bg-gray-100 text-gray-500 p-4 rounded-xl text-center font-bold border border-gray-200">
                <CheckCircle
                  size={32}
                  className="mx-auto mb-2 text-green-500"
                />
                ORDEN FINALIZADA
              </div>
            )}
          </div>

          {/* WHATSAPP */}
          {!esEntregado && (
            <button
              onClick={abrirModalWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-md transition"
            >
              <MessageCircle size={20} /> AVISAR AL CLIENTE
            </button>
          )}

          {/* IMPRIMIR */}
          <button
            onClick={handlePrint}
            className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700 flex justify-center items-center gap-2 shadow-md transition"
          >
            <Printer size={20} /> IMPRIMIR TICKET
          </button>

          <div style={{ display: "none" }}>
            <TicketImprimible ref={ticketRef} orden={orden} />
          </div>
        </div>
      </div>

      {/* MODAL CAMBIO DE ESTADO */}
      {showEstadoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-blue-700 text-lg">
                Cambiar a "
                {ESTADOS_FLUJO.find((e) => e.valor === estadoPendiente)?.label}"
              </h3>
              <button
                onClick={() => setShowEstadoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Nota{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                rows={3}
                autoFocus
                value={notaEstado}
                onChange={(e) => setNotaEstado(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                placeholder="Ej: Se diagnosticó pantalla rota, requiere refacción..."
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowEstadoModal(false)}
                className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCambioEstado}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ABONO */}
      {showAbonoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-blue-700 flex items-center gap-2 text-lg">
                <PlusCircle size={20} /> Registrar Abono
              </h3>
              <button
                onClick={() => setShowAbonoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Total:</span>
                <span className="font-bold">${Number(costo).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Ya pagado:</span>
                <span className="font-bold">-${totalPagado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold border-t pt-2 mt-2">
                <span>Restante:</span>
                <span>${Math.max(0, restante).toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Monto del abono ($)
                </label>
                <input
                  type="number"
                  autoFocus
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Método de pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodoAbono(m)}
                      className={`py-2 rounded-lg border text-sm font-bold capitalize transition ${metodoAbono === m ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAbonoModal(false)}
                className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={registrarAbono}
                disabled={guardandoAbono}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition disabled:opacity-50"
              >
                {guardandoAbono ? "Guardando..." : "Confirmar Abono"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WHATSAPP */}
      {showWaModal && orden && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[480px] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-green-700 flex items-center gap-2 text-lg">
                <MessageCircle size={20} /> Mensaje al Cliente
              </h3>
              <button
                onClick={() => setShowWaModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-2 uppercase font-bold">
              Puedes editar el mensaje antes de enviar
            </p>
            <textarea
              rows={6}
              value={mensajeWa}
              onChange={(e) => setMensajeWa(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-400 outline-none resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowWaModal(false)}
                className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={enviarWhatsApp}
                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} /> Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
