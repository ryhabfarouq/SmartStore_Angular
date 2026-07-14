import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Banner } from '../../../models/seller.model';
import { Router } from '@angular/router';


@Component({
  selector: 'app-banner-slider',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './banner-slider.html',
  styleUrl: './banner-slider.scss',
})
export class BannerSlider implements OnInit,OnDestroy  {
  @Input() banners: Banner[] = [];

  currentIndex = signal(0);
  isTransitioning = signal(false);
private router = inject(Router);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly AUTO_PLAY_INTERVAL = 4000;

  currentBanner = computed(() => this.banners[this.currentIndex()] ?? null);

  ngOnInit(): void {
    if (this.banners.length > 1) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  startAutoPlay(): void {
    this.intervalId = setInterval(() => {
      this.next();
    }, this.AUTO_PLAY_INTERVAL);
  }

  stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  next(): void {
    if (this.isTransitioning()) return;
    this.isTransitioning.set(true);
    this.currentIndex.update((i) => (i + 1) % this.banners.length);
    setTimeout(() => this.isTransitioning.set(false), 600);
  }

  prev(): void {
    if (this.isTransitioning()) return;
    this.isTransitioning.set(true);
    this.currentIndex.update((i) =>
      i === 0 ? this.banners.length - 1 : i - 1
    );
    setTimeout(() => this.isTransitioning.set(false), 600);
  }

  goToSlide(index: number): void {
    if (index === this.currentIndex() || this.isTransitioning()) return;
    this.isTransitioning.set(true);
    this.currentIndex.set(index);
    this.stopAutoPlay();
    this.startAutoPlay();
    setTimeout(() => this.isTransitioning.set(false), 600);
  }

  onMouseEnter(): void {
    this.stopAutoPlay();
  }

  onMouseLeave(): void {
    if (this.banners.length > 1) {
      this.startAutoPlay();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

navigateToBanner(link: string): void {
  this.router.navigateByUrl(link);
}


}
