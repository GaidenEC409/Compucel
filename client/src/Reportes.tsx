/*Reportes*/
import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  CreditCard,
  Banknote,
  Smartphone,
  PlusCircle,
  X,
  Wrench,
  Zap,
  Package,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ResumenDia {
  fecha: string;
  total: number;
  num_pagos: number;
}

interface ResumenEgresoDia {
  fecha: string;
  total_egreso: number;
}

interface UltimoPago {
  monto: number;
  metodo_pago: string;
  fecha_pago: string;
  cliente: string;
  id_orden: number;
  marca_modelo: string;
}

interface UltimoEgreso {
  id_egreso: number;
  concepto: string;
  monto: number;
  categoria: string;
  fecha: string;
  registrado_por: string;
}

interface ReportData {
  hoy: number;
  semana: number;
  mes: number;
  porDia: ResumenDia[];
  ultimos: UltimoPago[];
  egresoHoy: number;
  egresoSemana: number;
  egresoMes: number;
  egresosPorDia: ResumenEgresoDia[];
  ultimosEgresos: UltimoEgreso[];
}

type Categoria = "refacciones" | "gastos_fijos" | "herramientas" | "otros";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIAS: {
  valor: Categoria;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    valor: "refacciones",
    label: "Refacciones",
    icon: <Wrench size={14} />,
    color: "bg-blue-100 text-blue-700",
  },
  {
    valor: "gastos_fijos",
    label: "Gastos fijos",
    icon: <Zap size={14} />,
    color: "bg-orange-100 text-orange-700",
  },
  {
    valor: "herramientas",
    label: "Herramientas",
    icon: <Package size={14} />,
    color: "bg-purple-100 text-purple-700",
  },
  {
    valor: "otros",
    label: "Otros",
    icon: <MoreHorizontal size={14} />,
    color: "bg-gray-100 text-gray-600",
  },
];

