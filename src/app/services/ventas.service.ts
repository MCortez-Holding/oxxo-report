import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../const/API';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VentasService {

  private readonly AUTH_USER = 'kevinrrdev';
  private readonly AUTH_PASS = 'KD3z*1112099xD';
  constructor(private http: HttpClient) { }

  getFechaHoyFormateada(): string {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // Los meses van de 0-11
    const año = hoy.getFullYear();
    return `${año}-${mes}-${dia}`;
  }

getVentas(fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const body = new HttpParams()
      .set('fechaIni', formatDate(fechaInicio))
      .set('fechaFin', formatDate(fechaFin));

    const headers = new HttpHeaders({
  'Content-Type': 'application/x-www-form-urlencoded',
  'Authorization': 'Basic ' + btoa(`${this.AUTH_USER}:${this.AUTH_PASS}`)
});


    const url = `${API.url}/reportGeneral.php?op=tableReportDay`;

    return this.http.post<any[]>(url, body.toString(), { headers });
  }
}
