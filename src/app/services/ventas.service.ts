import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  getFechaHoyFormateada(): string {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const año = hoy.getFullYear();
    return `${año}-${mes}-${dia}`;
  }

  /** Formato YYYY-MM-DD en hora local (evita que toISOString cambie el día por UTC). */
  private formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getAuthHeaders(): HttpHeaders {
    const config = this.configService.getCurrentConfig();
    if (!config) {
      return new HttpHeaders();
    }
    const credentials = btoa(`${config.authUser}:${config.authPass}`);
    return new HttpHeaders({
      Authorization: `Basic ${credentials}`
    });
  }

  private getBaseUrl(): string {
    const config = this.configService.getCurrentConfig();
    return config?.apiUrl ?? '';
  }

  /**
   * Reporte: tableReportDayTvFilter con fechaIni, fechaFin, id_usuarios e id_salas.
   * Respuesta: { datos: [...] } con sala, asesor, total, atendida, vprogramadas, etc.
   */
  getVentas(fechaInicio: Date, fechaFin: Date): Observable<{ datos: any[] }> {
    const config = this.configService.getCurrentConfig();
    if (!config) {
      throw new Error('No hay configuración de sistema. Debes completar el formulario de configuración.');
    }

    const idUsers = this.configService.getIdUsers();
    const idSalas = this.configService.getIdSalas();

    const body = new HttpParams()
      .set('fechaIni', this.formatDateLocal(fechaInicio))
      .set('fechaFin', this.formatDateLocal(fechaFin))
      .set('id_usuarios', idUsers)
      .set('id_salas', idSalas);

    let headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const auth = this.getAuthHeaders();
    if (auth.has('Authorization')) {
      headers = headers.set('Authorization', auth.get('Authorization')!);
    }

    const url = `${this.getBaseUrl()}/reportGeneral.php?op=tableReportDayTvFilter`;
    return this.http.post<{ datos: any[] }>(url, body.toString(), { headers });
  }

  /**
   * Ventas instaladas: tableReportInstaladasTvFilter con fechaIni, fechaFin, id_usuarios e id_salas.
   * Respuesta: { datos: [{ sala, asesor, instaladas, programadas, total, efectividad, totalugis }] }
   */
  getVentasInstaladas(fechaInicio: Date, fechaFin: Date): Observable<{ datos: any[] }> {
    const idUsers = this.configService.getIdUsers();
    const idSalas = this.configService.getIdSalas();

    const formData = new FormData();
    formData.append('fechaIni', this.formatDateLocal(fechaInicio));
    formData.append('fechaFin', this.formatDateLocal(fechaFin));
    formData.append('id_usuarios', idUsers);
    formData.append('id_salas', idSalas);

    const url = `${this.getBaseUrl()}/reportGeneral.php?op=tableReportInstaladasTvFilter`;

    return this.http.post<{ datos: any[] }>(url, formData, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Número total de instaladas: getNumberInstaladasTvFilter.
   * Mismos parámetros que tableReportInstaladasTvFilter: fechaIni, fechaFin, id_usuarios, id_salas.
   * Solo se debe llamar cuando se está en REPORTE POR ASESOR.
   * Respuesta: { instaladas_totales: number } (o objeto que contenga instaladas_totales).
   */
  getNumberInstaladasTvFilter(fechaInicio: Date, fechaFin: Date): Observable<{ instaladas_totales: number }> {
    const idUsers = this.configService.getIdUsers();
    const idSalas = this.configService.getIdSalas();

    const formData = new FormData();
    formData.append('fechaIni', this.formatDateLocal(fechaInicio));
    formData.append('fechaFin', this.formatDateLocal(fechaFin));
    formData.append('id_usuarios', idUsers);
    formData.append('id_salas', idSalas);

    const url = `${this.getBaseUrl()}/reportGeneral.php?op=getNumberInstaladasTvFilter`;

    return this.http.post<{ instaladas_totales: number }>(url, formData, {
      headers: this.getAuthHeaders()
    });
  }
}
