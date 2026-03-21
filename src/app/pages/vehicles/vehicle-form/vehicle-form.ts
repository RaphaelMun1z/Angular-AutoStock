import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { VehicleService } from '../../../services/vehicle.service';
import { Modal } from '../../../shared/components/modal/modal';
import {
  VehicleResponseDTO,
  Vehicle,
  BranchResponseDTO,
  PagedResponse,
} from '../../../shared/interfaces/models.interface';
import { catchError, of } from 'rxjs';
import { BranchService } from '../../../services/branch.service';

@Component({
  selector: 'app-vehicle-form',
  imports: [CommonModule, ReactiveFormsModule, Modal],
  templateUrl: './vehicle-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleForm implements OnChanges, OnInit {
  @Input() isOpen = false;
  @Input() vehicle: VehicleResponseDTO | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private svc = inject(VehicleService);
  private branchSvc = inject(BranchService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  saving = false;
  modalStep = 1;
  maxSteps = 4;

  branches: BranchResponseDTO[] = [];

  form = this.fb.group({
    branchId: ['', Validators.required],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    type: ['CAR', Validators.required],
    category: ['SEDAN', Validators.required],
    manufactureYear: [
      null as number | null,
      [Validators.required, Validators.min(1900), Validators.max(2100)],
    ],
    color: ['', Validators.required],
    mileage: [0, [Validators.required, Validators.min(0)]],
    weight: [0, [Validators.required, Validators.min(1)]],
    fuelType: ['GASOLINE', Validators.required],
    numberOfCylinders: [4, Validators.required],
    enginePower: [0, Validators.required],
    fuelTankCapacity: [0, Validators.required],
    passengerCapacity: [5, Validators.required],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    status: ['NEW'],
    availability: ['AVAILABLE'],
    infotainmentSystem: ['', Validators.required],
    description: ['', Validators.required],

    transmissionType: [''],
    brakeType: [''],
    groundClearance: [null as number | null],
    autonomyRoad: [null as number | null],
    autonomyCity: [null as number | null],
    numberOfGears: [null as number | null],
    steeringType: [''],
    tireSize: [null as number | null],

    doors: [null as number | null],
    trunkCapacity: [null as number | null],
    driveType: [''],
    hasLuggageCarrier: [false],
    isCargo: [false],
    cargoVolume: [null as number | null],
    loadCapacity: [null as number | null],
    axles: [null as number | null],
    numberOfSeats: [null as number | null],
    hasAccessibility: [false],
    length: [null as number | null],
    hullMaterial: [''],
    autonomy: [null as number | null],
    usage: [''],
  });

  ngOnInit(): void {
    this.branchSvc
      .getAll(0, 100)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res) {
          const r = res as unknown as PagedResponse<BranchResponseDTO>;
          this.branches = r._embedded?.['branchResponseDTOList'] ?? [];
          this.cdr.markForCheck();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      if (this.vehicle) {
        this.modalStep = 2;
        const formVals = { ...this.vehicle } as any;

        if (typeof formVals.manufactureYear === 'string') {
          formVals.manufactureYear = parseInt(
            (formVals.manufactureYear as string).substring(0, 4),
            10,
          );
        }

        if (formVals.branch && formVals.branch.id) {
          formVals.branchId = formVals.branch.id;
        }

        this.form.patchValue(formVals);
      } else {
        this.modalStep = 1;
        this.form.reset({
          branchId: '',
          type: 'CAR',
          category: 'SEDAN',
          fuelType: 'GASOLINE',
          status: 'NEW',
          availability: 'AVAILABLE',
          mileage: 0,
          weight: 0,
          numberOfCylinders: 4,
          enginePower: 0,
          fuelTankCapacity: 0,
          passengerCapacity: 5,
          salePrice: 0,
          hasLuggageCarrier: false,
          isCargo: false,
          hasAccessibility: false,
        });
      }

      this.cdr.markForCheck();
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  selectType(type: string): void {
    this.form.patchValue({ type });
    this.nextStep();
  }

  nextStep(): void {
    if (this.modalStep < this.maxSteps) {
      this.modalStep++;
      this.cdr.markForCheck();
    }
  }

  prevStep(): void {
    if (this.modalStep > 1) {
      this.modalStep--;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.closed.emit();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Preencha os campos obrigatórios destacados em vermelho.');
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const formValue = this.form.value;
    const body: any = { ...formValue };

    if (body.manufactureYear) {
      body.manufactureYear = `${body.manufactureYear}-01-01`;
    }

    const req = this.vehicle?.id
      ? this.svc.update(this.vehicle.id, body)
      : this.svc.create(body as Vehicle);

    req.subscribe({
      next: () => {
        this.toast.success(this.vehicle?.id ? 'Veículo atualizado!' : 'Veículo cadastrado!');
        this.saving = false;
        this.saved.emit();
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro ao salvar');
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }
}
