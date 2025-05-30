// src/app/components/service-flow/service-flow.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../services/api.service';
import {
  ServiceFlowResponse,
  ServiceFlowStep,
  ServiceFlowField,
  ServiceFlowCategory,
  LookupResponse,
  CaseSubmission,
  WizardState,
  evaluateVisibilityCondition
} from '../../models/interfaces';

@Component({
  selector: 'app-service-flow',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatDividerModule,
    MatExpansionModule,
    MatTooltipModule
  ],
  template: `
    <div class="service-flow-container">
      <!-- Header -->
      <div class="flow-header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1 class="flow-title">{{ currentStep?.name || 'Service Application' }}</h1>
            <p class="flow-subtitle" *ngIf="serviceId">Service ID: {{ serviceId }}</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <mat-progress-bar
            mode="determinate"
            [value]="getProgressPercentage()"
            class="main-progress">
          </mat-progress-bar>
          <div class="progress-text">
            Step {{ wizardState.currentStep + 1 }} of {{ wizardState.totalSteps }}
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="60"></mat-spinner>
        <p class="loading-text">Loading service flow...</p>
      </div>

      <!-- Error State -->
      <mat-card class="error-card" *ngIf="error && !isLoading">
        <mat-card-content>
          <div class="error-content">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <div class="error-details">
              <h3>Unable to Load Service Flow</h3>
              <p>{{ error }}</p>
              <div class="error-actions">
                <button mat-raised-button color="primary" (click)="loadServiceFlow()">
                  <mat-icon>refresh</mat-icon>
                  Try Again
                </button>
                <button mat-button (click)="goBack()">
                  <mat-icon>arrow_back</mat-icon>
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Wizard Steps -->
      <div class="wizard-container" *ngIf="!isLoading && !error && serviceFlowSteps.length > 0">
        <mat-stepper
          #stepper
          [selectedIndex]="wizardState.currentStep"
          orientation="vertical"
          class="service-stepper">

          <mat-step
            *ngFor="let step of visibleSteps; let i = index"
            [stepControl]="getStepForm(i)"
            [editable]="true"
            [optional]="false">

            <!-- Step Label -->
            <ng-template matStepLabel>
              <div class="step-label">
                <span class="step-title">{{ step.name }}</span>
                <mat-icon *ngIf="wizardState.completedSteps[i]" class="step-check">check_circle</mat-icon>
              </div>
            </ng-template>

            <!-- Step Content -->
            <div class="step-content">
              <!-- Step Description -->
              <div class="step-description" *ngIf="step.description">
                <mat-card class="description-card">
                  <mat-card-content>
                    <div [innerHTML]="formatDescription(step.description)"></div>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Form Categories -->
              <form [formGroup]="getStepForm(i)" class="step-form">
                <div class="categories-container">
                  <mat-expansion-panel
                    *ngFor="let category of step.categories; trackBy: trackByCategoryId"
                    [expanded]="true"
                    class="category-panel">

                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon class="category-icon">folder</mat-icon>
                        {{ category.name }}
                      </mat-panel-title>
                      <mat-panel-description *ngIf="category.name_ara">
                        {{ category.name_ara }}
                      </mat-panel-description>
                    </mat-expansion-panel-header>

                    <!-- Category Fields -->
                    <div class="category-content">
                      <div class="fields-grid">
                        <div
                          *ngFor="let field of getVisibleFields(category.fields, i); trackBy: trackByFieldId"
                          class="field-container"
                          [class]="'field-type-' + field.field_type">

                          <!-- Text Fields -->
                          <mat-form-field
                            *ngIf="isTextField(field)"
                            appearance="outline"
                            class="form-field">
                            <mat-label>{{ field.display_name }}</mat-label>
                            <input matInput
                                   [formControlName]="field.name"
                                   [placeholder]="field.display_name"
                                   [maxlength]="field.max_length"
                                   [minlength]="field.min_length"
                                   [pattern]="field.regex_pattern">
                            <mat-hint *ngIf="field.max_length">
                              {{ getStepForm(i).get(field.name)?.value?.length || 0 }}/{{ field.max_length }}
                            </mat-hint>
                            <mat-error *ngIf="getStepForm(i).get(field.name)?.hasError('required')">
                              {{ field.display_name }} is required
                            </mat-error>
                            <mat-error *ngIf="getStepForm(i).get(field.name)?.hasError('pattern')">
                              Invalid format
                            </mat-error>
                          </mat-form-field>

                          <!-- Number Fields -->
                          <mat-form-field
                            *ngIf="isNumberField(field)"
                            appearance="outline"
                            class="form-field">
                            <mat-label>{{ field.display_name }}</mat-label>
                            <input matInput
                                   type="number"
                                   [formControlName]="field.name"
                                   [placeholder]="field.display_name"
                                   [min]="field.value_greater_than"
                                   [max]="field.value_less_than"
                                   [step]="field.integer_only ? 1 : 0.01">
                            <mat-error *ngIf="getStepForm(i).get(field.name)?.hasError('required')">
                              {{ field.display_name }} is required
                            </mat-error>
                            <mat-error *ngIf="getStepForm(i).get(field.name)?.hasError('min')">
                              Value must be greater than {{ field.value_greater_than }}
                            </mat-error>
                            <mat-error *ngIf="getStepForm(i).get(field.name)?.hasError('max')">
                              Value must be less than {{ field.value_less_than }}
                            </mat-error>
                          </mat-form-field>

                          <!-- Boolean Fields -->
                          <div *ngIf="isBooleanField(field)" class="boolean-field">
                            <mat-checkbox [formControlName]="field.name" class="checkbox-field">
                              {{ field.display_name }}
                              <span *ngIf="field.mandatory" class="required-indicator">*</span>
                            </mat-checkbox>
                          </div>

                          <!-- Choice Fields -->
                          <mat-form-field
                            *ngIf="isChoiceField(field)"
                            appearance="outline"
                            class="form-field">
                            <mat-label>{{ field.display_name }}</mat-label>
                            <mat-select [formControlName]="field.name"
                                       [multiple]="isMultipleChoice(field)">
                              <mat-option
                                *ngFor="let option of getFieldOptions(field)"
                                [value]="option.id">
                                {{ option.name }}
                              </mat-option>
                            </mat-select>
                            <mat-error *ngIf="getStepForm(i).get(field.name)?.hasError('required')">
                              {{ field.display_name }} is required
                            </mat-error>
                          </mat-form-field>

                          <!-- File Fields -->
                          <div *ngIf="isFileField(field)" class="file-field">
                            <label class="file-label">
                              {{ field.display_name }}
                              <span *ngIf="field.mandatory" class="required-indicator">*</span>
                            </label>
                            <div class="file-input-container">
                              <input type="file"
                                     (change)="onFileSelected($event, field, i)"
                                     [accept]="getFileAcceptTypes(field)"
                                     class="file-input"
                                     #fileInput>
                              <button mat-stroked-button
                                      type="button"
                                      (click)="fileInput.click()"
                                      class="file-button">
                                <mat-icon>attach_file</mat-icon>
                                Choose File
                              </button>
                              <span class="file-name" *ngIf="getSelectedFileName(field, i)">
                                {{ getSelectedFileName(field, i) }}
                              </span>
                            </div>
                          </div>

                          <!-- Sub-fields (if any) -->
                          <div *ngIf="field.sub_fields && field.sub_fields.length > 0"
                               class="sub-fields">
                            <h4 class="sub-fields-title">{{ field.display_name }} Details</h4>
                            <!-- Recursive sub-fields would go here -->
                          </div>
                        </div>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </div>
              </form>

              <!-- Step Actions -->
              <div class="step-actions">
                <button mat-button
                        (click)="previousStep()"
                        [disabled]="wizardState.currentStep === 0"
                        class="prev-btn">
                  <mat-icon>navigate_before</mat-icon>
                  Previous
                </button>

                <div class="action-spacer"></div>

                <button mat-button
                        (click)="saveDraft()"
                        [disabled]="isSubmitting"
                        class="draft-btn">
                  <mat-icon>save</mat-icon>
                  Save Draft
                </button>

                <button mat-raised-button
                        color="primary"
                        (click)="nextStep()"
                        [disabled]="!isCurrentStepValid() || isSubmitting"
                        class="next-btn">
                  <mat-spinner diameter="20" *ngIf="isSubmitting && isLastStep()"></mat-spinner>
                  <mat-icon *ngIf="!isSubmitting">
                    {{ isLastStep() ? 'send' : 'navigate_next' }}
                  </mat-icon>
                  {{ isLastStep() ? 'Submit Application' : 'Next' }}
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      </div>

      <!-- Wizard Summary (last step) -->
      <mat-card class="summary-card" *ngIf="showSummary">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="summary-icon">assignment_turned_in</mat-icon>
            Application Summary
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="summary-content">
            <p>Please review your application before submitting:</p>
            <!-- Summary content would go here -->
            <div class="final-actions">
              <button mat-button (click)="editApplication()">
                <mat-icon>edit</mat-icon>
                Edit Application
              </button>
              <button mat-raised-button
                      color="primary"
                      (click)="submitApplication()"
                      [disabled]="isSubmitting">
                <mat-spinner diameter="20" *ngIf="isSubmitting"></mat-spinner>
                <mat-icon *ngIf="!isSubmitting">send</mat-icon>
                Submit Application
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .service-flow-container {
      min-height: 100vh;
      background: #f5f7fa;
    }

    .flow-header {
      background: white;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .back-btn {
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
      width: 48px;
      height: 48px;
    }

    .back-btn:hover {
      background: rgba(52, 152, 219, 0.2);
    }

    .header-info {
      flex: 1;
    }

    .flow-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
    }

    .flow-subtitle {
      margin: 4px 0 0 0;
      color: #7f8c8d;
      font-size: 14px;
    }

    .progress-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .main-progress {
      flex: 1;
      height: 8px;
      border-radius: 4px;
    }

    .progress-text {
      font-size: 14px;
      color: #7f8c8d;
      font-weight: 500;
      min-width: 120px;
      text-align: right;
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
    }

    .error-card {
      margin: 40px auto;
      max-width: 600px;
      border-radius: 16px;
    }

    .error-content {
      display: flex;
      align-items: flex-start;
      gap: 20px;
    }

    .error-icon {
      font-size: 48px;
      color: #e74c3c;
      flex-shrink: 0;
    }

    .error-details h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .error-details p {
      margin: 0 0 16px 0;
      color: #7f8c8d;
    }

    .error-actions {
      display: flex;
      gap: 12px;
    }

    .wizard-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
    }

    .service-stepper {
      background: transparent;
    }

    .step-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-title {
      font-weight: 600;
    }

    .step-check {
      color: #27ae60;
      font-size: 20px;
    }

    .step-content {
      padding: 24px 0;
    }

    .step-description {
      margin-bottom: 24px;
    }

    .description-card {
      background: #e8f4fd;
      border-left: 4px solid #3498db;
    }

    .categories-container {
      margin-bottom: 32px;
    }

    .category-panel {
      margin-bottom: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .category-icon {
      margin-right: 8px;
      color: #9b59b6;
    }

    .category-content {
      padding: 16px 0;
    }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .field-container {
      width: 100%;
    }

    .form-field {
      width: 100%;
    }

    .boolean-field {
      margin: 16px 0;
    }

    .checkbox-field {
      font-size: 16px;
    }

    .required-indicator {
      color: #e74c3c;
      margin-left: 4px;
    }

    .file-field {
      margin: 16px 0;
    }

    .file-label {
      display: block;
      font-size: 16px;
      font-weight: 500;
      color: #555;
      margin-bottom: 8px;
    }

    .file-input-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-input {
      display: none;
    }

    .file-button {
      min-width: 140px;
      height: 40px;
      border: 2px dashed #bdc3c7;
      border-radius: 8px;
    }

    .file-button:hover {
      border-color: #3498db;
      background: rgba(52, 152, 219, 0.05);
    }

    .file-name {
      font-size: 14px;
      color: #27ae60;
      font-weight: 500;
    }

    .sub-fields {
      margin-top: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #f39c12;
    }

    .sub-fields-title {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #2c3e50;
    }

    .step-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 0;
      border-top: 1px solid #e0e0e0;
      margin-top: 24px;
    }

    .action-spacer {
      flex: 1;
    }

    .prev-btn {
      color: #7f8c8d;
      min-width: 100px;
    }

    .draft-btn {
      color: #f39c12;
      border: 1px solid #f39c12;
      min-width: 120px;
    }

    .next-btn {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      font-weight: 600;
      min-width: 140px;
      height: 44px;
    }

    .summary-card {
      margin: 24px auto;
      max-width: 800px;
      border-radius: 16px;
    }

    .summary-icon {
      color: #27ae60;
      margin-right: 8px;
    }

    .summary-content {
      text-align: center;
      padding: 24px;
    }

    .final-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 24px;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .wizard-container {
        padding: 16px;
      }

      .fields-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .step-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .step-actions button {
        width: 100%;
      }

      .action-spacer {
        display: none;
      }

      .final-actions {
        flex-direction: column;
      }

      .final-actions button {
        width: 100%;
      }
    }

    /* Stepper customization */
    ::ng-deep .mat-stepper-vertical {
      .mat-step-header {
        padding: 16px 24px;
        border-radius: 12px;
        margin-bottom: 8px;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .mat-step-content {
        margin-left: 0;
        border: none;
        border-radius: 12px;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 16px;
        padding: 0 24px;
      }

      .mat-step-icon {
        background: #3498db;
        color: white;
      }

      .mat-step-icon-selected {
        background: #27ae60;
      }

      .mat-step-icon-state-done {
        background: #27ae60;
      }
    }
  `]
})
export class ServiceFlowComponent implements OnInit, OnDestroy {
  serviceId: string = '';
  serviceFlowSteps: ServiceFlowStep[] = [];
  stepForms: FormGroup[] = [];
  lookupOptions: { [key: string]: any[] } = {};
  fileSelections: { [key: string]: File } = {};

  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  showSummary = false;

