import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit {
    title = 'telco-report.UI';
  @ViewChild('adVideo') adVideoRef!: ElementRef<HTMLVideoElement>;

  showAd = false;
  currentAd = '';
  //private ads = ['assets/1.jpeg', 'assets/2.jpeg', 'assets/3.jpeg', 'assets/4.jpeg', 'assets/5.jpeg', 'assets/6.jpeg', 'assets/7.jpeg', 'assets/8.jpeg']; //AGREGAR IMAGENES
  // private ads = ['assets/9.jpeg','assets/10.jpeg','assets/11.jpeg','assets/12.jpeg','assets/13.jpeg','assets/14.jpeg','assets/15.jpeg','assets/16.jpeg'];
  private ads = ['assets/17.jpeg','assets/18.jpeg','assets/19.jpeg','assets/20.jpeg','assets/21.jpeg','assets/22.jpeg'];
  private adIndex = 0;
  private adInterval: any;


ngOnInit(): void {
    this.startAdLoop();
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
    this.showRandomAd();
  }

  private showRandomAd(): void {
  this.showAd = true;
  this.currentAd = this.ads[this.adIndex];
  this.adIndex = (this.adIndex + 1) % this.ads.length;

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
