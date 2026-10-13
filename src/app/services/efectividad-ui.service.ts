import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EfectividadUiService {
  readonly fuentePaso = 10;
  private readonly filasKey = 'efectividad_filas_columna';
  private readonly fuenteKey = 'efectividad_tamano_fuente';
  private readonly fuenteMin = 20;
  private readonly fuenteMax = 200;

  readonly filasPorColumna$ = new BehaviorSubject<number>(this.leerFilas());
  readonly tamanoFuente$ = new BehaviorSubject<number>(this.leerFuente());
  readonly totalFilas$ = new BehaviorSubject<number>(0);

  get filasPorColumna(): number {
    return this.filasPorColumna$.value;
  }

  get tamanoFuente(): number {
    return this.tamanoFuente$.value;
  }

  get puedeQuitarFila(): boolean {
    return this.filasPorColumna > 1;
  }

  get puedeAgregarFila(): boolean {
    const total = this.totalFilas$.value;
    return total === 0 || this.filasPorColumna < total;
  }

  get puedeReducirFuente(): boolean {
    return this.tamanoFuente > this.fuenteMin;
  }

  get puedeAumentarFuente(): boolean {
    return this.tamanoFuente < this.fuenteMax;
  }

  setTotalFilas(total: number): void {
    this.totalFilas$.next(total);
  }

  ajustarFilas(delta: number): void {
    const siguiente = this.filasPorColumna + delta;
    if (siguiente < 1) return;
    const total = this.totalFilas$.value;
    if (total > 0 && siguiente > total) return;
    this.filasPorColumna$.next(siguiente);
    localStorage.setItem(this.filasKey, String(siguiente));
  }

  ajustarFuente(delta: number): void {
    const siguiente = this.tamanoFuente + delta;
    if (siguiente < this.fuenteMin || siguiente > this.fuenteMax) return;
    this.tamanoFuente$.next(siguiente);
    localStorage.setItem(this.fuenteKey, String(siguiente));
  }

  private leerFilas(): number {
    const n = parseInt(localStorage.getItem(this.filasKey) || '', 10);
    return !isNaN(n) && n >= 1 ? n : 8;
  }

  private leerFuente(): number {
    const n = parseInt(localStorage.getItem(this.fuenteKey) || '', 10);
    return !isNaN(n) && n >= this.fuenteMin && n <= this.fuenteMax ? n : 100;
  }
}
