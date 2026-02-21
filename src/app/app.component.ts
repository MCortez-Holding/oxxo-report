import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SistemaType } from './models/config.model';
import { ConfigService } from './services/config.service';

/** Anuncios por sistema/empresa. Añade más rutas a cada array según necesites. */
const ADS_BY_SYSTEM: Record<SistemaType, string[]> = {
  mcortez: [
    'assets/17.jpeg', 'assets/18.jpeg', 'assets/19.jpeg',
    'assets/20.jpeg', 'assets/21.jpeg', 'assets/22.jpeg'
  ],
  telecom: [
    // Añade aquí las imágenes de Telecom, ej: 'assets/telecom/1.jpeg',
  ],
  konectar: [
    // Añade aquí las imágenes de Konectar
  ],
  comunica: [
    // Añade aquí las imágenes de Comunica
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

  constructor(private configService: ConfigService) {}

  /** Array de anuncios del sistema actual (según configuración). */
  get currentAds(): string[] {
    const sistema = this.configService.getCurrentPayload()?.sistema;
    if (!sistema) return [];
    return ADS_BY_SYSTEM[sistema] ?? [];
  }

  ngOnInit(): void {
    this.configService.getTvReportById$().subscribe(() => {
      this.adIndex = 0;
      this.startAdLoop();
    });
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

  startAdLoop(): void {
    if (this.adInterval) {
      clearTimeout(this.adInterval);
      this.adInterval = null;
    }
    this.showAd = false;
    this.showRandomAd();
  }

  private showRandomAd(): void {
  const ads = this.currentAds;
  if (ads.length === 0) {
    this.showAd = false;
    this.currentAd = '';
    // No programar más intentos: sin imágenes no se muestra nada hasta que cambie el sistema/config
    return;
  }

  this.showAd = true;
  this.currentAd = ads[this.adIndex];
  this.adIndex = (this.adIndex + 1) % ads.length;

  const duration = this.isVideo(this.currentAd) ? 20000 : 20000; // duración anuncio

  if (this.isVideo(this.currentAd)) {
    setTimeout(() => this.playVideoIfNeeded(), 100);
  }

  // Ocultar anuncio después de la duración definida
  setTimeout(() => {
    this.showAd = false;

    // Después de ocultar anuncio esperar tiempo aleatorio para mostrar el siguiente
    const randomTime = Math.floor(Math.random() * (100000 - 10000 + 1)) + 10000;
    this.adInterval = setTimeout(() => {
      this.showRandomAd();
    }, randomTime);
  }, duration);
}


  isVideo(file: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.gif'];
    return videoExtensions.some(ext => file.toLowerCase().endsWith(ext));
  }

  playVideoIfNeeded() {
    if (this.adVideoRef && this.adVideoRef.nativeElement) {
      const video = this.adVideoRef.nativeElement;
      video.play().catch(err => console.warn('Autoplay error:', err));
    }
  }
}