  wizardState: WizardState = {
    currentStep: 0,
    totalSteps: 0,
    formData: {},
    completedSteps: [],
    isValid: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.serviceId = params['serviceId'];
      if (this.serviceId) {
        this.loadServiceFlow();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadServiceFlow(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.getServiceFlow(this.serviceId).subscribe({
      next: (response: ServiceFlowResponse) => {
        this.serviceFlowSteps = response.service_flow || [];
        this.initializeWizard();
        this.isLoading = false;
        console.log('✅ Service flow loaded:', this.serviceFlowSteps);
      },
      error: (error) => {
        console.error('❌ Error loading service flow:', error);
        this.error = error.message || 'Failed to load service flow';
        this.isLoading = false;
      }
    });
  }

  initializeWizard(): void {
    // Filter out hidden steps and sort by sequence
    const visibleSteps = this.serviceFlowSteps
      .filter(step => !step.is_hidden_page)
      .sort((a, b) => parseInt(a.sequence_number) - parseInt(b.sequence_number));

    this.serviceFlowSteps = visibleSteps;
    this.wizardState.totalSteps = visibleSteps.length;
    this.wizardState.completedSteps = new Array(visibleSteps.length).fill(false);

    // Initialize forms for each step
    this.stepForms = [];
    this.serviceFlowSteps.forEach((step, index) => {
      const form = this.createStepForm(step);
      this.stepForms.push(form);

      // Load lookup options for choice fields
      this.loadLookupOptionsForStep(step);
    });
  }

  createStepForm(step: ServiceFlowStep): FormGroup {
    const formControls: { [key: string]: any } = {};

    step.categories.forEach(category => {
      category.fields.forEach(field => {
        const validators = [];

        if (field.mandatory) {
          validators.push(Validators.required);
        }

        if (field.min_length) {
          validators.push(Validators.minLength(field.min_length));
        }

        if (field.max_length) {
          validators.push(Validators.maxLength(field.max_length));
        }

        if (field.regex_pattern) {
          validators.push(Validators.pattern(field.regex_pattern));
        }

        if (field.value_greater_than !== undefined) {
          validators.push(Validators.min(field.value_greater_than + 0.01));
        }

        if (field.value_less_than !== undefined) {
          validators.push(Validators.max(field.value_less_than - 0.01));
        }

        let defaultValue = this.getDefaultValue(field);
        formControls[field.name] = [defaultValue, validators];
      });
    });

    return this.fb.group(formControls);
  }

  getDefaultValue(field: ServiceFlowField): any {
    switch (field.field_type) {
      case 'boolean':
        return field.default_boolean || false;
      case 'number':
      case 'decimal':
        return null;
      case 'choice':
        return field.max_selections === 1 ? null : [];
      default:
        return '';
    }
  }

  loadLookupOptionsForStep(step: ServiceFlowStep): void {
    step.categories.forEach(category => {
      category.fields.forEach(field => {
        if (field.field_type === 'choice' && field.lookup) {
          this.loadLookupOptions(field.lookup, field.name);
        }
      });
    });
  }

  loadLookupOptions(lookupId: number, fieldName: string): void {
    this.apiService.getLookupOptions(lookupId).subscribe({
      next: (response: LookupResponse) => {
        this.lookupOptions[fieldName] = response.results || [];
      },
      error: (error) => {
        console.error(`Error loading lookup options for ${fieldName}:`, error);
        this.lookupOptions[fieldName] = [];
      }
    });
  }

  // Utility methods
  get visibleSteps(): ServiceFlowStep[] {
    return this.serviceFlowSteps.filter(step => !step.is_hidden_page);
  }

  get currentStep(): ServiceFlowStep | null {
    return this.visibleSteps[this.wizardState.currentStep] || null;
  }

  getStepForm(stepIndex: number): FormGroup {
    return this.stepForms[stepIndex] || this.fb.group({});
  }

  getProgressPercentage(): number {
    return this.wizardState.totalSteps > 0
      ? ((this.wizardState.currentStep + 1) / this.wizardState.totalSteps) * 100
      : 0;
  }

  isCurrentStepValid(): boolean {
    const currentForm = this.getStepForm(this.wizardState.currentStep);
    return currentForm.valid;
  }

  isLastStep(): boolean {
    return this.wizardState.currentStep === this.wizardState.totalSteps - 1;
  }

  formatDescription(description: string): string {
    return description.replace(/\n/g, '<br>');
  }

  // Field type checking methods
  isTextField(field: ServiceFlowField): boolean {
    return field.field_type === 'text';
  }

  isNumberField(field: ServiceFlowField): boolean {
    return field.field_type === 'number' || field.field_type === 'decimal' || field.field_type === 'percentage';
  }

  isBooleanField(field: ServiceFlowField): boolean {
    return field.field_type === 'boolean';
  }

  isChoiceField(field: ServiceFlowField): boolean {
    return field.field_type === 'choice';
  }

  isFileField(field: ServiceFlowField): boolean {
    return field.field_type === 'file';
  }

  isMultipleChoice(field: ServiceFlowField): boolean {
    return field.max_selections !== 1;
  }

  getVisibleFields(fields: ServiceFlowField[], stepIndex: number): ServiceFlowField[] {
    const stepForm = this.getStepForm(stepIndex);
    if (!stepForm) return fields;

    return fields.filter(field => {
      if (field.is_hidden) return false;

      if (field.visibility_conditions && field.visibility_conditions.length > 0) {
        return field.visibility_conditions.some(condition =>
          evaluateVisibilityCondition(condition, stepForm.value)
        );
      }

      return true;
    });
  }

  getFieldOptions(field: ServiceFlowField): any[] {
    if (field.allowed_lookups && field.allowed_lookups.length > 0) {
      return field.allowed_lookups;
    }
    return this.lookupOptions[field.name] || [];
  }

  getFileAcceptTypes(field: ServiceFlowField): string {
    return field.file_types || '*/*';
  }

  getSelectedFileName(field: ServiceFlowField, stepIndex: number): string {
    const file = this.fileSelections[`${stepIndex}_${field.name}`];
    return file ? file.name : '';
  }

  onFileSelected(event: any, field: ServiceFlowField, stepIndex: number): void {
    const file = event.target.files[0];
    if (file) {
      this.fileSelections[`${stepIndex}_${field.name}`] = file;

      // Update form control
      const form = this.getStepForm(stepIndex);
      form.get(field.name)?.setValue(file.name);
    }
  }

  // Navigation methods
  nextStep(): void {
    if (this.isLastStep()) {
      this.submitApplication();
    } else {
      this.wizardState.completedSteps[this.wizardState.currentStep] = true;
      this.wizardState.currentStep++;
    }
  }

  previousStep(): void {
    if (this.wizardState.currentStep > 0) {
      this.wizardState.currentStep--;
    }
  }

  goBack(): void {
    this.router.navigate(['/services']);
  }

  // Form submission methods
  saveDraft(): void {
    this.collectFormData();
    console.log('Saving draft...', this.wizardState.formData);
    this.snackBar.open('Draft saved successfully', 'Close', { duration: 3000 });
  }

  submitApplication(): void {
    this.isSubmitting = true;
    this.collectFormData();

    const caseData: CaseSubmission = {
      applicant_type: 13, // This should come from the form or be configured
      case_type: parseInt(this.serviceId),
      case_data: this.wizardState.formData,
      file_types: this.getFileTypes()
    };

    // Add files to case data
    Object.keys(this.fileSelections).forEach(key => {
      const [stepIndex, fieldName] = key.split('_');
      caseData.case_data[fieldName] = this.fileSelections[key];
    });

    this.apiService.submitCase(caseData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.snackBar.open('Application submitted successfully!', 'Close', { duration: 5000 });
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting application:', error);
        this.snackBar.open('Failed to submit application. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }

  collectFormData(): void {
    this.wizardState.formData = {};

    this.stepForms.forEach((form, index) => {
      Object.assign(this.wizardState.formData, form.value);
    });
  }

  getFileTypes(): string[] {
    const fileTypes: string[] = [];
    Object.keys(this.fileSelections).forEach(key => {
      const [stepIndex, fieldName] = key.split('_');
      // This would map field names to file type codes
      fileTypes.push('01'); // Placeholder file type code
    });
    return fileTypes;
  }

  editApplication(): void {
    this.showSummary = false;
    this.wizardState.currentStep = 0;
  }

  // Track by methods for ngFor
  trackByCategoryId(index: number, category: ServiceFlowCategory): number {
    return category.id;
  }

  trackByFieldId(index: number, field: ServiceFlowField): number {
    return field.field_id;
  }
}
