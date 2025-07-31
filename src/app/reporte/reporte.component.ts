import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { VentasService } from '../services/ventas.service';

@Component({
  selector: 'app-reporte',
  templateUrl: './reporte.component.html',
  standalone:false,
  styleUrls: ['./reporte.component.css']
})
export class ReporteComponent implements AfterViewInit, OnInit{
    @ViewChild('particlesCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mainChartCanvas', { static: false }) mainChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  rangoSeleccionado: string = 'hoy'; // Valor por defecto
  ventas: any[] = [];
  private updateInterval: any;
  private countdownInterval: any;
  private previousVentas: any[] = [];
  countdown: string = '02:00';
  updateFrequency: number = 120;
  private mainChart!: Chart;

  constructor(private ventasService: VentasService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.obtenerVentas();
    this.startCountdown();
    this.updateInterval = setInterval(() => {
      this.obtenerVentas();
      this.resetCountdown();
    }, this.updateFrequency * 1000);
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.mainChart) {
      this.mainChart.destroy();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initParticleCanvas();
    });
  }

 private createMainChart() {
    if (this.mainChart) {
        this.mainChart.destroy();
    }

    const ctx = this.mainChartCanvas.nativeElement.getContext('2d');
    if (!ctx || this.ventas.length === 0) return;

    const ventasOrdenadas = [...this.ventas].sort((a, b) => b.sales_attended - a.sales_attended);

    // Calcular efectividad (ventas atendidas / ventas totales * 100)
    const calcularEfectividad = (attended: number, total: number) => {
        return total > 0 ? (attended / total) * 100 : 0;
    };

    // Preparar datos para el gráfico
    const labels = ventasOrdenadas.map(v => v.advisor_name);
    const datasets = [
        {
            label: 'Efectividad',
            data: ventasOrdenadas.map(v => calcularEfectividad(v.sales_attended, v.number_sales)),
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }
    ];

    this.mainChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#ffffff'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => {
                            // Asegurar que raw es un número
                            const value = typeof context.raw === 'number' ? context.raw : 0;
                            return `${context.dataset.label}: ${value.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    max: 100, // Máximo del 100%
                    min: 0,   // Mínimo del 0%
                    beginAtZero: true,
                    ticks: {
                        color: '#ffffff',
                        stepSize: 10,
                        callback: (value) => {
                            // Asegurar que value es un número
                            const numericValue = typeof value === 'number' ? value : 0;
                            return `${numericValue}%`;
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuad'
            }
        }
    });
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
    let fechaInicio: Date;
    let fechaFin: Date = new Date(hoy); // Por defecto, fecha fin es hoy

    switch(this.rangoSeleccionado) {
        case 'hoy':
            fechaInicio = new Date(hoy);
            break;
        case 'semana':
            fechaInicio = new Date(hoy);
            fechaInicio.setDate(hoy.getDate() - hoy.getDay()); // Primer día de la semana (domingo)
            break;
        case 'mes':
            fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            break;
        case 'todo':
            // Puedes establecer una fecha muy antigua o null según tu API
            fechaInicio = new Date(0); // 1/1/1970
            break;
        default:
            fechaInicio = new Date(hoy);
    }

    this.ventasService.getVentas(fechaInicio, fechaFin).subscribe({
        next: (data: any) => {
            if (JSON.stringify(this.ventas) !== JSON.stringify(data.ventas)) {
                this.previousVentas = [...this.ventas];
                // Ordenar por sales_attended de mayor a menor
this.ventas = data.ventas.sort((a: any, b: any) => {
    if (b.sales_attended !== a.sales_attended) {
        return b.sales_attended - a.sales_attended; // Prioridad: ventas instaladas
    } else {
        const efectividadA = a.sales_attended / a.number_sales;
        const efectividadB = b.sales_attended / b.number_sales;
        return efectividadB - efectividadA; // Segundo criterio: efectividad
    }
});
                setTimeout(() => this.createMainChart(), 0);
                console.log('Datos actualizados:', data);
            }
        },
        error: (err) => {
            console.error('Error al obtener ventas:', err);
        }
    });
}
// Método para cambiar el rango
cambiarRango() {
    this.obtenerVentas();
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