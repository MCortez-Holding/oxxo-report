import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsesorColumnasService {
  private readonly storageFilasKey = 'asesor_filas_primera_tabla';

  // Por defecto SIEMPRE en 1 sola columna (false). Solo se divide en 2 al hacer clic en "Columnas"
  private readonly modoDosColumnas$ = new BehaviorSubject<boolean>(false);
  // Número de filas configuradas para la primera tabla (por defecto 10)
  private readonly filasPrimeraTabla$ = new BehaviorSubject<number>(this.leerStorageFilas());
  // Total de filas/ventas registradas actualmente
  readonly totalVentas$ = new BehaviorSubject<number>(0);

  get modoDosColumnas(): boolean {
    return this.modoDosColumnas$.value;
  }

  get modoDosColumnasObservable(): Observable<boolean> {
    return this.modoDosColumnas$.asObservable();
  }

  get filasPrimeraTabla(): number {
    return this.filasPrimeraTabla$.value;
  }

  get filasPrimeraTablaObservable(): Observable<number> {
    return this.filasPrimeraTabla$.asObservable();
  }

  get puedeQuitarFila(): boolean {
    return this.filasPrimeraTabla > 1;
  }

  get puedeAgregarFila(): boolean {
    const total = this.totalVentas$.value;
    return total === 0 || this.filasPrimeraTabla < total;
  }

  setTotalVentas(total: number): void {
    this.totalVentas$.next(total);
  }

  toggleColumnas(): void {
    this.modoDosColumnas$.next(!this.modoDosColumnas);
  }

  setModoDosColumnas(activo: boolean): void {
    this.modoDosColumnas$.next(activo);
  }

  ajustarFilas(delta: number): void {
    const siguiente = this.filasPrimeraTabla + delta;
    if (siguiente < 1) return;
    const total = this.totalVentas$.value;
    if (total > 0 && siguiente > total) return;
    this.filasPrimeraTabla$.next(siguiente);
    try {
      localStorage.setItem(this.storageFilasKey, String(siguiente));
    } catch (e) {
      console.warn('Error guardando en localStorage', e);
    }
  }

  setFilasPrimeraTabla(filas: number): void {
    if (filas < 1) return;
    this.filasPrimeraTabla$.next(filas);
    try {
      localStorage.setItem(this.storageFilasKey, String(filas));
    } catch (e) {
      console.warn('Error guardando en localStorage', e);
    }
  }

  private leerStorageFilas(): number {
    try {
      const valor = localStorage.getItem(this.storageFilasKey);
      const parsed = parseInt(valor || '', 10);
      return !isNaN(parsed) && parsed >= 1 ? parsed : 10;
    } catch {
      return 10;
    }
  }
}
