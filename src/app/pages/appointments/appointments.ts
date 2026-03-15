import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { AppointmentService, CustomerService, SellerService } from '../../services/business.service';
import { CacheService } from '../../services/cache.service';
import { formatDate, aptTypeClass, aptTypeLabel, aptStatusClass, aptStatusLabel } from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';

@Component({
  selector: 'app-appointments',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Modal, Pagination],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Appointments implements OnInit {
  private svc     = inject(AppointmentService);
  private custSvc = inject(CustomerService);
  private selSvc  = inject(SellerService);
  private toast   = inject(ToastService);
  private cache   = inject(CacheService);
  private fb      = inject(FormBuilder);
  private cdr     = inject(ChangeDetectorRef);

  loading       = false;
  modalOpen     = false;
  items:     any[] = [];
  customers: any[] = [];
  sellers:   any[] = [];
  page          = 0;
  totalElements = 0;

  fmtDate        = formatDate;
  aptTypeClass   = aptTypeClass;
  aptTypeLabel   = aptTypeLabel;
  aptStatusClass = aptStatusClass;
  aptStatusLabel = aptStatusLabel;

  form = this.fb.group({
    customerId:        ['', Validators.required],
    sellerId:          ['', Validators.required],
    date:              ['', Validators.required],
    appointmentType:   ['TEST_DRIVE', Validators.required],
    appointmentStatus: ['PENDING'],
  });

  ngOnInit(): void { this.load(); }

  private cacheKey(page: number): string {
    return `appointments_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: any[]; total: number }>(key)!;
      this.items         = cached.items;
      this.totalElements = cached.total;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r) => {
        this.items         = (r as any)?._embedded?.appointmentResponseDTOList ?? [];
        this.totalElements = (r as any)?.page?.totalElements ?? 0;
        this.cache.set(key, { items: this.items, total: this.totalElements });
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

  openNew(): void {
    // Reutiliza caches compartilhados de clientes e vendedores
    const custKey = 'customers_all';
    const selKey  = 'sellers_all';

    if (this.cache.has(custKey)) {
      this.customers = this.cache.get<any[]>(custKey)!;
    } else {
      this.custSvc.getAll(0, 200).pipe(catchError(() => of(null))).subscribe(r => {
        this.customers = (r as any)?._embedded?.customerResponseDTOList ?? [];
        this.cache.set(custKey, this.customers);
        this.cdr.markForCheck();
      });
    }

    if (this.cache.has(selKey)) {
      this.sellers = this.cache.get<any[]>(selKey)!;
    } else {
      this.selSvc.getAll(0, 200).pipe(catchError(() => of(null))).subscribe(r => {
        this.sellers = (r as any)?._embedded?.sellerResponseDTOList ?? [];
        this.cache.set(selKey, this.sellers);
        this.cdr.markForCheck();
      });
    }

    this.form.reset({ appointmentType: 'TEST_DRIVE', appointmentStatus: 'PENDING' });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  updateStatus(a: any, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    // Invalida cache da página para refletir mudança de status
    this.cache.invalidate(this.cacheKey(this.page));
    this.svc.update(a.id, { appointmentStatus: status } as any).subscribe({
      next: () => this.toast.info('Status atualizado!'),
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v    = this.form.value;
    const body = {
      date:              v.date,
      appointmentType:   v.appointmentType,
      appointmentStatus: v.appointmentStatus,
      customer:          { id: v.customerId },
      seller:            { id: v.sellerId },
    };
    this.svc.create(body as any).subscribe({
      next: () => {
        this.toast.success('Agendamento criado!');
        this.modalOpen = false;
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro');
        this.cdr.markForCheck();
      },
    });
  }

  async delete(a: any): Promise<void> {
    const r = await Swal.fire({
      title: 'Excluir agendamento?', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(a.id).subscribe({
      next: () => {
        this.toast.success('Agendamento excluído!');
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }

  private invalidateAllPages(): void {
    for (let i = 0; i <= Math.ceil(this.totalElements / 12); i++) {
      this.cache.invalidate(this.cacheKey(i));
    }
  }
}