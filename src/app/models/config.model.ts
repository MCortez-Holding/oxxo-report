/** Sistemas disponibles en el selector del formulario de configuración */
export type SistemaType = 'mcortez' | 'telecom' | 'konectar' | 'comunica';

/** Configuración por sistema: API, credenciales y endpoint de data primaria */
export interface SistemaConfig {
  apiUrl: string;
  authUser: string;
  authPass: string;
  /** Ruta relativa al apiUrl, ej: reportGeneral.php?op=getPrimaryData */
  firstEndpointPath: string;
}

/** Data primaria devuelta por el primer endpoint (sede, meta, usuarios, salas) */
export interface PrimaryData {
  sede?: any;
  meta?: any;
  usuarios: Array<{ id: number | string; [key: string]: any }>;
  salas: Array<{ id: number | string; [key: string]: any }>;
}

/** Payload del formulario de configuración inicial */
export interface ConfigFormPayload {
  sistema: SistemaType;
  identificador: number;
}
