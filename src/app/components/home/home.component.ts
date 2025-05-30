// src/app/components/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '../../services/api.service';
import { Application, ApplicationsResponse, ApplicationStatus } from '../../models/interfaces';
import {ApplicationsListComponent} from '../applications-list/applications-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    ApplicationsListComponent
  ],
  template: `
    <div class="home-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <mat-icon class="title-icon">folder_shared</mat-icon>
            My Applications
          </h1>
          <p class="page-subtitle">Manage and track your application submissions</p>
        </div>

        <div class="header-actions">
          <button mat-raised-button
                  color="primary"
                  (click)="goToServices()"
                  class="new-application-btn">
            <mat-icon>add</mat-icon>
            New Application
          </button>

          <button mat-icon-button
                  (click)="refreshApplications()"
                  matTooltip="Refresh applications"
                  [disabled]="isLoading">
            <mat-icon [class.spinning]="isLoading">refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Applications Stats -->
      <div class="stats-section">
        <div class="stat-card" *ngFor="let stat of applicationStats">
          <div class="stat-content">
            <mat-icon [class]="'stat-icon ' + stat.colorClass">{{ stat.icon }}</mat-icon>
            <div class="stat-details">
              <span class="stat-number">{{ stat.count }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Applications Tabs -->
      <mat-card class="applications-card">
        <mat-tab-group
          class="applications-tabs"
          animationDuration="300ms"
          (selectedTabChange)="onTabChange($event)">

          <!-- Draft Applications -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">edit</mat-icon>
              <span>Draft</span>
              <mat-chip *ngIf="getApplicationsByStatus('draft').length > 0"
                       class="tab-badge draft-badge">
                {{ getApplicationsByStatus('draft').length }}
              </mat-chip>
            </ng-template>

            <div class="tab-content">
              <app-applications-list
                [applications]="getApplicationsByStatus('draft')"
                [loading]="isLoading"
                status="draft"
                (onEdit)="editApplication($event)"
                (onView)="viewApplication($event)"
                (onDelete)="deleteApplication($event)"
                (onContinue)="continueApplication($event)">
              </app-applications-list>
            </div>
          </mat-tab>

          <!-- Returned Applications -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">undo</mat-icon>
              <span>Returned</span>
              <mat-chip *ngIf="getApplicationsByStatus('returned').length > 0"
                       class="tab-badge returned-badge">
                {{ getApplicationsByStatus('returned').length }}
              </mat-chip>
            </ng-template>

            <div class="tab-content">
              <app-applications-list
                [applications]="getApplicationsByStatus('returned')"
                [loading]="isLoading"
                status="returned"
                (onEdit)="editApplication($event)"
                (onView)="viewApplication($event)"
                (onResubmit)="resubmitApplication($event)">
              </app-applications-list>
            </div>
          </mat-tab>

          <!-- Submitted Applications -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">send</mat-icon>
              <span>Submitted</span>
              <mat-chip *ngIf="getApplicationsByStatus('submitted').length > 0"
                       class="tab-badge submitted-badge">
                {{ getApplicationsByStatus('submitted').length }}
              </mat-chip>
            </ng-template>

            <div class="tab-content">
              <app-applications-list
                [applications]="getApplicationsByStatus('submitted')"
                [loading]="isLoading"
                status="submitted"
                (onView)="viewApplication($event)"
                (onTrack)="trackApplication($event)">
              </app-applications-list>
            </div>
          </mat-tab>

          <!-- Completed Applications -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">check_circle</mat-icon>
              <span>Completed</span>
              <mat-chip *ngIf="getApplicationsByStatus('completed').length > 0"
                       class="tab-badge completed-badge">
                {{ getApplicationsByStatus('completed').length }}
              </mat-chip>
            </ng-template>

            <div class="tab-content">
              <app-applications-list
                [applications]="getApplicationsByStatus('completed')"
                [loading]="isLoading"
                status="completed"
                (onView)="viewApplication($event)"
                (onDownload)="downloadApplication($event)">
              </app-applications-list>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 24px;
      max-width: 1200px;
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
      color: #3498db;
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

    .new-application-btn {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      font-weight: 600;
      height: 44px;
      padding: 0 24px;
      border-radius: 22px;
      box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
      transition: all 0.3s ease;
    }

    .new-application-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
    }

    .new-application-btn mat-icon {
      margin-right: 8px;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      padding: 12px;
      border-radius: 12px;
      background: rgba(52, 152, 219, 0.1);
    }

    .stat-icon.draft { color: #f39c12; background: rgba(243, 156, 18, 0.1); }
    .stat-icon.returned { color: #e74c3c; background: rgba(231, 76, 60, 0.1); }
    .stat-icon.submitted { color: #3498db; background: rgba(52, 152, 219, 0.1); }
    .stat-icon.completed { color: #27ae60; background: rgba(39, 174, 96, 0.1); }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 28px;
      font-weight: 700;
      color: #2c3e50;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #7f8c8d;
      font-weight: 500;
      margin-top: 4px;
    }

    .applications-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .applications-tabs {
      min-height: 500px;
    }

    .tab-content {
      padding: 24px;
      min-height: 400px;
    }

    .tab-icon {
      margin-right: 8px;
      font-size: 20px;
    }

    .tab-badge {
      margin-left: 8px;
      font-size: 12px;
      font-weight: 600;
      min-width: 20px;
      height: 20px;
      border-radius: 10px;
    }

    .draft-badge { background: #f39c12; color: white; }
    .returned-badge { background: #e74c3c; color: white; }
    .submitted-badge { background: #3498db; color: white; }
    .completed-badge { background: #27ae60; color: white; }

    /* Custom tab styling */
    ::ng-deep .applications-tabs {
      .mat-mdc-tab-header {
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
      }

      .mat-mdc-tab {
        min-width: 140px;
        padding: 0 24px;
        font-weight: 500;
      }

      .mat-mdc-tab.mdc-tab--active {
        background: rgba(52, 152, 219, 0.05);
      }

      .mat-mdc-tab-body-wrapper {
        background: white;
      }

      .mdc-tab-indicator__content--underline {
        border-color: #3498db;
        border-width: 3px;
        border-radius: 2px;
      }
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .home-container {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-actions {
        justify-content: flex-end;
      }

      .stats-section {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
      }
    }

    @media (max-width: 768px) {
      .page-title {
        font-size: 24px;
      }

      .title-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .stats-section {
        grid-template-columns: repeat(2, 1fr);
      }

      .stat-card {
        padding: 16px;
      }

      .stat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        padding: 8px;
      }

      .stat-number {
        font-size: 24px;
      }

      .tab-content {
        padding: 16px;
      }

      ::ng-deep .applications-tabs .mat-mdc-tab {
        min-width: 100px;
        padding: 0 12px;
        font-size: 14px;
      }

      .tab-icon {
        font-size: 18px;
      }
    }

    @media (max-width: 480px) {
      .stats-section {
        grid-template-columns: 1fr;
      }

      .header-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .new-application-btn {
        width: 100%;
        margin-bottom: 8px;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  applications: Application[] = [];
  isLoading = false;
  selectedTabIndex = 0;

  applicationStats = [
    { icon: 'edit', label: 'Draft', colorClass: 'draft', count: 0 },
    { icon: 'undo', label: 'Returned', colorClass: 'returned', count: 0 },
    { icon: 'send', label: 'Submitted', colorClass: 'submitted', count: 0 },
    { icon: 'check_circle', label: 'Completed', colorClass: 'completed', count: 0 }
  ];

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;

    this.apiService.getApplications().subscribe({
      next: (response: ApplicationsResponse) => {
        this.applications = response.results || [];
        this.updateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.applications = [];
        this.updateStats();
        this.isLoading = false;
      }
    });
  }

  refreshApplications(): void {
    this.loadApplications();
  }

  getApplicationsByStatus(status: ApplicationStatus): Application[] {
    return this.applications.filter(app => app.status === status);
  }

  updateStats(): void {
    this.applicationStats.forEach(stat => {
      const statusKey = stat.label.toLowerCase() as ApplicationStatus;
      stat.count = this.getApplicationsByStatus(statusKey).length;
    });
  }

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }

  goToServices(): void {
    this.router.navigate(['/services']);
  }

  // Application actions
  editApplication(application: Application): void {
    console.log('Edit application:', application);
    // Navigate to edit flow or open edit modal
  }

  viewApplication(application: Application): void {
    console.log('View application:', application);
    // Navigate to view page or open view modal
  }

  deleteApplication(application: Application): void {
    if (confirm(`Are you sure you want to delete this application?`)) {
      this.apiService.deleteCase(application.id).subscribe({
        next: () => {
          this.loadApplications(); // Refresh list
          console.log('Application deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting application:', error);
        }
      });
    }
  }

  continueApplication(application: Application): void {
    console.log('Continue application:', application);
    // Navigate to continue the application flow
  }

  resubmitApplication(application: Application): void {
    console.log('Resubmit application:', application);
    // Navigate to resubmit flow
  }

  trackApplication(application: Application): void {
    console.log('Track application:', application);
    // Show tracking information
  }

  downloadApplication(application: Application): void {
    console.log('Download application:', application);
    // Download application documents
  }
}
