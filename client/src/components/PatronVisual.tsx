// PatronVisual.tsx
// Muestra el patrón de 9 puntos de forma visual a partir del string guardado
// Ejemplos de valor: "PATRON:1-5-9-7" | "1234" (PIN) | "miContraseña" (password)

interface PatronVisualProps {
  valor: string;
}

const POS = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // números del 1 al 9

export default function PatronVisual({ valor }: PatronVisualProps) {
  const esPatron = valor?.startsWith("PATRON:");

  // ── Si es patrón, renderizar cuadrícula ──
  if (esPatron) {
    const secuencia = valor
      .replace("PATRON:", "")
      .split("-")
      .map(Number)
      .filter(Boolean);

    // Coordenadas SVG de cada punto (1-9)
    const coords: Record<number, { x: number; y: number }> = {
      1: { x: 30, y: 30 },
      2: { x: 70, y: 30 },
      3: { x: 110, y: 30 },
      4: { x: 30, y: 70 },
      5: { x: 70, y: 70 },
      6: { x: 110, y: 70 },
      7: { x: 30, y: 110 },
      8: { x: 70, y: 110 },
      9: { x: 110, y: 110 },
    };

    return (
      <div className="flex flex-col items-center gap-2">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Líneas del patrón */}
          {secuencia.map((num, i) => {
            if (i === 0) return null;
            const prev = secuencia[i - 1];
            const { x: x1, y: y1 } = coords[prev];
            const { x: x2, y: y2 } = coords[num];
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#7C3AED"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.5"
              />
            );
          })}

          {/* Puntos */}
          {POS.map((num) => {
            const { x, y } = coords[num];
            const idx = secuencia.indexOf(num);
            const activo = idx !== -1;
            const esPrimero = secuencia[0] === num;

            return (
              <g key={num}>
                {/* Círculo de fondo */}
                <circle
                  cx={x}
                  cy={y}
                  r={activo ? 12 : 7}
                  fill={activo ? "#7C3AED" : "#EDE9FE"}
                  stroke={activo ? "#5B21B6" : "#C4B5FD"}
                  strokeWidth="1.5"
                />
                {/* Punto interior blanco cuando activo */}
                {activo && <circle cx={x} cy={y} r={4} fill="white" />}
                {/* Número de orden */}
                {activo && (
                  <text
                    x={x + 14}
                    y={y + 4}
                    fontSize="9"
                    fill="#7C3AED"
                    fontWeight="bold"
                    textAnchor="start"
                  >
                    {idx + 1}
                  </text>
                )}
                {/* Ring en el primer punto */}
                {esPrimero && (
                  <circle
                    cx={x}
                    cy={y}
                    r={16}
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <p className="text-xs text-purple-500 font-bold">
          Patrón · {secuencia.length} puntos
        </p>
      </div>
    );
  }

  // ── Si es PIN (solo números) ──
  if (valor && /^\d+$/.test(valor)) {
    return (
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase font-bold mb-1">PIN</p>
        <p className="font-mono text-2xl tracking-[0.4em] text-purple-900">
          {valor}
        </p>
        <p className="text-xs text-gray-400 mt-1">{valor.length} dígitos</p>
      </div>
    );
  }

  // ── Contraseña o texto ──
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400 uppercase font-bold mb-1">
        Contraseña
      </p>
      <p className="font-mono font-bold text-purple-900 tracking-widest">
        {valor || "Sin patrón"}
      </p>
    </div>
  );
}
