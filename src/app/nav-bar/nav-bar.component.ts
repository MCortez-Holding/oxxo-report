import { Component } from '@angular/core';

@Component({
  selector: 'app-nav-bar',
  standalone: false,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
currentTime: Date = new Date();

  constructor() {}

  ngOnInit(): void {
    // Actualizar la hora cada segundo
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }
}
