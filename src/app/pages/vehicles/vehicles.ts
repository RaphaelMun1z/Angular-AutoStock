import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../services/vehicle.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import { VehicleResponseDTO, PagedResponse } from '../../shared/interfaces/models.interface';
import {
  formatCurrency,
  availabilityClass,
  availabilityLabel,
  vehicleStatusClass,
  vehicleStatusLabel,
  fuelLabel,
} from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Pagination } from '../../shared/components/pagination/pagination';
import { VehicleForm } from './vehicle-form/vehicle-form';
import { VehicleView } from "./vehicle-view/vehicle-view";

@Component({
  selector: 'app-vehicles',
  imports: [CommonModule, FormsModule, Pagination, VehicleForm, VehicleView],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vehicles implements OnInit {
  private svc = inject(VehicleService);
  private toast = inject(ToastService);
  private cache = inject(CacheService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  modalOpen = false;
  selectedVehicle: VehicleResponseDTO | null = null;
  
  viewModalOpen = false;
  viewVehicle: VehicleResponseDTO | null = null;

  items: VehicleResponseDTO[] = [];
  filtered: VehicleResponseDTO[] = [];
  
  searchQuery = '';
  typeFilter = '';
  page = 0;
  totalElements = 0;

  // Formatador de moeda sem depender de imports externos para evitar conflitos na IDE
  fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
  fmtMileage = (v: number) => (v != null ? `${Number(v).toLocaleString('pt-BR')} km` : '—');
  
  availClass = availabilityClass;
  availLabel = availabilityLabel;
  vehicleStatusClass = vehicleStatusClass;
  vehicleStatusLabel = vehicleStatusLabel;
  fuelLabel = fuelLabel;
  
  getYear = (d: string | number | undefined | null) => {
    if (!d) return '—';
    if (typeof d === 'number') return d;
    return String(d).substring(0, 4);
  };

  // NOVO: Configuração visual para os tipos de veículos (Ícones, Cores e Tradução)
  getTypeConfig = (type: string | undefined) => {
    const t = type || 'OTHER_VEHICLE_TYPE';
    const config: Record<string, { label: string, icon: string, bg: string, text: string }> = {
      'CAR': { label: 'Carro', icon: '🚗', bg: '#eff6ff', text: '#2563eb' },
      'MOTORCYCLE': { label: 'Moto', icon: '🏍️', bg: '#f0fdf4', text: '#16a34a' },
      'TRUCK': { label: 'Caminhão', icon: '🚚', bg: '#fef2f2', text: '#dc2626' },
      'VAN': { label: 'Van', icon: '🚐', bg: '#faf5ff', text: '#9333ea' },
      'BUS': { label: 'Ônibus', icon: '🚌', bg: '#fffbeb', text: '#d97706' },
      'BOAT': { label: 'Barco', icon: '🚤', bg: '#ecfeff', text: '#0891b2' },
      'OTHER_VEHICLE_TYPE': { label: 'Outros', icon: '🚜', bg: '#f3f4f6', text: '#4b5563' },
    };
    return config[t] || config['OTHER_VEHICLE_TYPE'];
  };

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
      const cached = this.cache.get<{ items: VehicleResponseDTO[]; total: number }>(key)!;
      this.items = cached.items;
      this.totalElements = cached.total;
      this.applyFilter();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (response) => {
        const r = response as unknown as PagedResponse<VehicleResponseDTO>;
        this.items = r._embedded?.['vehicleResponseDTOList'] ?? [];
        this.totalElements = r.page?.totalElements ?? 0;
        
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
    this.selectedVehicle = null;
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(v: VehicleResponseDTO): void {
    this.selectedVehicle = v;
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  openView(v: VehicleResponseDTO): void {
    this.viewVehicle = v;
    this.viewModalOpen = true;
    this.cdr.markForCheck();
  }

  onSaved(): void {
    this.modalOpen = false;
    this.cache.invalidate(this.cacheKey(this.page));
    this.load(this.page, true);
  }

  async delete(v: VehicleResponseDTO): Promise<void> {
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
