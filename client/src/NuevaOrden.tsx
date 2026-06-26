/*NuevaOrden — con IMEI 2 y Número de Serie*/
import { useState, useEffect } from "react";
import {
  Save,
  Smartphone,
  User,
  DollarSign,
  Search,
  FileText,
} from "lucide-react";
import api from "./api";
import PatronInput from "./components/PatronInput";
import { useNavigate } from "react-router-dom";

const TIPOS_EQUIPO = [
  { valor: "celular", label: "📱 Celular" },
  { valor: "tablet", label: "📟 Tablet" },
  { valor: "laptop", label: "💻 Laptop" },
  { valor: "pc", label: "🖥️ PC" },
  { valor: "bocina", label: "🔊 Bocina" },
  { valor: "otro", label: "🔧 Otro" },
];

const TIPOS_CON_IMEI = ["celular", "tablet"];
const TIPOS_CON_SERIE = ["laptop", "pc", "bocina", "otro"];
const TIPOS_CON_PATRON = ["celular", "tablet", "laptop", "pc", "otro"];

function soloLetras(valor: string): string {
  // Solo permite letras (incluyendo acentos y ñ), espacios y punto
  return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚäëïöüÄËÏÖÜñÑüÜ\s.]/g, "");
}
function soloNumeros(valor: string): string {
  return valor.replace(/\D/g, "");
}

