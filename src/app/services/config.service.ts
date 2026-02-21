import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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
    apiUrl: 'https://zeus.m-cortez.com/api',
    authUser: 'kevinrrdev',
    authPass: 'KD3z*1112099xD',
    firstEndpointPath: 'reportGeneral.php?op=getPrimaryData'
  },
  telecom: {
    apiUrl: 'https://zeus.m-cortez.com/api',
    authUser: 'kevinrrdev',
    authPass: 'KD3z*1112099xD',
    firstEndpointPath: 'reportGeneral.php?op=getPrimaryData'
  },
  konectar: {
    apiUrl: 'https://zeus.m-cortez.com/api',
    authUser: 'kevinrrdev',
    authPass: 'KD3z*1112099xD',
    firstEndpointPath: 'reportGeneral.php?op=getPrimaryData'
  },
  comunica: {
    apiUrl: 'https://zeus.m-cortez.com/api',
    authUser: 'kevinrrdev',
    authPass: 'KD3z*1112099xD',
    firstEndpointPath: 'reportGeneral.php?op=getPrimaryData'
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
  getPrimaryData$(): Observable<PrimaryData | null> {
    return this.primaryData$.asObservable();
  }

  /** Valor actual de la data primaria. */
  getPrimaryData(): PrimaryData | null {
    return this.primaryData$.value;
  }

  /** IDs de usuarios para enviar al endpoint de reportes (ej. tableReportDayReportTv). */
  getIdUsers(): string {
    const data = this.primaryData$.value;
    if (!data?.usuarios?.length) return '';
    return data.usuarios.map(u => String(u.id)).join(',');
  }

  /** IDs de salas para enviar al endpoint de reportes. */
  getIdSalas(): string {
    const data = this.primaryData$.value;
    if (!data?.salas?.length) return '';
    return data.salas.map(s => String(s.id)).join(',');
  }

  /** Indica si ya hay data primaria cargada (sesión configurada). */
  hasPrimaryData(): boolean {
    return this.primaryData$.value !== null;
  }

  /**
   * Envía el formulario: aplica la config del sistema, llama al primer endpoint
   * y guarda la data primaria en el store.
   */
  submitConfig(payload: ConfigFormPayload): Observable<PrimaryData> {
    const config = this.getConfigForSystem(payload.sistema);
    this.currentConfig = config;
    this.currentPayload = payload;

    const url = `${config.apiUrl}/${config.firstEndpointPath.replace(/^\//, '')}`;
    const body = new URLSearchParams({
      sistema: payload.sistema,
      identificador: String(payload.identificador)
    }).toString();

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(`${config.authUser}:${config.authPass}`)
    });

    return this.http.post<PrimaryData>(url, body, { headers }).pipe(
      tap(data => {
        const normalized: PrimaryData = {
          sede: data.sede,
          meta: data.meta,
          usuarios: Array.isArray(data.usuarios) ? data.usuarios : [],
          salas: Array.isArray(data.salas) ? data.salas : []
        };
        this.primaryData$.next(normalized);
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
