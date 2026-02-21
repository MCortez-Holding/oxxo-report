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
   * Reporte general: usa el endpoint tableReportDayReportTv con fechaIni, fechaFin, idUsers e idSalas
   * (estos últimos obtenidos de la data primaria del ConfigService).
   */
  getVentas(fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    const config = this.configService.getCurrentConfig();
    if (!config) {
      throw new Error('No hay configuración de sistema. Debes completar el formulario de configuración.');
    }

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const idUsers = this.configService.getIdUsers();
    const idSalas = this.configService.getIdSalas();

    const body = new HttpParams()
      .set('fechaIni', formatDate(fechaInicio))
      .set('fechaFin', formatDate(fechaFin))
      .set('idUsers', idUsers)
      .set('idSalas', idSalas);

    let headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const auth = this.getAuthHeaders();
    if (auth.has('Authorization')) {
      headers = headers.set('Authorization', auth.get('Authorization')!);
    }

    const url = `${this.getBaseUrl()}/reportGeneral.php?op=tableReportDayReportTv`;
    return this.http.post<any[]>(url, body.toString(), { headers });
  }

  getVentasInstaladas(fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const formData = new FormData();
    formData.append('fechaIni', formatDate(fechaInicio));
    formData.append('fechaFin', formatDate(fechaFin));

    const url = `${this.getBaseUrl()}/reportGeneral.php?op=tableReportInstaladas`;

    return this.http.post<any[]>(url, formData, {
      headers: this.getAuthHeaders()
    });
  }
}