export default function NuevaOrden({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    tipo_equipo: "celular",
    marca: "",
    modelo: "",
    imei_logico: "",
    imei_impreso: "",
    imei2: "",
    numero_serie: "",
    patron: "",
    falla: "",
    accesorios: "",
    anticipo: "",
  });

  const [errores, setErrores] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const [sugerenciasClientes, setSugerenciasClientes] = useState<any[]>([]);
  const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);
  const [marcasCatalogo, setMarcasCatalogo] = useState<any[]>([]);
  const [modelosCatalogo, setModelosCatalogo] = useState<any[]>([]);

  useEffect(() => {
    api.get("/catalogos/marcas").then((r) => setMarcasCatalogo(r.data));
  }, []);

  useEffect(() => {
    if (!formData.marca) return;
    const marca = marcasCatalogo.find((m) => m.nombre === formData.marca);
    if (marca) {
      api
        .get(`/catalogos/marcas/${marca.id}/modelos`)
        .then((r) => setModelosCatalogo(r.data));
    } else {
      setModelosCatalogo([]);
    }
  }, [formData.marca, marcasCatalogo]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let nuevo = value;
    if (
      ["marca", "modelo", "falla", "accesorios", "numero_serie"].includes(name)
    ) {
      nuevo = value.toUpperCase();
    }
    setFormData({ ...formData, [name]: nuevo });
  };

  const handleNombreChange = async (e: any) => {
    const valor = soloLetras(e.target.value).toUpperCase();
    setFormData({ ...formData, nombre: valor });
    if (valor.length > 0) setErrores((p) => ({ ...p, nombre: "" }));
    if (valor.length > 2) {
      try {
        const res = await api.get(`/buscar-clientes?q=${valor}`);
        setSugerenciasClientes(res.data);
        setMostrandoSugerencias(true);
      } catch {
        /* silencioso */
      }
    } else {
      setMostrandoSugerencias(false);
    }
  };

  const seleccionarCliente = (cliente: any) => {
    setFormData({
      ...formData,
      nombre: cliente.nombre.toUpperCase(),
      telefono: cliente.telefono,
    });
    setMostrandoSugerencias(false);
  };

  const validarImei = (valor: string, campo: string) => {
    const limpio = soloNumeros(valor);
    if (limpio.length > 0 && limpio.length !== 15) {
      setErrores((p) => ({
        ...p,
        [campo]: "El IMEI debe tener exactamente 15 dígitos",
      }));
    } else {
      setErrores((p) => ({ ...p, [campo]: "" }));
    }
    return limpio;
  };

  const handleTelefonoChange = (e: any) => {
    const limpio = soloNumeros(e.target.value).slice(0, 10);
    setFormData({ ...formData, telefono: limpio });
    if (limpio.length > 0 && limpio.length !== 10) {
      setErrores((p) => ({
        ...p,
        telefono: "El teléfono debe tener 10 dígitos",
      }));
    } else {
      setErrores((p) => ({ ...p, telefono: "" }));
    }
  };

  const handleImeiChange = (e: any) => {
    const { name, value } = e.target;
    const limpio = validarImei(value, name);
    setFormData({ ...formData, [name]: limpio });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user?.id_usuario) {
      alert("Error: Sesión no válida.");
      return;
    }

    const nuevosErrores: Record<string, string> = {};
    if (!formData.nombre.trim())
      nuevosErrores.nombre = "El nombre es obligatorio";
    if (/\d/.test(formData.nombre))
      nuevosErrores.nombre = "El nombre no debe contener números";
    if (!formData.modelo.trim())
      nuevosErrores.modelo = "El modelo es obligatorio";
    if (!formData.telefono || formData.telefono.length !== 10)
      nuevosErrores.telefono = "El teléfono debe tener 10 dígitos";
    if (TIPOS_CON_IMEI.includes(formData.tipo_equipo)) {
      if (formData.imei_logico && formData.imei_logico.length !== 15)
        nuevosErrores.imei_logico = "15 dígitos exactos";
      if (formData.imei_impreso && formData.imei_impreso.length !== 15)
        nuevosErrores.imei_impreso = "15 dígitos exactos";
      if (formData.imei2 && formData.imei2.length !== 15)
        nuevosErrores.imei2 = "15 dígitos exactos";
    }
    if (Object.values(nuevosErrores).some(Boolean)) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const payload = {
        ...formData,
        nombre: formData.nombre.toUpperCase(),
        marca: formData.marca.toUpperCase(),
        modelo: formData.modelo.toUpperCase(),
        falla: formData.falla.toUpperCase(),
        accesorios: formData.accesorios.toUpperCase(),
        numero_serie: formData.numero_serie.toUpperCase(),
        id_usuario_actual: user.id_usuario,
      };
      const respuesta = await api.post("/nueva-orden", payload);
      alert(`✅ ÉXITO\nOrden creada con Folio: ${respuesta.data.folio}`);
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("❌ ERROR: No se pudo conectar con el servidor.");
    }
  };

  const tieneImei = TIPOS_CON_IMEI.includes(formData.tipo_equipo);
  const tieneSerie = TIPOS_CON_SERIE.includes(formData.tipo_equipo);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200">
        <div className="bg-blue-900 text-white p-6 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <FileText size={28} className="text-blue-300" />
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider">
                Nueva Orden
              </h1>
              <p className="text-xs text-blue-200">Recepción de equipo</p>
            </div>
          </div>
          <div className="bg-blue-800 px-3 py-1 rounded-lg text-xs border border-blue-700">
            Capturista:{" "}
            <span className="font-bold text-white">{user.username}</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* CLIENTE */}
          <div className="md:col-span-2">
            <h2 className="flex items-center text-lg font-bold text-blue-800 mb-4 border-b border-gray-200 pb-2">
              <User className="mr-2" size={20} /> Datos del Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="relative z-40">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="nombre"
                    required
                    autoComplete="off"
                    value={formData.nombre}
                    className={`w-full border rounded-lg p-3 pl-10 focus:ring-2 focus:ring-blue-500 outline-none uppercase ${errores.nombre ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    placeholder="Buscar o escribir nuevo..."
                    onChange={handleNombreChange}
                  />
                  <Search
                    size={18}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />
                </div>
                {errores.nombre && (
                  <p className="text-xs text-red-500 mt-1">{errores.nombre}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Solo letras — se convierte a mayúsculas
                </p>
                {mostrandoSugerencias && sugerenciasClientes.length > 0 && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {sugerenciasClientes.map((c: any) => (
                      <li
                        key={c.id_cliente}
                        onClick={() => seleccionarCliente(c)}
                        className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0 flex justify-between group"
                      >
                        <span className="font-bold group-hover:text-blue-700">
                          {c.nombre}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {c.telefono}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="text"
                  name="telefono"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.telefono}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none font-mono ${errores.telefono ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"}`}
                  placeholder="10 dígitos"
                  onChange={handleTelefonoChange}
                />
                {errores.telefono && (
                  <p className="text-xs text-red-500 mt-1">
                    {errores.telefono}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Solo números — 10 dígitos
                </p>
              </div>
            </div>
          </div>

          {/* EQUIPO */}
          <div>
            <h2 className="flex items-center text-lg font-bold text-blue-800 mb-4 border-b border-gray-200 pb-2">
              <Smartphone className="mr-2" size={20} /> Equipo
            </h2>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Tipo de Equipo *
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {TIPOS_EQUIPO.map((t) => (
                  <button
                    key={t.valor}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        tipo_equipo: t.valor,
                        imei_logico: "",
                        imei_impreso: "",
                        imei2: "",
                        numero_serie: "",
                      })
                    }
                    className={`py-2 px-1 rounded-lg border text-sm font-bold text-center transition ${formData.tipo_equipo === t.valor ? "bg-blue-700 text-white border-blue-700 shadow" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-blue-50"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase">
                    Marca *
                  </label>
                  <input
                    list="marcas-list"
                    name="marca"
                    required
                    value={formData.marca}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-blue-500 outline-none uppercase"
                    placeholder="Samsung..."
                    onChange={handleChange}
                  />
                  <datalist id="marcas-list">
                    {marcasCatalogo.map((m) => (
                      <option key={m.id} value={m.nombre} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase">
                    Modelo *
                  </label>
                  <input
                    list="modelos-list"
                    name="modelo"
                    required
                    value={formData.modelo}
                    className={`w-full border rounded-lg p-2 text-sm focus:border-blue-500 outline-none uppercase ${errores.modelo ? "border-red-400" : "border-gray-300"}`}
                    placeholder="A54..."
                    onChange={handleChange}
                  />
                  {errores.modelo && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {errores.modelo}
                    </p>
                  )}
                  <datalist id="modelos-list">
                    {modelosCatalogo.map((m) => (
                      <option key={m.id} value={m.nombre} />
                    ))}
                  </datalist>
                </div>
              </div>

              {tieneImei && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-blue-600 uppercase">
                    IMEIs (solo números — 15 dígitos)
                  </p>
                  {[
                    {
                      name: "imei_logico",
                      label: "IMEI 1 — Sistema (*#06#)",
                      cls: "border-blue-200 bg-blue-50",
                    },
                    {
                      name: "imei_impreso",
                      label: "IMEI Impreso / Etiqueta",
                      cls: "border-gray-300",
                    },
                    {
                      name: "imei2",
                      label: "IMEI 2 — Dual SIM (opcional)",
                      cls: "border-gray-200 bg-gray-50",
                    },
                  ].map(({ name, label, cls }) => (
                    <div key={name}>
                      <label className="block text-xs text-gray-500 uppercase">
                        {label}
                      </label>
                      <input
                        type="text"
                        name={name}
                        inputMode="numeric"
                        maxLength={15}
                        value={(formData as any)[name]}
                        className={`w-full border rounded p-2 text-sm font-mono ${(errores as any)[name] ? "border-red-400 bg-red-50" : cls}`}
                        placeholder="15 dígitos"
                        onChange={handleImeiChange}
                      />
                      {(errores as any)[name] && (
                        <p className="text-xs text-red-500">
                          {(errores as any)[name]}
                        </p>
                      )}
                    </div>
                  ))}
                  {formData.imei_logico.length === 15 &&
                    formData.imei_impreso.length === 15 &&
                    formData.imei_logico !== formData.imei_impreso && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600 font-bold">
                        ⚠️ Los IMEIs no coinciden — verificar el equipo
                      </div>
                    )}
                </div>
              )}

              {tieneSerie && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase">
                    Número de Serie{" "}
                    <span className="text-gray-400 normal-case">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="numero_serie"
                    value={formData.numero_serie}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm font-mono uppercase focus:border-blue-500 outline-none"
                    placeholder="S/N del equipo"
                    onChange={handleChange}
                  />
                </div>
              )}

              {TIPOS_CON_PATRON.includes(formData.tipo_equipo) && (
                <PatronInput
                  value={formData.patron}
                  onChange={(val) => setFormData({ ...formData, patron: val })}
                />
              )}
            </div>
          </div>

          {/* FALLA / ACCESORIOS */}
          <div>
            <h2 className="flex items-center text-lg font-bold text-blue-800 mb-4 border-b border-gray-200 pb-2">
              <FileText className="mr-2" size={20} /> Estado del Equipo
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Falla Reportada *
                </label>
                <textarea
                  name="falla"
                  required
                  rows={3}
                  value={formData.falla}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none resize-none uppercase"
                  placeholder="Describe el problema..."
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Accesorios
                </label>
                <input
                  type="text"
                  name="accesorios"
                  value={formData.accesorios}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none uppercase"
                  placeholder="Ej: FUNDA, SIM, CARGADOR"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* ANTICIPO */}
          <div className="md:col-span-2 bg-green-50 p-4 rounded-lg border border-green-100 flex items-center justify-between">
            <div className="flex items-center text-green-800">
              <DollarSign size={24} className="mr-2" />
              <span className="font-bold text-lg">Anticipo recibido</span>
            </div>
            <div className="w-1/3 md:w-1/4">
              <input
                type="number"
                name="anticipo"
                value={formData.anticipo}
                className="w-full border-2 border-green-300 rounded-lg p-2 text-right text-xl font-bold text-green-900 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="0.00"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition active:scale-95 flex justify-center items-center gap-2 text-lg"
            >
              <Save size={24} /> REGISTRAR ORDEN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
