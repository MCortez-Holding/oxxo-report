/** Sistemas disponibles en el selector del formulario de configuración */
export type SistemaType = 'mcortez' | 'telecom' | 'konectar' | 'comunica';

/** Configuración por sistema: API, credenciales y endpoint de data primaria */
export interface SistemaConfig {
  apiUrl: string;
  authUser: string;
  authPass: string;
  /** Ruta relativa al apiUrl, ej: reportGeneral.php?op=getByIdTvFilter */
  firstEndpointPath: string;
}

/** Data primaria devuelta por getByIdTvFilter: meta + ids de usuarios y salas */
export interface PrimaryData {
  meta?: number | string | null;
  usuarios: number[];
  salas: number[];
}

/** Payload del formulario de configuración inicial */
export interface ConfigFormPayload {
  sistema: SistemaType;
  identificador: number;
}
