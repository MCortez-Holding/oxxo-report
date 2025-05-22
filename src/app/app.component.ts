import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
    title = 'telco-report.UI';

  showAd = false;
  currentAd = '';
  private ads = ['assets/bono_1.jpg', 'assets/bono_2.jpg','assets/aviso_1.jpg'];
  private adIndex = 0;
  private adInterval: any;

  ngOnInit(): void {
    this.startAdLoop();
  }

  startAdLoop(): void {
    this.showRandomAd();

    this.setNextAdInterval();
  }

  private showRandomAd(): void {
    this.showAd = true;
    this.currentAd = this.ads[this.adIndex];
    this.adIndex = (this.adIndex + 1) % this.ads.length;

    setTimeout(() => {
      this.showAd = false;
      this.setNextAdInterval();
    }, 5000);
  }

  private setNextAdInterval(): void {
    if (this.adInterval) {
      clearTimeout(this.adInterval);
    }

    const randomTime = Math.floor(Math.random() * (100000 - 10000 + 1)) + 10000;
    
    this.adInterval = setTimeout(() => {
      this.showRandomAd();
    }, randomTime);
  }

  ngOnDestroy(): void {
    if (this.adInterval) {
      clearTimeout(this.adInterval);
    }
  }
}