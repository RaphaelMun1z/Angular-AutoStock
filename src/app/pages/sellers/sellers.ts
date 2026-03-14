import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SellerService } from '../../services/business.service';
import { ToastService } from '../../core/services/toast.service';
import { maskPhone } from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Pagination } from '../../shared/components/pagination/pagination';
import { Modal } from '../../shared/components/modal/modal';

@Component({
  selector: 'app-sellers',
  imports: [CommonModule, ReactiveFormsModule, Modal, Pagination],
  templateUrl: './sellers.html',
  styleUrl: './sellers.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sellers implements OnInit {
  private svc   = inject(SellerService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);
  private cdr   = inject(ChangeDetectorRef);

  loading       = true;
  modalOpen     = false;
  items:  any[] = [];
  page          = 0;
  totalElements = 0;

  form = this.fb.group({
    name:           ['', Validators.required],
    email:          ['', Validators.required],
    password:       ['', Validators.required],
    phone:          [''],
    hireDate:       ['', Validators.required],
    salary:         [0, Validators.required],
    commissionRate: [0, Validators.required],
  });

  ngOnInit(): void { this.load(); }

  load(page = 0): void {
    this.loading = true;
    this.page = page;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r) => {
        this.items         = (r as any)?._embedded?.sellerResponseDTOList ?? [];
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
    this.form.reset({ salary: 0, commissionRate: 0 });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  onPhone(e: Event): void {
    const t = e.target as HTMLInputElement;
    t.value = maskPhone(t.value);
    this.form.patchValue({ phone: t.value });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.svc.create(this.form.value as any).subscribe({
      next: () => {
        this.toast.success('Vendedor cadastrado!');
        this.modalOpen = false;
        this.load(this.page);
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro');
        this.cdr.markForCheck();
      },
    });
  }

  async delete(s: any): Promise<void> {
    const r = await Swal.fire({
      title: `Excluir ${s.name}?`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(s.id).subscribe({
      next: () => { this.toast.success('Vendedor excluído!'); this.load(this.page); },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }
}