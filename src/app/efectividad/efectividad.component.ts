import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { VentasService } from '../services/ventas.service';
import { EfectividadUiService } from '../services/efectividad-ui.service';

@Component({
  selector: 'app-efectividad',
  templateUrl: './efectividad.component.html',
  standalone: false,
  styleUrls: ['./efectividad.component.css']
})
export class EfectividadComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('particlesCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  filas: any[] = [];
  columnas: { fila: any; index: number }[][] = [];
  efectividadTotal = 0;
  totalProgramadas = 0;
  totalInstaladas = 0;
  mesActualLabel = '';
  private uiSub?: Subscription;

  private updateInterval: any;
  private countdownInterval: any;
  private previousFilas: any[] = [];
  countdown: string = '02:00';
  updateFrequency: number = 120;
  private destroyed = false;
  private resizeListener!: () => void;

  constructor(
    private ventasService: VentasService,
    private efectividadUi: EfectividadUiService
  ) {}

  get filasPorColumna(): number {
    return this.efectividadUi.filasPorColumna;
  }

  get tamanoFuente(): number {
    return this.efectividadUi.tamanoFuente;
  }

  ngOnInit(): void {
    this.mesActualLabel = this.obtenerNombreMesActual();
    this.uiSub = this.efectividadUi.filasPorColumna$.subscribe(() => this.actualizarColumnas());
    this.obtenerEfectividad();
    this.startCountdown();
    this.updateInterval = setInterval(() => {
      this.obtenerEfectividad();
      this.resetCountdown();
    }, this.updateFrequency * 1000);
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.uiSub?.unsubscribe();
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initParticleCanvas();
    });
  }

  private obtenerNombreMesActual(): string {
    const hoy = new Date();
    const mes = hoy.toLocaleDateString('es-MX', { month: 'long' });
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
    return `${mesCapitalizado} ${hoy.getFullYear()}`;
  }

  obtenerEfectividad(): void {
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    this.ventasService.getTablaEfectividad(fechaInicio, fechaFin).subscribe({
      next: (data: any) => {
        const raw = this.extraerLista(data);

        const mapped = raw.map((item: any) => this.mapFila(item));
        const sorted = mapped.sort((a: any, b: any) => {
          if (b.efectividad !== a.efectividad) return b.efectividad - a.efectividad;
          return b.instaladas - a.instaladas;
        });

        this.totalProgramadas = mapped.reduce((s: number, i: any) => s + i.programadas, 0);
        this.totalInstaladas = mapped.reduce((s: number, i: any) => s + i.instaladas, 0);

        const rawTotal = data?.efectividad_total ?? data?.total_efectividad ?? data?.datos?.efectividad_total;
        const totalApi = rawTotal != null && rawTotal !== '' ? Number(rawTotal) : NaN;

        if (!Number.isNaN(totalApi)) {
          this.efectividadTotal = totalApi;
        } else if (this.totalProgramadas > 0) {
          this.efectividadTotal = (this.totalInstaladas / this.totalProgramadas) * 100;
        } else if (mapped.length > 0) {
          this.efectividadTotal = mapped.reduce((s: number, i: any) => s + i.efectividad, 0) / mapped.length;
        } else {
          this.efectividadTotal = 0;
        }

        if (JSON.stringify(this.filas) !== JSON.stringify(sorted)) {
          this.previousFilas = [...this.filas];
          this.filas = sorted;
        }
        this.efectividadUi.setTotalFilas(this.filas.length);
        this.actualizarColumnas();
      },
      error: (err) => {
        console.error('Error al obtener tabla de efectividad:', err);
      }
    });
  }

  private extraerLista(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];

    const directo = data.datos ?? data.data ?? data.result ?? data.rows ?? data.lista;
    if (Array.isArray(directo)) return directo;
    if (directo && typeof directo === 'object') {
      if (Array.isArray(directo.datos)) return directo.datos;
      const vals = Object.values(directo).filter(v => v && typeof v === 'object' && !Array.isArray(v));
      if (vals.length > 0) return vals;
    }
    return [];
  }

  private mapFila(item: any) {
    const programadas = Number(
      item.programadas ?? item.vprogramadas ?? item.programados ?? item.total ?? 0
    );
    const instaladas = Number(item.instaladas ?? item.atendida ?? item.atendidas ?? 0);
    const efectividadRaw = Number(
      item.efectividad ?? item.efectividad_total ?? item.porcentaje ?? NaN
    );
    const efectividad = !isNaN(efectividadRaw)
      ? efectividadRaw
      : programadas > 0
        ? (instaladas / programadas) * 100
        : 0;

    return {
      asesor: item.asesor ?? item.advisor_name ?? item.nombre ?? item.usuario ?? '',
      programadas,
      instaladas,
      total: programadas,
      efectividad,
      totalugis: Number(item.totalugis ?? 0)
    };
  }

  isNewRow(index: number): boolean {
    if (!this.previousFilas || this.previousFilas.length === 0) return false;
    if (index >= this.previousFilas.length) return true;
    return JSON.stringify(this.filas[index]) !== JSON.stringify(this.previousFilas[index]);
  }

  /** Parte las filas: cada columna (salvo la última) tiene filasPorColumna; el resto sigue a la derecha. */
  private actualizarColumnas(): void {
    const total = this.filas.length;
    if (total === 0) {
      this.columnas = [];
      return;
    }
    const n = Math.max(1, Number(this.efectividadUi.filasPorColumna) || 1);
    const columnas: { fila: any; index: number }[][] = [];
    let i = 0;
    while (i < total) {
      const remaining = total - i;
      const esUltimaColumna = columnas.length >= 2;
      const take = esUltimaColumna ? remaining : Math.min(n, remaining);
      if (take < 1) break;
      const col: { fila: any; index: number }[] = [];
      for (let k = 0; k < take; k++) {
        col.push({ fila: this.filas[i], index: i });
        i++;
      }
      columnas.push(col);
    }
    this.columnas = columnas;
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

  private initParticleCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!canvas || !ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    this.resizeListener = resizeCanvas;
    window.addEventListener('resize', this.resizeListener);

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
      if (this.destroyed) return;
      if (time - lastFrame < 33) {
        requestAnimationFrame(animate);
        return;
      }
      lastFrame = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

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
  }
}
