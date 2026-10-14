import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { ComparacionService } from '../services/comparacion.service';

@Component({
  selector: 'app-nav-bar',
  standalone: false,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent implements OnInit, OnDestroy {
  currentTime: Date = new Date();
  isComparando = false;
  private comparacionSub?: Subscription;

  constructor(
    private configService: ConfigService,
    private comparacionService: ComparacionService,
    private router: Router
  ) {}

  get isConfigPage(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/' || url === '';
  }

  get esReporteAsesor(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/reporte-asesor';
  }

  private timerId: any;

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    this.comparacionSub = this.comparacionService.estado$.subscribe(state => {
      this.isComparando = state.activo;
    });
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.comparacionSub?.unsubscribe();
  }

  onCompararCrmClick(): void {
    if (this.isComparando) {
      this.comparacionService.quitarComparacion();
    } else {
      this.comparacionService.solicitarAbrirModal();
    }
  }

  entrarModoTV(): void {
    this.router.navigate([], {
      queryParams: { view: 'tv' },
      queryParamsHandling: 'merge'
    });
  }

  salir(): void {
    this.comparacionService.quitarComparacion();
    this.configService.clearConfig();
    this.router.navigate(['/']);
  }
}

