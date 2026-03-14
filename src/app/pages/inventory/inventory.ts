import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { InventoryService, VehicleService } from '../../services/business.service';
import { ToastService } from '../../core/services/toast.service';
import { formatCurrency, formatDate } from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Modal, Pagination],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inventory implements OnInit {
  private svc    = inject(InventoryService);
  private vehSvc = inject(VehicleService);
  private toast  = inject(ToastService);
  private fb     = inject(FormBuilder);
  private cdr    = inject(ChangeDetectorRef);

  loading = true;
  modalOpen = false;
  items: any[] = [];
  filtered: any[] = [];
  vehicles: any[] = [];
  page = 0;
  totalElements = 0;
  searchQuery = '';
  salePreview = '—';

  fmtCurrency = formatCurrency;
  fmtDate     = formatDate;

  calcSalePrice = (i: any) => {
    const acq = i.acquisitionPrice ?? 0;
    const m   = i.profitMargin ?? 0;
    return m > 0 ? formatCurrency(acq * (1 + m / 100)) : '—';
  };

  form = this.fb.group({
    vehicleId:        [''],
    licensePlate:     [''],
    chassis:          [''],
    supplier:         [''],
    acquisitionPrice: [0],
    profitMargin:     [0],
    stockEntryDate:   [''],
    stockExitDate:    [''],
  });

  ngOnInit(): void {
    this.load();
    this.loadVehicles();
  }

  load(page = 0): void {
    this.loading = true;
    this.page = page;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r) => {
        this.items         = (r as any)?._embedded?.inventoryItemResponseDTOList ?? [];
        this.totalElements = (r as any)?.page?.totalElements ?? 0;
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

  loadVehicles(): void {
    this.vehSvc.getAll(0, 200).subscribe((r) => {
      this.vehicles = (r as any)?._embedded?.vehicleResponseDTOList ?? [];
      this.cdr.markForCheck();
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = !q
      ? [...this.items]
      : this.items.filter((i) =>
          `${i.vehicle?.brand} ${i.vehicle?.model} ${i.licensePlate} ${i.chassis}`
            .toLowerCase()
            .includes(q),
        );
  }

  onSearch(): void {
    this.applyFilter();
    this.cdr.markForCheck();
  }

  calcPreview(): void {
    const acq = this.form.value.acquisitionPrice ?? 0;
    const m   = this.form.value.profitMargin ?? 0;
    this.salePreview = m > 0 ? formatCurrency(acq * (1 + m / 100)) : '—';
    this.cdr.markForCheck();
  }

  openNew(): void {
    this.form.reset({
      vehicleId: '', licensePlate: '', chassis: '', supplier: '',
      acquisitionPrice: 0, profitMargin: 0, stockEntryDate: '', stockExitDate: '',
    });
    this.salePreview = '—';
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  save(): void {
    const v    = this.form.value;
    const body = {
      vehicle:          { id: v.vehicleId },
      licensePlate:     v.licensePlate,
      chassis:          v.chassis,
      supplier:         v.supplier,
      acquisitionPrice: v.acquisitionPrice,
      profitMargin:     v.profitMargin,
      stockEntryDate:   v.stockEntryDate || null,
      stockExitDate:    v.stockExitDate  || null,
    };
    this.svc.create(body as any).subscribe({
      next: () => {
        this.toast.success('Item adicionado!');
        this.modalOpen = false;
        this.load(this.page);
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro');
        this.cdr.markForCheck();
      },
    });
  }

  async delete(i: any): Promise<void> {
    const r = await Swal.fire({
      title: 'Remover do estoque?', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(i.id).subscribe({
      next: () => { this.toast.success('Removido!'); this.load(this.page); },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }
}