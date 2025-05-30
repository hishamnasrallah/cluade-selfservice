// src/app/components/applications-list/applications-list.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { Application, ApplicationStatus } from '../../models/interfaces';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="applications-container">
      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-text">Loading applications...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && applications.length === 0">
        <mat-icon class="empty-icon">{{ getEmptyStateIcon() }}</mat-icon>
        <h3 class="empty-title">{{ getEmptyStateTitle() }}</h3>
        <p class="empty-subtitle">{{ getEmptyStateSubtitle() }}</p>
        <button mat-raised-button
                color="primary"
                (click)="onNewApplication()"
                class="empty-action-btn">
          <mat-icon>add</mat-icon>
          Start New Application
        </button>
      </div>

      <!-- Applications Grid -->
      <div class="applications-grid" *ngIf="!loading && applications.length > 0">
        <mat-card
          *ngFor="let app of applications; trackBy: trackByFn"
          class="application-card"
          [class]="'status-' + app.status">

          <!-- Card Header -->
          <mat-card-header class="card-header">
            <div class="application-info">
              <mat-card-title class="application-title">
                {{ app.title || 'Untitled Application' }}
              </mat-card-title>
              <mat-card-subtitle class="application-service">
                {{ app.service_name || 'Unknown Service' }}
              </mat-card-subtitle>
            </div>

            <div class="header-actions">
              <mat-chip class="status-chip" [class]="'status-' + app.status">
                <mat-icon class="status-icon">{{ getStatusIcon(app.status) }}</mat-icon>
                {{ getStatusLabel(app.status) }}
              </mat-chip>

              <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                <mat-icon>more_vert</mat-icon>
              </button>

              <mat-menu #actionMenu="matMenu">
                <button mat-menu-item (click)="onView.emit(app)">
                  <mat-icon>visibility</mat-icon>
                  <span>View Details</span>
                </button>

                <button mat-menu-item
                        (click)="onEdit.emit(app)"
                        *ngIf="canEdit(app.status)">
                  <mat-icon>edit</mat-icon>
                  <span>Edit</span>
                </button>

                <button mat-menu-item
                        (click)="onContinue.emit(app)"
                        *ngIf="canContinue(app.status)">
                  <mat-icon>play_arrow</mat-icon>
                  <span>Continue</span>
                </button>

                <button mat-menu-item
                        (click)="onResubmit.emit(app)"
                        *ngIf="canResubmit(app.status)">
                  <mat-icon>send</mat-icon>
                  <span>Resubmit</span>
                </button>

                <button mat-menu-item
                        (click)="onTrack.emit(app)"
                        *ngIf="canTrack(app.status)">
                  <mat-icon>track_changes</mat-icon>
                  <span>Track Progress</span>
                </button>

                <button mat-menu-item
                        (click)="onDownload.emit(app)"
                        *ngIf="canDownload(app.status)">
                  <mat-icon>download</mat-icon>
                  <span>Download</span>
                </button>

                <mat-divider *ngIf="canDelete(app.status)"></mat-divider>

                <button mat-menu-item
                        (click)="onDelete.emit(app)"
                        *ngIf="canDelete(app.status)"
                        class="delete-action">
                  <mat-icon>delete</mat-icon>
                  <span>Delete</span>
                </button>
              </mat-menu>
            </div>
          </mat-card-header>

          <!-- Card Content -->
          <mat-card-content class="card-content">
            <div class="application-details">
              <div class="detail-item">
                <mat-icon class="detail-icon">event</mat-icon>
                <div class="detail-content">
                  <span class="detail-label">Created</span>
                  <span class="detail-value">{{ formatDate(app.created_at) }}</span>
                </div>
              </div>

              <div class="detail-item" *ngIf="app.updated_at !== app.created_at">
                <mat-icon class="detail-icon">update</mat-icon>
                <div class="detail-content">
                  <span class="detail-label">Updated</span>
                  <span class="detail-value">{{ formatDate(app.updated_at) }}</span>
                </div>
              </div>

              <div class="detail-item">
                <mat-icon class="detail-icon">fingerprint</mat-icon>
                <div class="detail-content">
                  <span class="detail-label">Application ID</span>
                  <span class="detail-value">#{{ app.id }}</span>
                </div>
              </div>
            </div>

            <!-- Progress Indicator -->
            <div class="progress-section" *ngIf="showProgress(app.status)">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="getProgressPercentage(app.status)"></div>
              </div>
              <span class="progress-label">{{ getProgressLabel(app.status) }}</span>
            </div>
          </mat-card-content>

          <!-- Card Actions -->
          <mat-card-actions class="card-actions">
            <button mat-button
                    color="primary"
                    (click)="onView.emit(app)">
              <mat-icon>visibility</mat-icon>
              View
            </button>

            <button mat-raised-button
                    color="primary"
                    (click)="getPrimaryAction(app)"
                    *ngIf="getPrimaryActionLabel(app.status)"
                    class="primary-action">
              <mat-icon>{{ getPrimaryActionIcon(app.status) }}</mat-icon>
              {{ getPrimaryActionLabel(app.status) }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .applications-container {
      width: 100%;
      min-height: 300px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 16px;
    }

    .loading-text {
      color: #6c757d;
      font-size: 16px;
      margin: 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      text-align: center;
      padding: 40px 20px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #cbd5e0;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 20px;
      font-weight: 600;
      color: #4a5568;
      margin: 0 0 8px 0;
    }

    .empty-subtitle {
      font-size: 14px;
      color: #718096;
      margin: 0 0 24px 0;
      max-width: 300px;
      line-height: 1.5;
    }

    .empty-action-btn {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      font-weight: 600;
      height: 44px;
      padding: 0 24px;
      border-radius: 22px;
    }

    .applications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .application-card {
      border-radius: 16px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      border-left: 4px solid transparent;
    }

    .application-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .application-card.status-draft {
      border-left-color: #f39c12;
    }

    .application-card.status-returned {
      border-left-color: #e74c3c;
    }

    .application-card.status-submitted {
      border-left-color: #3498db;
    }

    .application-card.status-completed {
      border-left-color: #27ae60;
    }

    .card-header {
      padding: 20px 20px 16px 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }

    .application-info {
      flex: 1;
    }

    .application-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 4px 0;
      line-height: 1.3;
    }

    .application-service {
      font-size: 14px;
      color: #7f8c8d;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-chip {
      font-size: 12px;
      font-weight: 600;
      height: 28px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status-chip.status-draft {
      background: rgba(243, 156, 18, 0.1);
      color: #f39c12;
    }

    .status-chip.status-returned {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }

    .status-chip.status-submitted {
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
    }

    .status-chip.status-completed {
      background: rgba(39, 174, 96, 0.1);
      color: #27ae60;
    }

    .status-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .card-content {
      padding: 20px;
    }

    .application-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .detail-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #7f8c8d;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-label {
      font-size: 12px;
      color: #95a5a6;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 14px;
      color: #2c3e50;
      font-weight: 500;
    }

    .progress-section {
      margin-top: 16px;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: #ecf0f1;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .progress-label {
      font-size: 12px;
      color: #7f8c8d;
      font-weight: 500;
    }

    .card-actions {
      padding: 16px 20px 20px 20px;
      background: #fafbfc;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .primary-action {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      font-weight: 600;
      height: 36px;
      border-radius: 18px;
    }

    .primary-action mat-icon {
      margin-right: 6px;
      font-size: 18px;
    }

    .delete-action {
      color: #e74c3c;
    }

    .delete-action mat-icon {
      color: #e74c3c;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .applications-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .application-card {
        margin: 0 8px;
      }

      .card-header {
        padding: 16px;
      }

      .card-content {
        padding: 16px;
      }

      .card-actions {
        padding: 12px 16px 16px 16px;
        flex-direction: column;
        gap: 8px;
      }

      .card-actions button {
        width: 100%;
      }
    }

    /* Menu styling */
    ::ng-deep .mat-mdc-menu-panel {
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }

    ::ng-deep .mat-mdc-menu-item {
      height: 48px;
      font-size: 14px;
    }

    ::ng-deep .mat-mdc-menu-item mat-icon {
      margin-right: 12px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class ApplicationsListComponent {
  @Input() applications: Application[] = [];
  @Input() loading = false;
  @Input() status!: ApplicationStatus;

  @Output() onView = new EventEmitter<Application>();
  @Output() onEdit = new EventEmitter<Application>();
  @Output() onDelete = new EventEmitter<Application>();
  @Output() onContinue = new EventEmitter<Application>();
  @Output() onResubmit = new EventEmitter<Application>();
  @Output() onTrack = new EventEmitter<Application>();
  @Output() onDownload = new EventEmitter<Application>();

  trackByFn(index: number, item: Application): any {
    return item.id;
  }

  onNewApplication(): void {
    // Navigate to services page or emit event
    console.log('Navigate to new application');
  }

  getEmptyStateIcon(): string {
    switch (this.status) {
      case 'draft': return 'edit_note';
      case 'returned': return 'assignment_return';
      case 'submitted': return 'send';
      case 'completed': return 'task_alt';
      default: return 'folder_open';
    }
  }

  getEmptyStateTitle(): string {
    switch (this.status) {
      case 'draft': return 'No Draft Applications';
      case 'returned': return 'No Returned Applications';
      case 'submitted': return 'No Submitted Applications';
      case 'completed': return 'No Completed Applications';
      default: return 'No Applications';
    }
  }

  getEmptyStateSubtitle(): string {
    switch (this.status) {
      case 'draft': return 'You don\'t have any draft applications. Start a new application to see it here.';
      case 'returned': return 'You don\'t have any returned applications. Applications that need revision will appear here.';
      case 'submitted': return 'You don\'t have any submitted applications. Applications under review will appear here.';
      case 'completed': return 'You don\'t have any completed applications. Finished applications will appear here.';
      default: return 'You don\'t have any applications yet.';
    }
  }

  getStatusIcon(status: ApplicationStatus): string {
    switch (status) {
      case 'draft': return 'edit';
      case 'returned': return 'undo';
      case 'submitted': return 'send';
      case 'completed': return 'check_circle';
      default: return 'help';
    }
  }

  getStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case 'draft': return 'Draft';
      case 'returned': return 'Returned';
      case 'submitted': return 'Submitted';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  }

  showProgress(status: ApplicationStatus): boolean {
    return status === 'submitted';
  }

  getProgressPercentage(status: ApplicationStatus): number {
    switch (status) {
      case 'draft': return 25;
      case 'submitted': return 75;
      case 'completed': return 100;
      case 'returned': return 50;
      default: return 0;
    }
  }

  getProgressLabel(status: ApplicationStatus): string {
    switch (status) {
      case 'draft': return 'In Progress';
      case 'submitted': return 'Under Review';
      case 'completed': return 'Completed';
      case 'returned': return 'Needs Attention';
      default: return '';
    }
  }

  getPrimaryAction(application: Application): void {
    switch (application.status) {
      case 'draft':
        this.onContinue.emit(application);
        break;
      case 'returned':
        this.onResubmit.emit(application);
        break;
      case 'submitted':
        this.onTrack.emit(application);
        break;
      case 'completed':
        this.onDownload.emit(application);
        break;
    }
  }

  getPrimaryActionLabel(status: ApplicationStatus): string {
    switch (status) {
      case 'draft': return 'Continue';
      case 'returned': return 'Resubmit';
      case 'submitted': return 'Track';
      case 'completed': return 'Download';
      default: return '';
    }
  }

  getPrimaryActionIcon(status: ApplicationStatus): string {
    switch (status) {
      case 'draft': return 'play_arrow';
      case 'returned': return 'send';
      case 'submitted': return 'track_changes';
      case 'completed': return 'download';
      default: return 'arrow_forward';
    }
  }

  // Permission checks
  canEdit(status: ApplicationStatus): boolean {
    return status === 'draft' || status === 'returned';
  }

  canContinue(status: ApplicationStatus): boolean {
    return status === 'draft';
  }

  canResubmit(status: ApplicationStatus): boolean {
    return status === 'returned';
  }

  canTrack(status: ApplicationStatus): boolean {
    return status === 'submitted';
  }

  canDownload(status: ApplicationStatus): boolean {
    return status === 'completed';
  }

  canDelete(status: ApplicationStatus): boolean {
    return status === 'draft';
  }
}
