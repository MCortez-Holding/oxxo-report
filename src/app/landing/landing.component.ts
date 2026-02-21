import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { SistemaType } from '../models/config.model';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  standalone: false,
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  sistema: SistemaType = 'mcortez';
  identificador: number | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private configService: ConfigService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.readParamsFromUrl();
  }

  /** Lee sistema e id de la URL (ej. ?sistema=telecom&id=10) para TV o enlaces directos. */
  private readParamsFromUrl(): void {
    this.route.queryParams.subscribe(params => {
      const sistemaParam = (params['sistema'] || '').toLowerCase();
      const idParam = params['id'] ?? params['identificador'];

      const validSystems: SistemaType[] = ['mcortez', 'telecom', 'konectar', 'comunica'];
      if (validSystems.includes(sistemaParam as SistemaType)) {
        this.sistema = sistemaParam as SistemaType;
      }
      if (idParam != null && idParam !== '') {
        const num = Number(idParam);
        if (!isNaN(num) && num > 0) {
          this.identificador = num;
          this.autoSubmitIfValid();
        }
      }
    });
  }

  /** Si ya hay sistema e identificador válidos por URL, opcionalmente auto-enviar. */
  private autoSubmitIfValid(): void {
    if (this.identificador == null || this.identificador <= 0) return;
    const auto = this.route.snapshot.queryParams['auto'];
    if (auto === '1' || auto === 'true') {
      this.onSubmit();
    }
  }

  get identificadorValid(): boolean {
    return this.identificador != null && this.identificador > 0;
  }

  onSubmit(): void {
    if (!this.identificadorValid) {
      this.error = 'Ingresa un Identificador válido (número mayor a 0).';
      return;
    }
    this.error = null;
    this.loading = true;

    this.configService.submitConfig({
      sistema: this.sistema,
      identificador: this.identificador!
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/reporte-general']);
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Error al cargar la configuración. Verifica el sistema e identificador.';
      }
    });
  }
}
