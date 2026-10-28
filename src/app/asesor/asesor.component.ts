import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, timeout } from 'rxjs';
import { SistemaConfig, SistemaType } from '../models/config.model';
import { ConfigService } from '../services/config.service';
import { ComparacionCrmData, ComparacionService } from '../services/comparacion.service';
import { AsesorColumnasService } from '../services/asesor-columnas.service';
import { VentasService } from '../services/ventas.service';

export interface VentaItemColumna {
  venta: any;
  index: number;
}

@Component({
  selector: 'app-asesor',
  templateUrl: './asesor.component.html',
  standalone: false,
  styleUrls: ['./asesor.component.css']
})
export class AsesorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('particlesCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  ventas: any[] = [];
  /** Número total de instaladas desde getNumberInstaladasTvFilter (solo se actualiza en REPORTE POR ASESOR). */
  instaladasTotales: number = 0;
  private updateInterval: any;
  private countdownInterval: any;
  private previousVentas: any[] = [];
  countdown: string = '02:00'; // Formato MM:SS
  updateFrequency: number = 120; // Tiempo en segundos (2 minutos)
  private destroyed = false;
  private resizeListener!: () => void;

  // ===== Estado de Modo 2 Columnas =====
  modoDosColumnas = false;
  ventasColumna1: VentaItemColumna[] = [];
  ventasColumna2: VentaItemColumna[] = [];
  private columnasSub?: Subscription;
  private filasSub?: Subscription;

  // ===== Estado de Comparación =====
  isComparando = false;
  comparacionData?: ComparacionCrmData;
  mostrarPanelConfig = false;
  modalSistema: SistemaType = 'telecom';
  modalIdentificador: number | null = null;
  panelCargando = false;
  panelError: string | null = null;
  sistemasDisponibles: { key: SistemaType; label: string }[] = [];

  // Datos del CRM Comparado (Derecha)
  ventasComp: any[] = [];
  instaladasTotalesComp: number = 0;
  metaComp: number = 0;
  sistemaCompNombre: string = '';
  identificadorComp: number | null = null;
  private compConfig?: SistemaConfig;
  private compUsuariosStr = '';
  private compSalasStr = '';
  private previousVentasComp: any[] = [];

  private comparacionSub?: Subscription;
  private abrirModalSub?: Subscription;

  constructor(
    private ventasService: VentasService,
    private configService: ConfigService,
    private comparacionService: ComparacionService,
    private asesorColumnasService: AsesorColumnasService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.actualizarSistemasDisponibles();
    this.obtenerVentas();
    this.obtenerNumeroInstaladas();
    this.startCountdown();

    this.updateInterval = setInterval(() => {
      this.obtenerVentas();
      this.obtenerNumeroInstaladas();
      if (this.isComparando) {
        this.obtenerDatosComparacion();
      }
      this.resetCountdown();
    }, this.updateFrequency * 1000);

    // Escuchar cambios de estado de 2 columnas
    this.columnasSub = this.asesorColumnasService.modoDosColumnasObservable.subscribe(activo => {
      this.modoDosColumnas = activo;
      this.actualizarDosColumnas();
    });

    this.filasSub = this.asesorColumnasService.filasPrimeraTablaObservable.subscribe(() => {
      this.actualizarDosColumnas();
    });

    // Escuchar cambios de estado de comparación
    this.comparacionSub = this.comparacionService.estado$.subscribe(state => {
      this.isComparando = state.activo;
      this.comparacionData = state;
      if (!state.activo) {
        this.ventasComp = [];
        this.instaladasTotalesComp = 0;
        this.metaComp = 0;
        this.compConfig = undefined;
      }
    });

    // Escuchar solicitud de apertura de modal desde el header
    this.abrirModalSub = this.comparacionService.abrirModal$.subscribe(abrir => {
      if (abrir) {
        this.abrirModalComparar();
      }
    });
  }

  ngOnDestroy() {
    this.destroyed = true;
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    this.columnasSub?.unsubscribe();
    this.filasSub?.unsubscribe();
    this.comparacionSub?.unsubscribe();
    this.abrirModalSub?.unsubscribe();
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
    this.actualizarDosColumnas();
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.initParticleCanvas();
      });
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
  }

  get filasPrimeraColumna(): number {
    return this.asesorColumnasService.filasPrimeraTabla;
  }

  /**
   * Divide la lista total de ventas en dos subconjuntos:
   * 1. Primera tabla: los primeros N registros especificados por el usuario
   * 2. Segunda tabla: el resto de registros correlativamente hacia abajo
   */
  actualizarDosColumnas(): void {
    if (!this.ventas || this.ventas.length === 0) {
      this.ventasColumna1 = [];
      this.ventasColumna2 = [];
      return;
    }

    const limite = this.filasPrimeraColumna;
    this.ventasColumna1 = this.ventas.slice(0, limite).map((venta, idx) => ({
      venta,
      index: idx
    }));

    this.ventasColumna2 = this.ventas.slice(limite).map((venta, idx) => ({
      venta,
      index: limite + idx
    }));
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
          this.asesorColumnasService.setTotalVentas(ventas.length);
          this.actualizarDosColumnas();
        }
      },
      error: (err) => {
        console.error('Error al obtener ventas:', err);
      }
    });
  }

  /** getNumberInstaladasTvFilter: actualiza la meta con instaladas_totales (rango: primer día del mes hasta último día del mes). */
  obtenerNumeroInstaladas(): void {
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    this.ventasService.getNumberInstaladasTvFilter(fechaInicio, fechaFin).subscribe({
      next: (data: any) => {
        const total = Number(data?.instaladas_totales ?? data?.datos?.instaladas_totales ?? 0);
        this.instaladasTotales = total;
      },
      error: (err) => {
        console.error('Error al obtener número de instaladas:', err);
      }
    });
  }

  get meta(): number {
    return this.configService.getMeta();
  }
  get ventasInstaladas(): number {
    return this.instaladasTotales;
  }
  get ventasFaltantes(): number {
    return Math.max(0, this.meta - this.ventasInstaladas);
  }

  get totalSubidas(): number {
    return this.ventas.reduce((sum, venta) => sum + Number(venta.total ?? 0), 0);
  }

  get sistemaActualNombre(): string {
    const payload = this.configService.getCurrentPayload();
    if (!payload) return 'Actual';
    return this.formatearNombreSistema(payload.sistema);
  }

  get identificadorActual(): number | null {
    return this.configService.getCurrentPayload()?.identificador ?? null;
  }

  // ===== Getters para el CRM comparado =====
  get ventasInstaladasComp(): number {
    return this.instaladasTotalesComp;
  }

  get ventasFaltantesComp(): number {
    return Math.max(0, this.metaComp - this.ventasInstaladasComp);
  }

  get totalSubidasComp(): number {
    return this.ventasComp.reduce((sum, venta) => sum + Number(venta.total ?? 0), 0);
  }

  actualizarSistemasDisponibles(): void {
    const todos: SistemaType[] = this.configService.sistemas;
    const actualPayload = this.configService.getCurrentPayload();
    // Excluir el CRM actualmente activo para comparar únicamente con otros CRM registrados
    const filtrados = actualPayload ? todos.filter(s => s !== actualPayload.sistema) : todos;
    this.sistemasDisponibles = filtrados.map(s => ({
      key: s,
      label: this.formatearNombreSistema(s)
    }));
  }

  trackBySistema(index: number, item: { key: SistemaType; label: string }): string {
    return item.key;
  }

  formatearNombreSistema(sistema: SistemaType): string {
    switch (sistema) {
      case 'mcortez': return 'Mcortez';
      case 'telecom': return 'Telecom';
      case 'konectar': return 'Konectar';
      case 'comunica': return 'Oxxo - Zeus';
      case 'optimus': return 'Oxxo - Optimus';
      case 'eros': return 'Mayolo';
      default: return sistema;
    }
  }

  abrirModalComparar(): void {
    this.actualizarSistemasDisponibles();
    if (!this.modalSistema || !this.sistemasDisponibles.some(s => s.key === this.modalSistema)) {
      this.modalSistema = this.sistemasDisponibles.length > 0 ? this.sistemasDisponibles[0].key : 'telecom';
    }
    this.modalIdentificador = null;
    this.panelError = null;
    this.panelCargando = false;
    this.mostrarPanelConfig = !this.mostrarPanelConfig;
  }

  selectCrm(key: SistemaType): void {
    this.modalSistema = key;
  }

  cerrarPanelConfig(): void {
    this.mostrarPanelConfig = false;
    this.panelError = null;
  }

  confirmarComparacion(): void {
    if (!this.modalIdentificador || this.modalIdentificador <= 0) {
      this.panelError = 'Ingresa un Identificador válido (número mayor a 0).';
      return;
    }

    const actual = this.configService.getCurrentPayload();
    if (actual && actual.sistema === this.modalSistema && Number(actual.identificador) === Number(this.modalIdentificador)) {
      this.panelError = `No puedes comparar con el mismo CRM (${this.formatearNombreSistema(this.modalSistema)}) y el mismo Identificador (${this.modalIdentificador}) que ya tienes abierto.`;
      return;
    }

    this.panelCargando = true;
    this.panelError = null;

    this.configService.fetchPrimaryData(this.modalSistema, this.modalIdentificador).pipe(
      timeout(12000)
    ).subscribe({
      next: ({ config, primaryData }) => {
        this.compConfig = config;
        this.compUsuariosStr = (primaryData.usuarios || []).map(u => String(u)).join(',');
        this.compSalasStr = (primaryData.salas || []).map(s => String(s)).join(',');
        const m = primaryData.meta;
        this.metaComp = m == null || m === '' ? 0 : (typeof m === 'number' ? m : parseInt(String(m), 10) || 0);
        this.sistemaCompNombre = this.formatearNombreSistema(this.modalSistema);
        this.identificadorComp = this.modalIdentificador;

        this.comparacionService.activarComparacion(this.modalSistema, this.modalIdentificador!);
        this.panelCargando = false;
        this.mostrarPanelConfig = false;

        // Cargar inmediatamente los datos del CRM comparado
        this.obtenerDatosComparacion();
      },
      error: err => {
        console.error('Error en fetchPrimaryData:', err);
        this.panelCargando = false;
        if (err?.name === 'TimeoutError') {
          this.panelError = 'Tiempo de espera agotado al conectar con el servidor. Verifica tu conexión o intenta con otro CRM.';
        } else {
          this.panelError = err?.error?.message || err?.message || 'Error al conectar con el CRM seleccionado. Verifica el sistema y número.';
        }
      }
    });
  }

  quitarComparacion(): void {
    this.comparacionService.quitarComparacion();
  }

  obtenerDatosComparacion(): void {
    if (!this.compConfig) return;
    const hoy = new Date();
    const fechaInicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fechaFinMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // 1. Obtener ventas del día
    this.ventasService.getVentasCustom(this.compConfig, this.compUsuariosStr, this.compSalasStr, hoy, hoy).subscribe({
      next: (data: { datos?: any[] }) => {
        const ventas = (data.datos ?? []).slice();
        ventas.sort((a: any, b: any) => Number(b.total) - Number(a.total));
        if (JSON.stringify(this.ventasComp) !== JSON.stringify(ventas)) {
          this.previousVentasComp = [...this.ventasComp];
          this.ventasComp = ventas;
        }
      },
      error: err => {
        console.error('Error al obtener ventas de comparación:', err);
      }
    });

    // 2. Obtener instaladas totales del mes
    this.ventasService.getNumberInstaladasTvFilterCustom(this.compConfig, this.compUsuariosStr, this.compSalasStr, fechaInicioMes, fechaFinMes).subscribe({
      next: (data: any) => {
        const total = Number(data?.instaladas_totales ?? data?.datos?.instaladas_totales ?? 0);
        this.instaladasTotalesComp = total;
      },
      error: err => {
        console.error('Error al obtener número de instaladas de comparación:', err);
      }
    });
  }

  // Método para verificar si una fila es nueva
  isNewRow(index: number): boolean {
    if (!this.previousVentas || this.previousVentas.length === 0) return false;
    if (index >= this.previousVentas.length) return true;
    const currentVenta = this.ventas[index];
    const previousVenta = this.previousVentas[index];
    return JSON.stringify(currentVenta) !== JSON.stringify(previousVenta);
  }

  isNewRowComp(index: number): boolean {
    if (!this.previousVentasComp || this.previousVentasComp.length === 0) return false;
    if (index >= this.previousVentasComp.length) return true;
    const currentVenta = this.ventasComp[index];
    const previousVenta = this.previousVentasComp[index];
    return JSON.stringify(currentVenta) !== JSON.stringify(previousVenta);
  }
}
