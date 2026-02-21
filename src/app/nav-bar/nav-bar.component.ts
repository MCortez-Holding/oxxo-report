import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-nav-bar',
  standalone: false,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  currentTime: Date = new Date();

  constructor(
    private configService: ConfigService,
    private router: Router
  ) {}

  ngOnInit(): void {
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  salir(): void {
    this.configService.clearConfig();
    this.router.navigate(['/']);
  }
}
