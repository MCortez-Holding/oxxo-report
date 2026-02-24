import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import {
  PrimaryData,
  SistemaConfig,
  SistemaType,
  ConfigFormPayload
} from '../models/config.model';

const SISTEMAS: SistemaType[] = ['mcortez', 'telecom', 'konectar', 'comunica'];

/**
 * Configuración predefinida por sistema (URL API, credenciales, endpoint de data primaria).
 * Ajusta las URLs y credenciales según cada cliente.
 */
const SISTEMAS_CONFIG: Record<SistemaType, SistemaConfig> = {
  mcortez: {
    apiUrl: 'https://m-cortez.com/api',
    authUser: 'kevinrrdev',
    authPass: 'KD3z*1112099xD',
    firstEndpointPath: 'reportGeneral.php?op=getByIdTvFilter'
  },
  telecom: {
    apiUrl: 'https://romy.telecombpo.com/api',
    authUser: 'kevinrrdev',
    authPass: 'KD3z*1112099xD',
    firstEndpointPath: 'reportGeneral.php?op=getByIdTvFilter'
  },
  konectar: {
    apiUrl: 'https://ares.m-cortez.com/api',
    authUser: 'kevinrrdev',
    authPass: 'KD3z*1112099xD',
    firstEndpointPath: 'reportGeneral.php?op=getByIdTvFilter'
  },
  comunica: {
    apiUrl: 'https://zeus.m-cortez.com/api',
    authUser: 'kevinrrdev',
    authPass: 'KD3z*1112099xD',
    firstEndpointPath: 'reportGeneral.php?op=getByIdTvFilter'
  }
};

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly primaryData$ = new BehaviorSubject<PrimaryData | null>(null);
  private currentConfig: SistemaConfig | null = null;
  private currentPayload: ConfigFormPayload | null = null;

  readonly sistemas = SISTEMAS;

  constructor(private http: HttpClient) {}

  /** Configuración del sistema actual (tras enviar el formulario). */
  getCurrentConfig(): SistemaConfig | null {
    return this.currentConfig;
  }

  /** Payload del formulario (sistema + identificador) usado en la sesión actual. */
  getCurrentPayload(): ConfigFormPayload | null {
    return this.currentPayload;
  }

  /** Obtiene la configuración predefinida para un sistema. */
  getConfigForSystem(sistema: SistemaType): SistemaConfig {
    return SISTEMAS_CONFIG[sistema];
  }

  /** Observable de la data primaria (sede, meta, usuarios, salas). */
  getByIdTvFilter$(): Observable<PrimaryData | null> {
    return this.primaryData$.asObservable();
  }

  /** Valor actual de la data primaria. */
  getByIdTvFilter(): PrimaryData | null {
    return this.primaryData$.value;
  }

  /** IDs de usuarios para enviar al endpoint (id_usuarios). */
  getIdUsers(): string {
    const data = this.primaryData$.value;
    if (!data?.usuarios?.length) return '';
    return data.usuarios.map(u => String(u)).join(',');
  }

  /** IDs de salas para enviar al endpoint (id_salas). */
  getIdSalas(): string {
    const data = this.primaryData$.value;
    if (!data?.salas?.length) return '';
    return data.salas.map(s => String(s)).join(',');
  }

  /** Meta (ej. para ventas objetivo en reporte por asesor). */
  getMeta(): number {
    const data = this.primaryData$.value;
    const m = data?.meta;
    if (m == null || m === '') return 0;
    return typeof m === 'number' ? m : parseInt(String(m), 10) || 0;
  }

  /** Indica si ya hay data primaria cargada (sesión configurada). */
  hasPrimaryData(): boolean {
    return this.primaryData$.value !== null;
  }

  /**
   * Envía el formulario: aplica la config del sistema, llama al primer endpoint
   * con id_tv_report y guarda meta, usuarios y salas en el store.
   */
  submitConfig(payload: ConfigFormPayload): Observable<PrimaryData> {
    const config = this.getConfigForSystem(payload.sistema);
    this.currentConfig = config;
    this.currentPayload = payload;

    const url = `${config.apiUrl}/${config.firstEndpointPath.replace(/^\//, '')}`;
    const body = new URLSearchParams({
      id_tv_report: String(payload.identificador)
    }).toString();

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(`${config.authUser}:${config.authPass}`)
    });

    /** Respuesta: puede venir en { datos: { meta, usuarios, salas } } o en la raíz */
    interface GetTvReportResponse {
      status?: boolean;
      datos?: {
        meta?: number | string | null;
        usuarios?: number[] | null;
        salas?: number[] | null;
        usuarios_ids?: number[] | string | null;
        salas_ids?: number[] | string | null;
      };
      meta?: number | string | null;
      usuarios?: number[] | null;
      salas?: number[] | null;
      usuarios_ids?: number[] | string | null;
      salas_ids?: number[] | string | null;
    }

    /** Convierte valor de usuarios/salas a number[] (array, string "4,15" o null). */
    const toIdsArray = (val: number[] | string | null | undefined): number[] => {
      if (val == null) return [];
      if (Array.isArray(val)) return val.map(n => Number(n)).filter(n => !isNaN(n));
      const s = String(val).trim();
      if (!s) return [];
      return s.split(',').map(x => parseInt(x.trim(), 10)).filter(n => !isNaN(n));
    };

    return this.http.post<GetTvReportResponse | null>(url, body, { headers }).pipe(
      map((data: GetTvReportResponse | null): PrimaryData => {
        if (data == null) {
          const fallback: PrimaryData = { meta: null, usuarios: [], salas: [] };
          this.primaryData$.next(fallback);
          return fallback;
        }
        const raw = data.datos ?? data;
        const usuarios = toIdsArray(raw.usuarios ?? (raw as any).usuarios_ids);
        const salas = toIdsArray(raw.salas ?? (raw as any).salas_ids);
        const normalized: PrimaryData = {
          meta: raw.meta ?? null,
          usuarios,
          salas
        };
        this.primaryData$.next(normalized);
        return normalized;
      })
    );
  }

  /** Limpia la configuración y la data primaria (útil para “cerrar sesión” o cambiar sistema). */
  clearConfig(): void {
    this.currentConfig = null;
    this.currentPayload = null;
    this.primaryData$.next(null);
  }
}
