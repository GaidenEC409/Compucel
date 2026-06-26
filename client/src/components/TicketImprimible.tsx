/*Ticket*/
import React from "react";

interface Pago {
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
}

interface OrdenTicket {
  id_orden: number;
  cliente: string;
  telefono: string;
  marca_modelo: string;
  imei_logico?: string;
  falla_reportada: string;
  accesorios?: string;
  diagnostico_tecnico?: string;
  patron?: string;
  total: number;
  estado: string;
  fecha_creacion: string;
  historial_pagos?: Pago[];
}

interface TicketProps {
  orden: OrdenTicket;
}

// Etiqueta legible para el estado (compatible con valores legacy)
function etiquetaEstado(estado: string): string {
  const mapa: Record<string, string> = {
    recibido: "RECIBIDO",
    pendiente: "RECIBIDO",
    en_revision: "EN REVISIÓN",
    en_reparacion: "EN REPARACIÓN",
    reparado: "REPARADO",
    listo: "REPARADO",
    entregado: "ENTREGADO",
    cancelada: "CANCELADA",
  };
  return mapa[estado] ?? estado.toUpperCase().replace(/_/g, " ");
}

export const TicketImprimible = React.forwardRef<HTMLDivElement, TicketProps>(
  ({ orden }, ref) => {
    if (!orden) return null;

    const totalPagado = orden.historial_pagos
      ? orden.historial_pagos.reduce((acc, p) => acc + Number(p.monto), 0)
      : 0;
    const restante = Math.max(0, Number(orden.total) - totalPagado);
    const fechaFormato = new Date(orden.fecha_creacion).toLocaleDateString(
      "es-MX",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    return (
      <div
        ref={ref}
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "12px",
          maxWidth: "300px",
          margin: "0 auto",
          padding: "12px",
          color: "#000",
          background: "#fff",
        }}
      >
        {/* Encabezado */}
        <div
          style={{
            textAlign: "center",
            borderBottom: "1px dashed #000",
            paddingBottom: "8px",
            marginBottom: "8px",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>
            ⚡ COMPUCEL
          </div>
          <div>Reparación de Celulares y Equipos</div>
          <div>Av. Gral. Álvaro Obregón 91a, Iguala</div>
          <div>Tel: 733-123-4567</div>
        </div>

        {/* Folio y fecha */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "14px",
            marginBottom: "4px",
          }}
        >
          <span>FOLIO: #{orden.id_orden}</span>
          <span>
            {new Date(orden.fecha_creacion).toLocaleDateString("es-MX")}
          </span>
        </div>
        <div
          style={{
            fontSize: "10px",
            textAlign: "right",
            marginBottom: "8px",
            color: "#555",
          }}
        >
          {fechaFormato}
        </div>

        {/* Cliente */}
        <div
          style={{
            borderBottom: "1px dashed #000",
            paddingBottom: "8px",
            marginBottom: "8px",
          }}
        >
          <div>
            <strong>Cliente:</strong> {orden.cliente}
          </div>
          <div>
            <strong>Tel:</strong> {orden.telefono || "N/A"}
          </div>
        </div>

        {/* Equipo */}
        <div
          style={{
            borderBottom: "1px dashed #000",
            paddingBottom: "8px",
            marginBottom: "8px",
          }}
        >
          <div>
            <strong>Equipo:</strong> {orden.marca_modelo}
          </div>
          {orden.imei_logico && (
            <div>
              <strong>IMEI:</strong> {orden.imei_logico}
            </div>
          )}
          <div>
            <strong>Falla:</strong> {orden.falla_reportada}
          </div>
          <div>
            <strong>Accesorios:</strong> {orden.accesorios || "Ninguno"}
          </div>
        </div>

        {/* Diagnóstico */}
        {orden.diagnostico_tecnico && (
          <div
            style={{
              borderBottom: "1px dashed #000",
              paddingBottom: "8px",
              marginBottom: "8px",
            }}
          >
            <div>
              <strong>Diagnóstico:</strong>
            </div>
            <div style={{ fontSize: "11px" }}>{orden.diagnostico_tecnico}</div>
          </div>
        )}

        {/* Financiero */}
        <div style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Total del servicio:</span>
            <span>${Number(orden.total).toFixed(2)}</span>
          </div>
          {totalPagado > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#22c55e",
              }}
            >
              <span>Pagos previos:</span>
              <span>-${totalPagado.toFixed(2)}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "16px",
              borderTop: "1px solid #000",
              marginTop: "4px",
              paddingTop: "4px",
            }}
          >
            <span>RESTA:</span>
            <span>${restante.toFixed(2)}</span>
          </div>
        </div>

        {/* Estado */}
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "13px",
            marginBottom: "8px",
            padding: "4px",
            border: "1px solid #000",
            borderRadius: "4px",
          }}
        >
          Estado: {etiquetaEstado(orden.estado)}
        </div>

        {/* ── PIE DEL TICKET — Avisos importantes ── */}
        <div
          style={{
            borderTop: "1px dashed #000",
            paddingTop: "8px",
            fontSize: "10px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: "6px",
            }}
          >
            ¡Gracias por su preferencia!
          </div>

          {/* Avisos */}
          <div
            style={{ fontSize: "9px", lineHeight: "1.4", marginBottom: "4px" }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
              ⚠️ AVISOS IMPORTANTES:
            </div>
            <div>
              • Equipos con daño por humedad o líquidos NO tienen garantía.
            </div>
            <div>
              • La garantía aplica únicamente sobre la reparación realizada.
            </div>
            <div>
              • Tiene <strong>30 días naturales</strong> para reclamar su equipo
              a partir de esta fecha.
            </div>
            <div>• Pasado ese plazo, el equipo se considerará abandonado.</div>
            <div>
              • En caso de extravío del ticket, acudir de inmediato a verificar
              su equipo.
            </div>
            <div>
              •{" "}
              <strong>
                El equipo se entrega únicamente al portador de este ticket.
              </strong>
            </div>
            <div>
              • No nos hacemos responsables por datos, fotos o información en el
              dispositivo.
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "6px",
              fontSize: "9px",
              color: "#666",
            }}
          >
            {new Date().toLocaleString("es-MX")}
          </div>
        </div>
      </div>
    );
  },
);

TicketImprimible.displayName = "TicketImprimible";
