import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SistemaType } from './models/config.model';
import { ConfigService } from './services/config.service';
import { EfectividadUiService } from './services/efectividad-ui.service';
import { AsesorColumnasService } from './services/asesor-columnas.service';

/** Anuncios por sistema/empresa. Añade más rutas a cada array según necesites. */
const ADS_BY_SYSTEM: Record<SistemaType, string[]> = {
  mcortez: [
    // Añade aquí las imágenes de Mcortez
  ],
  telecom: [
    // Añade aquí las imágenes de Telecom, ej: 'assets/telecom/1.jpeg',
  ],
  konectar: [
    // Añade aquí las imágenes de Konectar
  ],
  comunica: [
    'assets/61.jpeg', 'assets/62.jpeg', 'assets/63.jpeg', 'assets/64.jpeg', 'assets/65.jpeg', 'assets/66.jpeg'
  ],
  optimus: [
    // De momento no tendrá imagen
  ],
  eros: [
    // De momento no tendrá imagen
  ]
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  title = 'telco-report.UI';
  @ViewChild('adVideo') adVideoRef!: ElementRef<HTMLVideoElement>;

  showAd = false;
  currentAd = '';
  private adIndex = 0;
  private adInterval: any;

  isTvMode = false;
  currentPath = '';
  currentScale = 1.4;

  constructor(
    private configService: ConfigService,
    private router: Router,
    public efectividadUi: EfectividadUiService,
    public asesorColumnas: AsesorColumnasService
  ) {}

  /** Array de anuncios del sistema actual (según configuración). */
  get currentAds(): string[] {
    const sistema = this.configService.getCurrentPayload()?.sistema;
    if (!sistema) return [];
    return ADS_BY_SYSTEM[sistema] ?? [];
  }

  ngOnInit(): void {
    this.detectTvMode();
    this.currentPath = this.router.url.split('?')[0];

    // Detectar cambios de ruta y actualizar el path activo y modo TV
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.currentPath = this.router.url.split('?')[0];
      this.detectTvMode();
    });

    this.configService.getByIdTvFilter$().subscribe(() => {
      this.adIndex = 0;
      this.startAdLoop();
    });
  }

  get esEfectividad(): boolean {
    return this.currentPath === '/tabla-efectividad';
  }

  get esReporteAsesor(): boolean {
    return this.currentPath === '/reporte-asesor';
  }

  detectTvMode(): void {
    const urlParams = new URLSearchParams(window.location.search);
    this.isTvMode = urlParams.get('view') === 'tv';
    if (this.isTvMode) {
      document.body.classList.add('modo-tv');

      // Cargar el nivel de zoom desde la URL o localStorage
      const zoomParam = urlParams.get('zoom');
      if (zoomParam) {
        const parsed = parseFloat(zoomParam);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 3.0) {
          this.currentScale = parsed;
          localStorage.setItem('tv_zoom', String(parsed));
        }
      } else {
        const savedZoom = localStorage.getItem('tv_zoom');
        if (savedZoom) {
          this.currentScale = parseFloat(savedZoom) || 1.4;
        } else {
          this.currentScale = 1.4;
        }
      }
    } else {
      document.body.classList.remove('modo-tv');
    }
  }

  adjustZoom(delta: number): void {
    let newScale = parseFloat((this.currentScale + delta).toFixed(2));
    // Limitar el zoom entre 0.5 (50%) y 3.0 (300%)
    if (newScale < 0.5) newScale = 0.5;
    if (newScale > 3.0) newScale = 3.0;

    this.currentScale = newScale;
    localStorage.setItem('tv_zoom', String(newScale));

    // Reflejar en la URL de forma suave
    this.router.navigate([], {
      queryParams: { zoom: newScale },
      queryParamsHandling: 'merge'
    });
  }

  toggleView(view: 'general' | 'asesor' | 'efectividad'): void {
    const paths = {
      general: '/reporte-general',
      asesor: '/reporte-asesor',
      efectividad: '/tabla-efectividad'
    };
    this.router.navigate([paths[view]], { queryParams: { view: 'tv' }, queryParamsHandling: 'merge' });
  }

  exitTvMode(): void {
    this.isTvMode = false;
    document.body.classList.remove('modo-tv');
    this.router.navigate([this.currentPath], { queryParams: { view: null }, queryParamsHandling: 'merge' });
  }


ngAfterViewInit(): void {
  // Espera a que el usuario haga click para poder reproducir
  const onUserInteraction = () => {
    this.playVideoIfNeeded();
    window.removeEventListener('click', onUserInteraction);
    window.removeEventListener('touchstart', onUserInteraction);
  };

  window.addEventListener('click', onUserInteraction);
  window.addEventListener('touchstart', onUserInteraction);
}


  ngOnDestroy(): void {
    if (this.adInterval) {
      clearTimeout(this.adInterval);
    }
  }

  private startAdLoop(): void {
    const ads = this.currentAds;
    if (ads.length === 0) return;

    this.adInterval = setInterval(() => {
      this.currentAd = ads[this.adIndex];
      this.showAd = true;

      setTimeout(() => {
        this.showAd = false;
        this.adIndex = (this.adIndex + 1) % ads.length;
      }, 30000); // 30 segundos visible
    }, 600000); // Cada 10 minutos
  }

  isVideo(src: string): boolean {
    return src.endsWith('.mp4');
  }

  private playVideoIfNeeded(): void {
    if (this.adVideoRef && this.adVideoRef.nativeElement) {
      this.adVideoRef.nativeElement.play().catch(error => {
        console.warn('Auto-play blocked even after click:', error);
      });
    }
  }
}
