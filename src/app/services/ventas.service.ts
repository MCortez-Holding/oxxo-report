import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../const/API';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VentasService {

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
  const timestamp = new Date().getTime();  

    const headers = new HttpHeaders()
    .set('Cache-Control', 'no-cache, no-store, must-revalidate')
    .set('Pragma', 'no-cache')
    .set('Expires', '0');
  const url = `${API.url}/ventas?start=${formatDate(fechaInicio)}&end=${formatDate(fechaFin)}&_=${timestamp}`;
  return this.http.get<any[]>(url);
}
}
