import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ConfigService } from '../services/config.service';
import { VentasService } from '../services/ventas.service';

@Component({
  selector: 'app-asesor',
  templateUrl: './asesor.component.html',
  standalone: false,
  styleUrls: ['./asesor.component.css']
})
export class AsesorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('particlesCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  ventas: any[] = [];
  instaladas: any[] = [];
  private updateInterval: any;
  private countdownInterval: any;
  private previousVentas: any[] = [];
  countdown: string = '02:00'; // Formato MM:SS
  updateFrequency: number = 120; // Tiempo en segundos (2 minutos)
  constructor(
    private ventasService: VentasService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.obtenerVentas();
    this.startCountdown();
    this.obtenerVentasIntaladas();
    // Configurar intervalo para actualizar cada 2 minutos (120000 ms)
    this.updateInterval = setInterval(() => {
      this.obtenerVentas();
      this.resetCountdown();
      this.obtenerVentasIntaladas();
    }, this.updateFrequency * 1000);
  }

   ngOnDestroy() {
    // Limpiar los intervalos cuando el componente se destruya
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

   private startCountdown() {
    let secondsLeft = this.updateFrequency;

    this.countdownInterval = setInterval(() => {
      secondsLeft--;

      if (secondsLeft < 0) {
        secondsLeft = this.updateFrequency;
      }

      const minutes = Math.floor(secondsLeft / 60);
      const seconds = secondsLeft % 60;

      this.countdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  private resetCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.startCountdown();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initParticleCanvas();
    });
  }

  private initParticleCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!canvas || !ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 1.5 + 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x <= 0 || this.x >= canvas.width) this.vx *= -1;
        if (this.y <= 0 || this.y >= canvas.height) this.vy *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
ctx.fillStyle = '#FF0000';
        ctx.fill();
      }
    }

    const maxParticles = 300;
    const particleDensity = Math.floor((canvas.width * canvas.height) / 15000);
    const particleCount = Math.min(particleDensity, maxParticles);
    const particles = Array.from({ length: particleCount }, () => new Particle());

    let lastFrame = 0;

    const animate = (time: number) => {
      if (time - lastFrame < 33) {
        requestAnimationFrame(animate);
        return;
      }
      lastFrame = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Conexiones
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = dx * dx + dy * dy;
          if (distance < 10000) {
            ctx.beginPath();
ctx.strokeStyle = `rgba(255, 0, 0, ${1 - distance / 10000})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    window.addEventListener('resize', resizeCanvas);
  }

obtenerVentas() {
  const hoy = new Date();

  this.ventasService.getVentas(hoy, hoy).subscribe({
    next: (data: { datos?: any[] }) => {
      const ventas = (data.datos ?? []).slice();
      ventas.sort((a: any, b: any) => Number(b.total) - Number(a.total));
      if (JSON.stringify(this.ventas) !== JSON.stringify(ventas)) {
        this.previousVentas = [...this.ventas];
        this.ventas = ventas;
      }
    },
    error: (err) => {
      console.error('Error al obtener ventas:', err);
    }
  });
}
obtenerVentasIntaladas() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();
    const fechaIni = new Date(año, mes, 1);
    const fechaFin = new Date(año, mes + 1, 0);

    this.ventasService.getVentasInstaladas(fechaIni, fechaFin).subscribe({
      next: (data: { datos?: any[] }) => {
        const raw = data.datos ?? [];
        const ventasMapeadas = raw.map((item: any) => ({
          vintaladas: parseInt(item.instaladas ?? item.vintaladas ?? 0, 10)
        }));
        ventasMapeadas.sort((a: any, b: any) => {
          return b.vintaladas - a.vintaladas;
        });
        if (JSON.stringify(this.instaladas) !== JSON.stringify(ventasMapeadas)) {
          this.instaladas = ventasMapeadas;
        }
      },
      error: (err) => {
        console.error('Error al obtener ventas:', err);
      }
    });
  }

get meta(): number {
  return this.configService.getMeta();
}
get ventasInstaladas(): number {
  return this.instaladas.reduce((sum, v) => sum + v.vintaladas, 0);
}
get ventasFaltantes(): number {
  return Math.max(0, this.meta - this.ventasInstaladas);
}

  // Método para verificar si una fila es nueva
  isNewRow(index: number): boolean {
    // Si no tenemos datos anteriores, no es nueva
    if (!this.previousVentas || this.previousVentas.length === 0) return false;

    // Si el índice es mayor que los datos anteriores, es nueva
    if (index >= this.previousVentas.length) return true;

    // Comparar los datos para ver si ha cambiado
    const currentVenta = this.ventas[index];
    const previousVenta = this.previousVentas[index];

    return JSON.stringify(currentVenta) !== JSON.stringify(previousVenta);
  }
}
