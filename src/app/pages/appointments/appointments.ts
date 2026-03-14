import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { AppointmentService, CustomerService, SellerService } from '../../services/business.service';
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
  private fb      = inject(FormBuilder);
  private cdr     = inject(ChangeDetectorRef);

  loading       = true;
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

  load(page = 0): void {
    this.loading = true;
    this.page = page;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r) => {
        this.items         = (r as any)?._embedded?.appointmentResponseDTOList ?? [];
        this.totalElements = (r as any)?.page?.totalElements ?? 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openNew(): void {
    forkJoin({
      c: this.custSvc.getAll(0, 200).pipe(catchError(() => of(null))),
      s: this.selSvc.getAll(0, 200).pipe(catchError(() => of(null))),
    }).subscribe((res) => {
      this.customers = (res.c as any)?._embedded?.customerResponseDTOList ?? [];
      this.sellers   = (res.s as any)?._embedded?.sellerResponseDTOList   ?? [];
      this.cdr.markForCheck();
    });

    this.form.reset({ appointmentType: 'TEST_DRIVE', appointmentStatus: 'PENDING' });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  updateStatus(a: any, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
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
        this.load(this.page);
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
      next: () => { this.toast.success('Agendamento excluído!'); this.load(this.page); },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }
}