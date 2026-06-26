// src/Permisos.ts
// ─────────────────────────────────────────────
// ARCHIVO CENTRAL DE PERMISOS
// ─────────────────────────────────────────────

export type Rol = "gerente" | "tecnico" | "mostrador";

export type Permiso =
  | "crear_ordenes"
  | "cambiar_estados"
  | "guardar_diagnostico"
  | "cobrar_entregar"
  | "cancelar_ordenes"
  | "editar_precio"
  | "ver_reportes"
  | "registrar_egresos" // ← NUEVO
  | "eliminar_egresos" // ← NUEVO (solo gerente)
  | "administrar_catalogos";

const PERMISOS: Record<Rol, Permiso[]> = {
  gerente: [
    "crear_ordenes",
    "cambiar_estados",
    "guardar_diagnostico",
    "cobrar_entregar",
    "cancelar_ordenes",
    "editar_precio",
    "ver_reportes",
    "registrar_egresos", // ← gerente sí
    "eliminar_egresos", // ← solo gerente
    "administrar_catalogos",
  ],
  tecnico: [
    "crear_ordenes",
    "cambiar_estados",
    "guardar_diagnostico",
    "cobrar_entregar",
    "cancelar_ordenes",
    "registrar_egresos", // ← técnico también puede registrar
    // NO puede eliminar egresos
  ],
  mostrador: [
    "crear_ordenes",
    "cobrar_entregar",
    // NO puede registrar ni eliminar egresos
  ],
};

export function puede(rol: string | undefined, permiso: Permiso): boolean {
  if (!rol) return false;
  const permisosDel = PERMISOS[rol as Rol];
  if (!permisosDel) return false;
  return permisosDel.includes(permiso);
}
