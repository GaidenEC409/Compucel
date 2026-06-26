/*CajaDiaria*/
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import {
  ArrowLeft,
  DollarSign,
  LogIn,
  LogOut,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";

interface CorteCaja {
  id_corte: number;
  tipo: "apertura" | "cierre";
  monto_inicial: number;
  monto_final: number | null;
  total_ingresos: number | null;
  total_egresos: number | null;
  diferencia: number | null;
  notas: string | null;
  fecha: string;
  usuario: string;
}

interface EstadoCaja {
  abierta: boolean;
  corte: CorteCaja | null;
}

interface ResumenCierre {
  monto_inicial: number;
  total_ingresos: number;
  total_egresos: number;
  monto_esperado: number;
  monto_final: number;
  diferencia: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    n,
  );

export default function CajaDiaria({ user }: { user: any }) {
  const [estado, setEstado] = useState<EstadoCaja | null>(null);
  const [historial, setHistorial] = useState<CorteCaja[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal apertura
  const [showApertura, setShowApertura] = useState(false);
  const [montoInicial, setMontoInicial] = useState("");
  const [notasApertura, setNotasApertura] = useState("");
  const [guardandoApertura, setGuardandoApertura] = useState(false);

  // Modal cierre
  const [showCierre, setShowCierre] = useState(false);
  const [montoFinal, setMontoFinal] = useState("");
  const [notasCierre, setNotasCierre] = useState("");
  const [guardandoCierre, setGuardandoCierre] = useState(false);
  const [resumenCierre, setResumenCierre] = useState<ResumenCierre | null>(
    null,
  );

  const cargar = async () => {
    try {
      const [estadoRes, historialRes] = await Promise.all([
        api.get("/caja/estado"),
        api.get("/caja/historial"),
      ]);
      setEstado(estadoRes.data);
      setHistorial(historialRes.data);
    } catch (error) {
      console.error("Error cargando caja:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const registrarApertura = async () => {
    if (!montoInicial || Number(montoInicial) < 0) {
      alert("Ingresa el monto inicial de caja");
      return;
    }
    try {
      setGuardandoApertura(true);
      await api.post("/caja/apertura", {
        id_usuario: user.id_usuario,
        monto_inicial: Number(montoInicial),
        notas: notasApertura || null,
      });
      setShowApertura(false);
      setMontoInicial("");
      setNotasApertura("");
      cargar();
    } catch (error: any) {
      alert(`❌ ${error.response?.data?.error || "Error de conexión"}`);
    } finally {
      setGuardandoApertura(false);
    }
  };

  const registrarCierre = async () => {
    if (!montoFinal || Number(montoFinal) < 0) {
      alert("Ingresa el monto contado al cerrar");
      return;
    }
    try {
      setGuardandoCierre(true);
      const res = await api.post("/caja/cierre", {
        id_usuario: user.id_usuario,
        monto_final: Number(montoFinal),
        notas: notasCierre || null,
      });
      setResumenCierre(res.data.resumen);
      setShowCierre(false);
      cargar();
    } catch (error: any) {
      alert(`❌ ${error.response?.data?.error || "Error de conexión"}`);
    } finally {
      setGuardandoCierre(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center font-bold text-gray-500">
        Cargando caja...
      </div>
    );

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <Link
          to="/"
          className="text-gray-500 hover:text-blue-600 flex items-center gap-2 font-medium transition"
        >
          <ArrowLeft size={20} /> Volver al Dashboard
        </Link>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign size={22} className="text-green-600" /> Caja Diaria
        </h1>
      </div>

      {/* ESTADO ACTUAL */}
      <div
        className={`rounded-xl p-6 shadow-md border ${estado?.abierta ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {estado?.abierta ? (
              <CheckCircle size={32} className="text-green-600" />
            ) : (
              <AlertTriangle size={32} className="text-gray-400" />
            )}
            <div>
              <p className="text-lg font-bold text-gray-800">
                {estado?.abierta ? "Caja abierta" : "Caja cerrada"}
              </p>
              {estado?.abierta && estado.corte && (
                <p className="text-sm text-gray-500">
                  Apertura: {fmt(Number(estado.corte.monto_inicial))} ·{" "}
                  {estado.corte.usuario} ·{" "}
                  {new Date(estado.corte.fecha).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              {!estado?.abierta && (
                <p className="text-sm text-gray-400">
                  No hay apertura registrada hoy
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {!estado?.abierta ? (
              <button
                onClick={() => setShowApertura(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow transition"
              >
                <LogIn size={18} /> Abrir Caja
              </button>
            ) : (
              <button
                onClick={() => setShowCierre(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow transition"
              >
                <LogOut size={18} /> Cerrar Caja
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RESUMEN DEL ÚLTIMO CIERRE */}
      {resumenCierre && (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-500" /> Resumen del
            Corte
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              {
                label: "Monto inicial",
                val: resumenCierre.monto_inicial,
                color: "text-gray-700",
              },
              {
                label: "Total ingresos",
                val: resumenCierre.total_ingresos,
                color: "text-green-600",
              },
              {
                label: "Total egresos",
                val: resumenCierre.total_egresos,
                color: "text-red-500",
              },
              {
                label: "Monto esperado",
                val: resumenCierre.monto_esperado,
                color: "text-blue-600",
              },
              {
                label: "Monto contado",
                val: resumenCierre.monto_final,
                color: "text-gray-700",
              },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400 uppercase font-bold">
                  {label}
                </p>
                <p className={`text-xl font-black ${color}`}>{fmt(val)}</p>
              </div>
            ))}
            <div
              className={`p-3 rounded-lg ${resumenCierre.diferencia === 0 ? "bg-green-50" : resumenCierre.diferencia > 0 ? "bg-blue-50" : "bg-red-50"}`}
            >
              <p className="text-xs text-gray-400 uppercase font-bold">
                Diferencia
              </p>
              <p
                className={`text-xl font-black ${resumenCierre.diferencia === 0 ? "text-green-600" : resumenCierre.diferencia > 0 ? "text-blue-600" : "text-red-600"}`}
              >
                {fmt(resumenCierre.diferencia)}
              </p>
              <p className="text-xs mt-1 font-bold">
                {resumenCierre.diferencia === 0
                  ? "✅ Cuadra perfecto"
                  : resumenCierre.diferencia > 0
                    ? "↑ Sobrante"
                    : "↓ Faltante"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          <h2 className="font-bold text-gray-700">Historial de Cortes</h2>
        </div>
        {historial.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Sin cortes registrados
          </div>
        ) : (
          <div className="divide-y">
            {historial.map((c) => (
              <div
                key={c.id_corte}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${c.tipo === "apertura" ? "bg-green-500" : "bg-red-500"}`}
                  >
                    {c.tipo === "apertura" ? "A" : "C"}
                  </span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm capitalize">
                      {c.tipo}
                    </p>
                    <p className="text-xs text-gray-400">{c.usuario}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-700">
                    {c.tipo === "apertura"
                      ? fmt(Number(c.monto_inicial))
                      : fmt(Number(c.monto_final))}
                  </p>
                  {c.tipo === "cierre" && c.diferencia !== null && (
                    <p
                      className={`text-xs font-bold ${Number(c.diferencia) === 0 ? "text-green-600" : Number(c.diferencia) > 0 ? "text-blue-600" : "text-red-600"}`}
                    >
                      {Number(c.diferencia) >= 0 ? "+" : ""}
                      {fmt(Number(c.diferencia))}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(c.fecha).toLocaleDateString("es-MX")}{" "}
                    {new Date(c.fecha).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL APERTURA */}
      {showApertura && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-green-700 flex items-center gap-2 text-lg">
                <LogIn size={20} /> Abrir Caja
              </h3>
              <button
                onClick={() => setShowApertura(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Monto inicial en caja ($) *
                </label>
                <input
                  type="number"
                  autoFocus
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-2xl font-bold text-center focus:ring-2 focus:ring-green-400 outline-none"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Efectivo con el que inicias el día
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notasApertura}
                  onChange={(e) => setNotasApertura(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-400 outline-none resize-none"
                  placeholder="Cualquier observación..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowApertura(false)}
                className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={registrarApertura}
                disabled={guardandoApertura}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition disabled:opacity-50"
              >
                {guardandoApertura ? "Guardando..." : "Abrir Caja"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CIERRE */}
      {showCierre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-red-700 flex items-center gap-2 text-lg">
                <LogOut size={20} /> Cerrar Caja
              </h3>
              <button
                onClick={() => setShowCierre(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Monto contado en caja ($) *
                </label>
                <input
                  type="number"
                  autoFocus
                  value={montoFinal}
                  onChange={(e) => setMontoFinal(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-2xl font-bold text-center focus:ring-2 focus:ring-red-400 outline-none"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Cuenta el efectivo físico y escríbelo aquí
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notasCierre}
                  onChange={(e) => setNotasCierre(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none"
                  placeholder="Cualquier observación..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCierre(false)}
                className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={registrarCierre}
                disabled={guardandoCierre}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition disabled:opacity-50"
              >
                {guardandoCierre ? "Cerrando..." : "Cerrar Caja"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
