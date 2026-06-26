import { useEffect, useState, useRef } from "react";
import api from "../api";
import { Camera, Trash2, X, ZoomIn } from "lucide-react";

interface Foto {
  id_foto: number;
  url: string;
  descripcion: string;
  fecha_subida: string;
  subida_por: string;
}

interface FotosOrdenProps {
  idOrden: number | string;
  idUsuario: number;
  esEntregado: boolean;
}

export default function FotosOrden({
  idOrden,
  idUsuario,
  esEntregado,
}: FotosOrdenProps) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const cargarFotos = async () => {
    try {
      const res = await api.get(`/ordenes/${idOrden}/fotos`);
      setFotos(res.data);
    } catch (error) {
      console.error("Error cargando fotos:", error);
    }
  };

  useEffect(() => {
    cargarFotos();
  }, [idOrden]);

  const subirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validar tamaño (max 10MB)
    if (archivo.size > 10 * 1024 * 1024) {
      alert("La foto no debe superar 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("foto", archivo);
    formData.append("id_usuario", String(idUsuario));
    formData.append("descripcion", descripcion);

    try {
      setSubiendo(true);
      await api.post(`/ordenes/${idOrden}/fotos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDescripcion("");
      cargarFotos();
    } catch (error) {
      alert("Error al subir la foto");
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const eliminarFoto = async (idFoto: number) => {
    if (!window.confirm("¿Eliminar esta foto?")) return;
    try {
      await api.delete(`/fotos/${idFoto}`, {
        data: { id_usuario: idUsuario },
      });
      cargarFotos();
    } catch {
      alert("Error al eliminar la foto");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Camera size={20} className="text-blue-600" />
          Evidencia Fotográfica
          {fotos.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {fotos.length}
            </span>
          )}
        </h2>
      </div>

      {/* Subir foto */}
      {!esEntregado && (
        <div className="mb-4 space-y-2">
          <input
            type="text"
            placeholder="Descripción opcional (ej: pantalla rota, conector dañado...)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <label
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed cursor-pointer transition font-bold text-sm
            ${
              subiendo
                ? "border-blue-300 bg-blue-50 text-blue-400 cursor-not-allowed"
                : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600"
            }`}
          >
            <Camera size={18} />
            {subiendo ? "Subiendo foto..." : "Tomar foto o seleccionar archivo"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={subirFoto}
              disabled={subiendo}
            />
          </label>
        </div>
      )}

      {/* Grid de fotos */}
      {fotos.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Camera size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin evidencia fotográfica</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {fotos.map((foto) => (
            <div
              key={foto.id_foto}
              className="relative group rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={foto.url}
                alt={foto.descripcion || "Evidencia"}
                className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition"
                onClick={() => setFotoAmpliada(foto.url)}
              />

              {/* Overlay con info */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setFotoAmpliada(foto.url)}
                  className="bg-white text-gray-800 p-1.5 rounded-full shadow hover:bg-gray-100"
                >
                  <ZoomIn size={16} />
                </button>
                {!esEntregado && (
                  <button
                    onClick={() => eliminarFoto(foto.id_foto)}
                    className="bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Descripción y fecha */}
              {foto.descripcion && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">
                  {foto.descripcion}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info de fotos */}
      {fotos.length > 0 && (
        <p className="text-xs text-gray-400 mt-3">
          Última foto:{" "}
          {new Date(fotos[0].fecha_subida).toLocaleDateString("es-MX")} ·{" "}
          {fotos[0].subida_por}
        </p>
      )}

      {/* Modal foto ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70"
            onClick={() => setFotoAmpliada(null)}
          >
            <X size={24} />
          </button>
          <img
            src={fotoAmpliada}
            alt="Foto ampliada"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
