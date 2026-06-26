import { useState, useRef } from "react";
import { Hash, Type, Grid3x3 } from "lucide-react";

type TipoBloqueo = "pin" | "password" | "patron";

interface PatronInputProps {
  value: string;
  onChange: (valor: string) => void;
}

// Posiciones de los 9 puntos del patrón (3x3)
const PUNTOS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const NUMS_PATRON = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function PatronInput({ value, onChange }: PatronInputProps) {
  const [tipo, setTipo] = useState<TipoBloqueo>("pin");
  // useRef en lugar de useState para que onMouseEnter lea el valor más reciente
  // sin depender del ciclo de render de React
  const dibujando = useRef(false);
  const secuenciaRef = useRef<number[]>([]);
  const [secuencia, setSecuencia] = useState<number[]>([]);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const cambiarTipo = (nuevoTipo: TipoBloqueo) => {
    setTipo(nuevoTipo);
    onChange("");
    secuenciaRef.current = [];
    setSecuencia([]);
    dibujando.current = false;
  };

  // ── Lógica del patrón ──
  const tocarPunto = (index: number) => {
    // Gracias al ref, esta comprobación siempre lee el valor real
    if (!dibujando.current) return;
    if (secuenciaRef.current.includes(index)) return;
    const nueva = [...secuenciaRef.current, index];
    secuenciaRef.current = nueva;
    setSecuencia(nueva);
    onChange("PATRON:" + nueva.map((i) => NUMS_PATRON[i]).join("-"));
  };

  const iniciarDibujo = (index: number) => {
    dibujando.current = true;
    secuenciaRef.current = [index];
    setSecuencia([index]);
    onChange("PATRON:" + NUMS_PATRON[index]);
  };

  const terminarDibujo = () => {
    if (!dibujando.current) return;
    dibujando.current = false;
    if (secuenciaRef.current.length < 4) {
      alert("El patrón debe tener al menos 4 puntos.");
      secuenciaRef.current = [];
      setSecuencia([]);
      onChange("");
    }
  };

  const limpiarPatron = () => {
    secuenciaRef.current = [];
    setSecuencia([]);
    onChange("");
    dibujando.current = false;
  };

  const posicionPunto = (index: number) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    return { col, row };
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-gray-500 uppercase">
        Bloqueo del equipo
      </label>

      {/* Selector de tipo */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            tipo: "pin" as TipoBloqueo,
            label: "PIN",
            icon: <Hash size={14} />,
          },
          {
            tipo: "password" as TipoBloqueo,
            label: "Contraseña",
            icon: <Type size={14} />,
          },
          {
            tipo: "patron" as TipoBloqueo,
            label: "Patrón",
            icon: <Grid3x3 size={14} />,
          },
        ].map((op) => (
          <button
            key={op.tipo}
            type="button"
            onClick={() => cambiarTipo(op.tipo)}
            className={`flex items-center justify-center gap-1 py-2 rounded-lg border text-xs font-bold transition
              ${
                tipo === op.tipo
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
              }`}
          >
            {op.icon} {op.label}
          </button>
        ))}
      </div>

      {/* ── PIN ── */}
      {tipo === "pin" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              name="patron"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-center font-mono tracking-[0.4em] text-lg bg-yellow-50 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0000"
              maxLength={8}
            />
          </div>
          {/* Teclado numérico rápido */}
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(value + n)}
                className="bg-gray-100 hover:bg-blue-100 border border-gray-200 rounded-lg py-2 font-mono font-bold text-gray-700 transition active:scale-95"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg py-2 text-xs font-bold text-red-500 transition"
            >
              ✕ Borrar
            </button>
            <button
              type="button"
              onClick={() => onChange(value + "0")}
              className="bg-gray-100 hover:bg-blue-100 border border-gray-200 rounded-lg py-2 font-mono font-bold text-gray-700 transition active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => onChange(value.slice(0, -1))}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg py-2 text-xs font-bold text-gray-500 transition"
            >
              ⌫
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            {value
              ? `PIN: ${"●".repeat(value.length)}`
              : "Ingresa el PIN del equipo"}
          </p>
        </div>
      )}

      {/* ── CONTRASEÑA ── */}
      {tipo === "password" && (
        <div className="relative">
          <input
            type={mostrarPassword ? "text" : "password"}
            name="patron"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 font-mono bg-yellow-50 focus:ring-2 focus:ring-blue-500 outline-none pr-16"
            placeholder="Contraseña del equipo..."
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setMostrarPassword(!mostrarPassword)}
            className="absolute right-2 top-2 text-xs text-blue-500 hover:text-blue-700 font-bold px-1"
          >
            {mostrarPassword ? "Ocultar" : "Mostrar"}
          </button>
          {value && (
            <p className="text-xs text-gray-400 mt-1">
              Longitud: {value.length} caracteres
            </p>
          )}
        </div>
      )}

      {/* ── PATRÓN DE 9 PUNTOS ── */}
      {tipo === "patron" && (
        <div className="flex flex-col items-center space-y-3">
          <p className="text-xs text-gray-400">
            {secuencia.length === 0
              ? "Mantén presionado y arrastra por los puntos"
              : secuencia.length < 4
                ? `${secuencia.length} puntos — necesitas al menos 4`
                : `✓ Patrón de ${secuencia.length} puntos registrado`}
          </p>

          {/* Cuadrícula SVG del patrón */}
          <div
            className="relative select-none touch-none"
            style={{ width: 210, height: 210 }}
            onMouseLeave={terminarDibujo}
          >
            <svg
              width="210"
              height="210"
              className="absolute top-0 left-0"
              style={{ pointerEvents: "none" }}
            >
              {secuencia.map((puntoIdx, i) => {
                if (i === 0) return null;
                const prev = secuencia[i - 1];
                const { col: c1, row: r1 } = posicionPunto(prev);
                const { col: c2, row: r2 } = posicionPunto(puntoIdx);
                const x1 = 35 + c1 * 70;
                const y1 = 35 + r1 * 70;
                const x2 = 35 + c2 * 70;
                const y2 = 35 + r2 * 70;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#3B82F6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                );
              })}
            </svg>

            <div className="grid grid-cols-3 gap-0 w-full h-full">
              {PUNTOS.map((index) => {
                const activo = secuencia.includes(index);
                const esPrimero = secuencia[0] === index;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-center cursor-pointer"
                    style={{ width: 70, height: 70 }}
                    onMouseDown={() => iniciarDibujo(index)}
                    onMouseEnter={() => tocarPunto(index)}
                    onMouseUp={terminarDibujo}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      iniciarDibujo(index);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      const touch = e.touches[0];
                      const el = document.elementFromPoint(
                        touch.clientX,
                        touch.clientY,
                      );
                      const idx = el?.getAttribute("data-punto");
                      if (idx !== null && idx !== undefined)
                        tocarPunto(Number(idx));
                    }}
                    onTouchEnd={terminarDibujo}
                  >
                    {/* Le quitamos el data-punto al contenedor padre */}
                    <div className="relative flex items-center justify-center">
                      {/* Reducimos el tamaño a 40x40 y dejamos el data-punto SOLO aquí */}
                      <div
                        className="absolute rounded-full"
                        style={{ width: 40, height: 40 }}
                        data-punto={index}
                      />
                      {/* Círculo visual */}
                      <div
                        className={`relative rounded-full border-2 flex items-center justify-center transition-all duration-100 pointer-events-none
                          ${
                            activo
                              ? "border-blue-500 bg-blue-500 w-8 h-8 shadow-lg shadow-blue-200"
                              : "border-gray-300 bg-white w-5 h-5"
                          }
                          ${esPrimero ? "ring-2 ring-blue-300 ring-offset-1" : ""}
                        `}
                      >
                        {activo && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Orden de puntos y botón limpiar */}
          <div className="flex items-center gap-3">
            {secuencia.length > 0 && (
              <>
                <div className="flex gap-1">
                  {secuencia.map((_, pos) => (
                    <span
                      key={pos}
                      className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold"
                    >
                      {pos + 1}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={limpiarPatron}
                  className="text-xs text-red-400 hover:text-red-600 font-bold underline"
                >
                  Limpiar
                </button>
              </>
            )}
          </div>

          {value && secuencia.length >= 4 && (
            <p className="text-xs text-green-600 font-bold">
              ✓ Guardado: {value}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
