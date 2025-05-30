// src/app/components/services/services.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../services/api.service';
import { Service, ServicesResponse } from '../../models/interfaces';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    <div class="services-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <mat-icon class="title-icon">miscellaneous_services</mat-icon>
            Available Services
          </h1>
          <p class="page-subtitle">Choose a service to start your application process</p>
        </div>

        <div class="header-actions">
          <button mat-icon-button
                  (click)="refreshServices()"
                  matTooltip="Refresh services"
                  [disabled]="isLoading">
            <mat-icon [class.spinning]="isLoading">refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Search and Filter Section -->
      <mat-card class="search-card">
        <mat-card-content>
          <div class="search-section">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search services</mat-label>
              <input matInput
                     [(ngModel)]="searchQuery"
                     (input)="filterServices()"
                     placeholder="Search by service name...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <div class="search-results" *ngIf="searchQuery">
              <mat-chip class="result-chip">
                {{ filteredServices.length }} service{{ filteredServices.length !== 1 ? 's' : '' }} found
              </mat-chip>
              <button mat-button
                      (click)="clearSearch()"
                      class="clear-search">
                <mat-icon>clear</mat-icon>
                Clear
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="60"></mat-spinner>
        <p class="loading-text">Loading available services...</p>
        <div class="loading-progress">
          <div class="progress-bar"></div>
        </div>
      </div>

      <!-- Error State -->
      <mat-card class="error-card" *ngIf="error && !isLoading">
        <mat-card-content>
          <div class="error-content">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <div class="error-details">
              <h3>Unable to Load Services</h3>
              <p>{{ error }}</p>
              <button mat-raised-button
                      color="primary"
                      (click)="refreshServices()">
                <mat-icon>refresh</mat-icon>
                Try Again
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Services Grid -->
      <div class="services-grid" *ngIf="!isLoading && !error && filteredServices.length > 0">
        <mat-card
          *ngFor="let service of filteredServices; trackBy: trackByServiceId"
          class="service-card"
          [class.active-service]="service.active_ind"
          (click)="selectService(service)">

          <!-- Service Icon -->
          <div class="service-icon-container">
            <img *ngIf="service.icon"
                 [src]="service.icon"
                 [alt]="service.name"
                 class="service-icon"
                 (error)="onImageError($event)">
            <mat-icon *ngIf="!service.icon" class="default-service-icon">
              build
            </mat-icon>

            <!-- Status Badge -->
            <div class="status-badge" [class.active]="service.active_ind">
              <mat-icon>{{ service.active_ind ? 'check_circle' : 'pause_circle' }}</mat-icon>
            </div>
          </div>

          <!-- Service Info -->
          <mat-card-header class="service-header">
            <mat-card-title class="service-title">
              {{ service.name }}
            </mat-card-title>
            <mat-card-subtitle class="service-subtitle" *ngIf="service.name_ara">
              {{ service.name_ara }}
            </mat-card-subtitle>
          </mat-card-header>

          <!-- Service Details -->
          <mat-card-content class="service-content">
            <div class="service-details">
              <div class="detail-item">
                <mat-icon class="detail-icon">tag</mat-icon>
                <span class="detail-text">Code: {{ service.code }}</span>
              </div>

              <div class="detail-item">
                <mat-icon class="detail-icon">category</mat-icon>
                <span class="detail-text">Type: {{ service.type }}</span>
              </div>
            </div>

            <!-- Service Status -->
            <div class="service-status">
              <mat-chip [class]="service.active_ind ? 'active-chip' : 'inactive-chip'">
                <mat-icon class="chip-icon">
                  {{ service.active_ind ? 'check_circle' : 'pause_circle' }}
                </mat-icon>
                {{ service.active_ind ? 'Available' : 'Unavailable' }}
              </mat-chip>
            </div>
          </mat-card-content>

          <!-- Service Actions -->
          <mat-card-actions class="service-actions">
            <button mat-button
                    color="primary"
                    (click)="previewService(service); $event.stopPropagation()">
              <mat-icon>preview</mat-icon>
              Preview
            </button>

            <button mat-raised-button
                    color="primary"
                    [disabled]="!service.active_ind"
                    (click)="startService(service); $event.stopPropagation()"
                    class="start-btn">
              <mat-icon>play_arrow</mat-icon>
              Start Application
            </button>
          </mat-card-actions>

          <!-- Hover Overlay -->
          <div class="hover-overlay" *ngIf="service.active_ind">
            <mat-icon class="overlay-icon">arrow_forward</mat-icon>
            <span class="overlay-text">Click to Start</span>
          </div>
        </mat-card>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && !error && filteredServices.length === 0">
        <mat-icon class="empty-icon">search_off</mat-icon>
        <h3 class="empty-title">
          {{ searchQuery ? 'No services found' : 'No services available' }}
        </h3>
        <p class="empty-subtitle">
          {{ searchQuery
          ? 'Try adjusting your search terms or clear the search to see all services.'
          : 'There are currently no services available. Please contact your administrator.' }}
        </p>
        <button mat-raised-button
                color="primary"
                (click)="clearSearch()"
                *ngIf="searchQuery">
          <mat-icon>clear</mat-icon>
          Clear Search
        </button>
      </div>

      <!-- Services Count -->
      <div class="services-count" *ngIf="!isLoading && services.length > 0">
        <mat-chip class="count-chip">
          {{ filteredServices.length }} of {{ services.length }} service{{ services.length !== 1 ? 's' : '' }}
        </mat-chip>
      </div>
    </div>
  `,
  styles: [`
    .services-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      min-height: calc(100vh - 64px);
      background: #f5f7fa;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding: 0 8px;
    }

    .header-content {
      flex: 1;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 600;
      color: #2c3e50;
    }

    .title-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #9b59b6;
    }

    .page-subtitle {
      margin: 0;
      color: #7f8c8d;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .search-card {
      margin-bottom: 32px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .search-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .search-results {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .result-chip {
      background: #e3f2fd;
      color: #1976d2;
      font-size: 12px;
      font-weight: 600;
    }

    .clear-search {
      color: #666;
      min-width: auto;
      padding: 0 12px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 24px;
    }

    .loading-text {
      color: #6c757d;
      font-size: 18px;
      margin: 0;
      font-weight: 500;
    }

    .loading-progress {
      width: 200px;
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-bar {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #9b59b6, #3498db, #9b59b6);
      background-size: 200% 100%;
      animation: progressAnimation 2s linear infinite;
    }

    @keyframes progressAnimation {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .error-card {
      margin: 40px auto;
      max-width: 600px;
      border-radius: 16px;
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 20px;
      text-align: left;
    }

    .error-icon {
      font-size: 48px;
      color: #e74c3c;
      flex-shrink: 0;
    }

    .error-details h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 20px;
    }

    .error-details p {
      margin: 0 0 16px 0;
      color: #7f8c8d;
      line-height: 1.5;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .service-card {
      border-radius: 20px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      background: white;
      border: 2px solid transparent;
      height: fit-content;
    }

    .service-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      border-color: #9b59b6;
    }

    .service-card.active-service:hover .hover-overlay {
      opacity: 1;
    }

    .service-icon-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 120px;
      background: linear-gradient(135deg, #9b59b6 0%, #3498db 100%);
      margin: -1px -1px 0 -1px;
    }

    .service-icon {
      width: 64px;
      height: 64px;
      object-fit: contain;
      border-radius: 12px;
      background: white;
      padding: 8px;
    }

    .default-service-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: white;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 8px;
    }

    .status-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
    }

    .status-badge mat-icon {
      font-size: 20px;
      color: #e74c3c;
    }

    .status-badge.active mat-icon {
      color: #27ae60;
    }

    .service-header {
      padding: 20px 20px 16px 20px;
      text-align: center;
    }

    .service-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
      line-height: 1.4;
    }

    .service-subtitle {
      font-size: 14px;
      color: #7f8c8d;
      margin: 4px 0 0 0;
      line-height: 1.3;
    }

    .service-content {
      padding: 0 20px 20px 20px;
    }

    .service-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .detail-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #9b59b6;
    }

    .detail-text {
      font-size: 14px;
      color: #555;
      font-weight: 500;
    }

    .service-status {
      display: flex;
      justify-content: center;
    }

    .active-chip {
      background: rgba(39, 174, 96, 0.1);
      color: #27ae60;
      font-weight: 600;
    }

    .inactive-chip {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
      font-weight: 600;
    }

    .chip-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .service-actions {
      padding: 16px 20px 20px 20px;
      background: #fafbfc;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .start-btn {
      background: linear-gradient(135deg, #9b59b6 0%, #3498db 100%);
      color: white;
      font-weight: 600;
      flex: 1;
      height: 40px;
      border-radius: 20px;
    }

    .start-btn:disabled {
      background: #bdc3c7;
      color: #95a5a6;
    }

    .start-btn mat-icon {
      margin-right: 6px;
    }

    .hover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(155, 89, 182, 0.9) 0%, rgba(52, 152, 219, 0.9) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.3s ease;
      backdrop-filter: blur(2px);
    }

    .overlay-icon {
      font-size: 48px;
      color: white;
      margin-bottom: 8px;
    }

    .overlay-text {
      color: white;
      font-size: 16px;
      font-weight: 600;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
      padding: 40px 20px;
    }

    .empty-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #cbd5e0;
      margin-bottom: 24px;
    }

    .empty-title {
      font-size: 24px;
      font-weight: 600;
      color: #4a5568;
      margin: 0 0 12px 0;
    }

    .empty-subtitle {
      font-size: 16px;
      color: #718096;
      margin: 0 0 32px 0;
      max-width: 500px;
      line-height: 1.6;
    }

    .services-count {
      display: flex;
      justify-content: center;
      margin-top: 32px;
    }

    .count-chip {
      background: #e8f4fd;
      color: #1976d2;
      font-weight: 600;
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .services-container {
        padding: 16px;
      }

      .services-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .page-title {
        font-size: 24px;
      }

      .title-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .services-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .service-actions {
        flex-direction: column;
      }

      .service-actions button {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .services-container {
        padding: 12px;
      }

      .search-field {
        max-width: 100%;
      }

      .error-content {
        flex-direction: column;
        text-align: center;
      }

      .error-icon {
        font-size: 40px;
      }
    }
  `]
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  filteredServices: Service[] = [];
  isLoading = false;
  error: string | null = null;
  searchQuery = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.getServices().subscribe({
      next: (response: ServicesResponse) => {
        this.services = response.results || [];
        this.filteredServices = [...this.services];
        this.isLoading = false;
        console.log('✅ Services loaded:', this.services);
      },
      error: (error) => {
        console.error('❌ Error loading services:', error);
        this.error = error.message || 'Failed to load services';
        this.services = [];
        this.filteredServices = [];
        this.isLoading = false;
      }
    });
  }

  refreshServices(): void {
    this.loadServices();
  }

  filterServices(): void {
    if (!this.searchQuery.trim()) {
      this.filteredServices = [...this.services];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredServices = this.services.filter(service =>
      service.name.toLowerCase().includes(query) ||
      (service.name_ara && service.name_ara.toLowerCase().includes(query)) ||
      service.code.toLowerCase().includes(query)
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredServices = [...this.services];
  }

  trackByServiceId(index: number, service: Service): number {
    return service.id;
  }

  selectService(service: Service): void {
    if (service.active_ind) {
      this.startService(service);
    }
  }

  previewService(service: Service): void {
    // Could open a preview modal or navigate to preview page
    console.log('Preview service:', service);
  }

  startService(service: Service): void {
    if (!service.active_ind) {
      console.warn('Service is not active:', service);
      return;
    }

    console.log('Starting service:', service);
    // Navigate to service flow with service ID
    this.router.navigate(['/service-flow', service.id]);
  }

  onImageError(event: any): void {
    // Hide the broken image and show default icon
    event.target.style.display = 'none';
  }
}
