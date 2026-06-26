/*components/RefaccionesOrden.tsx*/
import { useEffect, useState } from "react";
import api from "../api";
import { PlusCircle, Trash2, Wrench, TrendingUp } from "lucide-react";

interface Refaccion {
  id_refaccion: number;
  descripcion: string;
  costo_compra: number;
  precio_cobrado: number;
  fecha: string;
  registrado_por: string;
}

interface Props {
  idOrden: number;
  idUsuario: number;
  esEntregado: boolean;
  onCambio?: () => void; // callback para que DetalleOrden recargue el total si es necesario
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    n,
  );

export default function RefaccionesOrden({
  idOrden,
  idUsuario,
  esEntregado,
  onCambio,
}: Props) {
  const [refacciones, setRefacciones] = useState<Refaccion[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario nueva refacción
  const [mostrarForm, setMostrarForm] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [costoCompra, setCostoCompra] = useState("");
  const [precioCobrado, setPrecioCobrado] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      const res = await api.get(`/ordenes/${idOrden}/refacciones`);
      setRefacciones(res.data);
    } catch (error) {
      console.error("Error cargando refacciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [idOrden]);

  const agregarRefaccion = async () => {
    if (!descripcion.trim())
      return alert("Escribe la descripción de la refacción");
    if (!costoCompra || !precioCobrado) return alert("Ingresa ambos precios");

    try {
      setGuardando(true);
      await api.post(`/ordenes/${idOrden}/refacciones`, {
        id_usuario: idUsuario,
        descripcion,
        costo_compra: Number(costoCompra),
        precio_cobrado: Number(precioCobrado),
      });
      setDescripcion("");
      setCostoCompra("");
      setPrecioCobrado("");
      setMostrarForm(false);
      cargar();
      onCambio?.();
    } catch (error: any) {
      alert(`❌ ${error.response?.data?.error || "Error de conexión"}`);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarRefaccion = async (id: number) => {
    if (!window.confirm("¿Eliminar esta refacción?")) return;
    try {
      await api.delete(`/refacciones/${id}`, {
        data: { id_usuario: idUsuario },
      });
      cargar();
      onCambio?.();
    } catch {
      alert("Error al eliminar");
    }
  };

  // Totales
  const totalCosto = refacciones.reduce(
    (a, r) => a + Number(r.costo_compra),
    0,
  );
  const totalCobrado = refacciones.reduce(
    (a, r) => a + Number(r.precio_cobrado),
    0,
  );
  const utilidad = totalCobrado - totalCosto;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Wrench size={20} className="text-blue-600" /> Refacciones Usadas
        </h2>
        {!esEntregado && (
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="flex items-center gap-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-bold transition"
          >
            <PlusCircle size={15} /> Agregar
          </button>
        )}
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Descripción *
            </label>
            <input
              type="text"
              autoFocus
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm uppercase focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Ej: PANTALLA SAMSUNG A54, BATERÍA IPHONE 13..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Costo de Compra ($)
              </label>
              <input
                type="number"
                value={costoCompra}
                onChange={(e) => setCostoCompra(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="Lo que pagaste"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Precio al Cliente ($)
              </label>
              <input
                type="number"
                value={precioCobrado}
                onChange={(e) => setPrecioCobrado(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="Lo que cobras"
              />
            </div>
          </div>
          {/* Vista previa de utilidad */}
          {costoCompra && precioCobrado && (
            <div
              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 w-fit
              ${Number(precioCobrado) - Number(costoCompra) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
            >
              <TrendingUp size={12} />
              Utilidad: {fmt(Number(precioCobrado) - Number(costoCompra))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setMostrarForm(false)}
              className="flex-1 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm transition"
            >
              Cancelar
            </button>
            <button
              onClick={agregarRefaccion}
              disabled={guardando}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Agregar Refacción"}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-4">Cargando...</p>
      ) : refacciones.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Sin refacciones registradas
        </p>
      ) : (
        <div className="space-y-2">
          {refacciones.map((r) => (
            <div
              key={r.id_refaccion}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">
                  {r.descripcion}
                </p>
                <p className="text-xs text-gray-400">{r.registrado_por}</p>
              </div>
              <div className="flex items-center gap-4 ml-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Costo</p>
                  <p className="text-sm font-bold text-red-500">
                    {fmt(Number(r.costo_compra))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Cobrado</p>
                  <p className="text-sm font-bold text-gray-700">
                    {fmt(Number(r.precio_cobrado))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Utilidad</p>
                  <p
                    className={`text-sm font-bold ${Number(r.precio_cobrado) - Number(r.costo_compra) >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {fmt(Number(r.precio_cobrado) - Number(r.costo_compra))}
                  </p>
                </div>
                {!esEntregado && (
                  <button
                    onClick={() => eliminarRefaccion(r.id_refaccion)}
                    className="text-gray-300 hover:text-red-500 p-1 rounded transition"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Totales */}
          <div className="border-t pt-3 mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-xs text-gray-400 uppercase font-bold">
                Total Costo
              </p>
              <p className="font-black text-red-600">{fmt(totalCosto)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400 uppercase font-bold">
                Total Cobrado
              </p>
              <p className="font-black text-gray-700">{fmt(totalCobrado)}</p>
            </div>
            <div
              className={`rounded-lg p-2 ${utilidad >= 0 ? "bg-green-50" : "bg-red-50"}`}
            >
              <p className="text-xs text-gray-400 uppercase font-bold">
                Utilidad
              </p>
              <p
                className={`font-black ${utilidad >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {fmt(utilidad)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
