import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { VehicleService } from '../../services/business.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import { Vehicle } from '../../shared/interfaces/models.interface';
import {
  formatCurrency,
  availabilityClass,
  availabilityLabel,
  vehicleStatusClass,
  vehicleStatusLabel,
  fuelLabel,
} from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';

@Component({
  selector: 'app-vehicles',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Modal, Pagination],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vehicles implements OnInit {
  private svc = inject(VehicleService);
  private toast = inject(ToastService);
  private cache = inject(CacheService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  saving = false;
  modalOpen = false;
  items: Vehicle[] = [];
  filtered: Vehicle[] = [];
  editId = '';
  searchQuery = '';
  typeFilter = '';
  page = 0;
  totalElements = 0;

  fmtCurrency = formatCurrency;
  fmtMileage = (v: number) => (v != null ? `${Number(v).toLocaleString('pt-BR')} km` : '—');
  availClass = availabilityClass;
  availLabel = availabilityLabel;
  vehicleStatusClass = vehicleStatusClass;
  vehicleStatusLabel = vehicleStatusLabel;
  fuelLabel = fuelLabel;
  getYear = (d: string) => (d ? new Date(d).getFullYear() : '—');

  form = this.fb.group({
    brand: ['', Validators.required],
    model: ['', Validators.required],
    type: ['CAR', Validators.required],
    category: ['SEDAN', Validators.required],
    manufactureYear: ['', Validators.required],
    color: ['', Validators.required],
    mileage: [0],
    weight: [0],
    fuelType: ['GASOLINE', Validators.required],
    numberOfCylinders: [4],
    enginePower: [0],
    fuelTankCapacity: [0],
    passengerCapacity: [5],
    salePrice: [0, Validators.required],
    status: ['NEW'],
    availability: ['AVAILABLE'],
    infotainmentSystem: ['', Validators.required],
    description: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private cacheKey(page: number): string {
    return `vehicles_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: Vehicle[]; total: number }>(key)!;
      this.items = cached.items;
      this.totalElements = cached.total;
      this.applyFilter();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r) => {
        this.items = (r as any)?._embedded?.vehicleResponseDTOList ?? [];
        this.totalElements = (r as any)?.page?.totalElements ?? 0;
        this.cache.set(key, { items: this.items, total: this.totalElements });
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  refresh(): void {
    this.cache.invalidate(this.cacheKey(this.page));
    this.load(this.page, true);
  }

  onSearch(): void {
    this.applyFilter();
    this.cdr.markForCheck();
  }

  applyFilter(): void {
    this.filtered = this.items.filter((v) => {
      const q = this.searchQuery.toLowerCase();
      const matchQ = !q || `${v.brand} ${v.model} ${v.color}`.toLowerCase().includes(q);
      const matchT = !this.typeFilter || v.type === this.typeFilter;
      return matchQ && matchT;
    });
  }

  onPage(p: number): void {
    this.load(p);
  }

  openNew(): void {
    this.editId = '';
    this.form.reset({
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
    });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(v: Vehicle): void {
    this.editId = v.id ?? '';
    this.form.patchValue({ ...v });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();

    const body = this.form.value as Vehicle;
    const req = this.editId ? this.svc.update(this.editId, body) : this.svc.create(body);

    req.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Veículo atualizado!' : 'Veículo cadastrado!');
        this.modalOpen = false;
        this.saving = false;
        this.cache.invalidate(this.cacheKey(this.page));
        this.load(this.page, true);
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro ao salvar');
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }

  async delete(v: Vehicle): Promise<void> {
    const r = await Swal.fire({
      title: `Excluir ${v.brand} ${v.model}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;

    this.svc.delete(v.id!).subscribe({
      next: () => {
        this.toast.success('Veículo excluído!');
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => this.toast.error(e?.message ?? 'Erro ao excluir'),
    });
  }

  private invalidateAllPages(): void {
    for (let i = 0; i <= Math.ceil(this.totalElements / 12); i++) {
      this.cache.invalidate(this.cacheKey(i));
    }
  }
}
