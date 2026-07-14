import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.scss'
})
export class StarRating {
  @Input() rating = 0;
  @Input() maxStars = 5;
  @Input() showCount = false;
  @Input() count = 0;

  get stars(): { filled: boolean; half: boolean }[] {
    return Array.from({ length: this.maxStars }, (_, i) => ({
      filled: i < Math.floor(this.rating),
      half: i === Math.floor(this.rating) && this.rating % 1 >= 0.5
    }));
  }
}
