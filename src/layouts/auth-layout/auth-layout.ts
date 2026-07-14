import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, LoadingSpinner],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss'
})
export class AuthLayout {}