const categoriaInfo = (cat: string) =>
  CATEGORIAS.find((c) => c.valor === cat) ?? CATEGORIAS[3];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Reportes() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vistaGrafica, setVistaGrafica] = useState<"barras" | "linea">(
    "barras",
  );
  const [vistaTab, setVistaTab] = useState<"ingresos" | "egresos">("ingresos");

  // Modal egreso
  const [showModal, setShowModal] = useState(false);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("refacciones");
  const [guardando, setGuardando] = useState(false);

  const user = JSON.parse(localStorage.getItem("usuario_activo") || "{}");
  const esGerente = user.rol === "gerente";

  // ── Carga datos ──
  const cargar = async () => {
    try {
      const res = await api.get("/reportes/ingresos");
      setData(res.data);
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // ── Registrar egreso ──
  const registrarEgreso = async () => {
    if (!concepto.trim() || !monto || Number(monto) <= 0) {
      alert("Completa el concepto y un monto válido");
      return;
    }
    try {
      setGuardando(true);
      await api.post("/egresos", {
        id_usuario: user.id_usuario,
        concepto,
        monto: Number(monto),
        categoria,
      });
      setShowModal(false);
      setConcepto("");
      setMonto("");
      setCategoria("refacciones");
      cargar();
    } catch {
      alert("Error al registrar el egreso");
    } finally {
      setGuardando(false);
    }
  };

  // ── Eliminar egreso (solo gerente) ──
  const eliminarEgreso = async (id: number) => {
    if (!window.confirm("¿Eliminar este egreso?")) return;
    try {
      await api.delete(`/egresos/${id}`, {
        data: { id_usuario: user.id_usuario },
      });
      cargar();
    } catch {
      alert("Error al eliminar");
    }
  };

  // ── Formatos ──
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(n);

  const fmtFecha = (f: string) => {
    const d = new Date(f);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const iconoMetodo = (m: string) => {
    if (m === "transferencia") return <Smartphone size={14} />;
    if (m === "tarjeta") return <CreditCard size={14} />;
    return <Banknote size={14} />;
  };
  const colorMetodo = (m: string) => {
    if (m === "transferencia") return "bg-blue-100 text-blue-700";
    if (m === "tarjeta") return "bg-purple-100 text-purple-700";
    return "bg-green-100 text-green-700";
  };

  // ── Preparar datos del chart (combina ingresos + egresos por día) ──
  const buildChartData = () => {
    if (!data) return [];

    // Mapa fecha → { ingreso, egreso }
    const map: Record<string, { ingreso: number; egreso: number }> = {};

    data.porDia.forEach((d) => {
      const k = d.fecha.slice(0, 10);
      map[k] = { ingreso: Number(d.total), egreso: 0 };
    });

    data.egresosPorDia.forEach((d) => {
      const k = d.fecha.slice(0, 10);
      if (!map[k]) map[k] = { ingreso: 0, egreso: 0 };
      map[k].egreso = Number(d.total_egreso);
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, vals]) => ({
        fecha: fmtFecha(fecha),
        Ingresos: vals.ingreso,
        Egresos: vals.egreso,
        Ganancia: vals.ingreso - vals.egreso,
      }));
  };

  // ── Loading / error ──
  if (loading)
    return (
      <div className="p-10 text-center font-bold text-gray-500">
        Cargando reportes...
      </div>
    );
  if (!data)
    return (
      <div className="p-10 text-center text-red-500">
        Error al cargar los reportes.
      </div>
    );

  const chartData = buildChartData();

  const gananciaMes = Number(data.mes) - Number(data.egresoMes);
  const gananciaSemana = Number(data.semana) - Number(data.egresoSemana);
  const gananciaHoy = Number(data.hoy) - Number(data.egresoHoy);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex flex-col items-start">
          <Link
            to="/"
            className="text-gray-500 hover:text-blue-600 flex items-center gap-1 font-medium transition text-sm mb-1 md:mb-2"
          >
            <ArrowLeft size={16} /> Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-600 shrink-0" />
            Reportes Financieros
          </h1>
        </div>

        {/* Botón registrar egreso — gerente y técnico */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-3 md:py-2 rounded-lg flex justify-center items-center gap-2 font-bold text-sm shadow transition active:scale-95"
        >
          <PlusCircle size={18} /> Registrar Egreso
        </button>
      </div>

      {/* ── TARJETAS RESUMEN ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hoy */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase">Hoy</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-green-500 font-bold">↑ Ingresos</p>
              <p className="text-2xl font-black text-gray-800">
                {fmt(data.hoy)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-red-400 font-bold">↓ Egresos</p>
              <p className="text-xl font-black text-red-600">
                {fmt(data.egresoHoy)}
              </p>
            </div>
          </div>
          <div
            className={`flex justify-between items-center p-2 rounded-lg ${gananciaHoy >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            <span className="text-xs font-bold">Ganancia neta</span>
            <span className="font-black">{fmt(gananciaHoy)}</span>
          </div>
        </div>

        {/* Semana */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase">
            Esta semana
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-green-500 font-bold">↑ Ingresos</p>
              <p className="text-2xl font-black text-gray-800">
                {fmt(data.semana)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-red-400 font-bold">↓ Egresos</p>
              <p className="text-xl font-black text-red-600">
                {fmt(data.egresoSemana)}
              </p>
            </div>
          </div>
          <div
            className={`flex justify-between items-center p-2 rounded-lg ${gananciaSemana >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            <span className="text-xs font-bold">Ganancia neta</span>
            <span className="font-black">{fmt(gananciaSemana)}</span>
          </div>
        </div>

        {/* Mes */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-blue-200 bg-gradient-to-br from-blue-50 to-white space-y-3">
          <p className="text-xs font-bold text-blue-500 uppercase">Este mes</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-green-500 font-bold">↑ Ingresos</p>
              <p className="text-2xl font-black text-blue-700">
                {fmt(data.mes)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-red-400 font-bold">↓ Egresos</p>
              <p className="text-xl font-black text-red-600">
                {fmt(data.egresoMes)}
              </p>
            </div>
          </div>
          <div
            className={`flex justify-between items-center p-2 rounded-lg ${gananciaMes >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            <span className="text-xs font-bold">Ganancia neta</span>
            <span className="font-black text-lg">{fmt(gananciaMes)}</span>
          </div>
        </div>
      </div>

      {/* ── GRÁFICA COMBINADA ── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            Ingresos vs Egresos — últimos 30 días
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setVistaGrafica("barras")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${vistaGrafica === "barras" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              Barras
            </button>
            <button
              onClick={() => setVistaGrafica("linea")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${vistaGrafica === "linea" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              Línea
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400">
            <p>Sin datos para mostrar</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {vistaGrafica === "barras" ? (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [fmt(Number(value))]} />
                <Legend />
                <Bar dataKey="Ingresos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ganancia" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [fmt(Number(value))]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Ingresos"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="Egresos"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="Ganancia"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* ── TABS: Últimos ingresos / Últimos egresos ── */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setVistaTab("ingresos")}
            className={`flex-1 py-3 text-sm font-bold transition ${vistaTab === "ingresos" ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Últimos Ingresos
          </button>
          <button
            onClick={() => setVistaTab("egresos")}
            className={`flex-1 py-3 text-sm font-bold transition ${vistaTab === "egresos" ? "bg-red-50 text-red-700 border-b-2 border-red-500" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Últimos Egresos
          </button>
        </div>

        {/* ── Lista Ingresos ── */}
        {vistaTab === "ingresos" && (
          <div className="divide-y">
            {data.ultimos.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Sin pagos registrados
              </div>
            ) : (
              data.ultimos.map((pago, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/orden/${pago.id_orden}`}
                      className="text-blue-900 font-bold text-sm hover:text-blue-600"
                    >
                      #{pago.id_orden}
                    </Link>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {pago.cliente}
                      </p>
                      <p className="text-xs text-gray-400">
                        {pago.marca_modelo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold ${colorMetodo(pago.metodo_pago)}`}
                    >
                      {iconoMetodo(pago.metodo_pago)} {pago.metodo_pago}
                    </span>
                    <div className="text-right">
                      <p className="font-black text-green-600">
                        {fmt(pago.monto)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(pago.fecha_pago).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Lista Egresos ── */}
        {vistaTab === "egresos" && (
          <div className="divide-y">
            {data.ultimosEgresos.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <TrendingDown size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin egresos registrados</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-3 text-sm text-red-500 font-bold hover:underline"
                >
                  + Registrar primer egreso
                </button>
              </div>
            ) : (
              data.ultimosEgresos.map((eg) => {
                const cat = categoriaInfo(eg.categoria);
                return (
                  <div
                    key={eg.id_egreso}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold ${cat.color}`}
                      >
                        {cat.icon} {cat.label}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {eg.concepto}
                        </p>
                        <p className="text-xs text-gray-400">
                          {eg.registrado_por}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-black text-red-600">
                          {fmt(eg.monto)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(eg.fecha).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                      {esGerente && (
                        <button
                          onClick={() => eliminarEgreso(eg.id_egreso)}
                          className="text-gray-300 hover:text-red-500 p-1 rounded transition"
                          title="Eliminar egreso"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── MODAL REGISTRAR EGRESO ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-red-600 flex items-center gap-2 text-lg">
                <TrendingDown size={20} /> Registrar Egreso
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Concepto */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Concepto *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-400 outline-none"
                  placeholder="Ej: Pantalla Samsung A54, Pago de luz..."
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Monto ($) *
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-3 text-xl font-bold focus:ring-2 focus:ring-red-400 outline-none"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Categoría
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIAS.map((c) => (
                    <button
                      key={c.valor}
                      type="button"
                      onClick={() => setCategoria(c.valor)}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg border text-sm font-bold transition
                        ${
                          categoria === c.valor
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={registrarEgreso}
                disabled={guardando}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
