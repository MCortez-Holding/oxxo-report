import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SistemaType } from '../models/config.model';

export interface ComparacionCrmData {
  activo: boolean;
  sistema: SistemaType | null;
  identificador: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ComparacionService {
  private readonly comparacionState$ = new BehaviorSubject<ComparacionCrmData>({
    activo: false,
    sistema: null,
    identificador: null
  });

  private readonly abrirModalRequest$ = new BehaviorSubject<boolean>(false);

  get estado$(): Observable<ComparacionCrmData> {
    return this.comparacionState$.asObservable();
  }

  get estadoActual(): ComparacionCrmData {
    return this.comparacionState$.value;
  }

  get abrirModal$(): Observable<boolean> {
    return this.abrirModalRequest$.asObservable();
  }

  solicitarAbrirModal(): void {
    this.abrirModalRequest$.next(true);
  }

  activarComparacion(sistema: SistemaType, identificador: number): void {
    this.comparacionState$.next({
      activo: true,
      sistema,
      identificador
    });
  }

  quitarComparacion(): void {
    this.comparacionState$.next({
      activo: false,
      sistema: null,
      identificador: null
    });
  }
}
