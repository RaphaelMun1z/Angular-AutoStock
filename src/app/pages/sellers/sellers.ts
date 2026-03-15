import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SellerService } from '../../services/business.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
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
  private cache = inject(CacheService);
  private fb    = inject(FormBuilder);
  private cdr   = inject(ChangeDetectorRef);

  loading       = false;
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

  private cacheKey(page: number): string {
    return `sellers_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: any[]; total: number }>(key)!;
      this.items         = cached.items;
      this.totalElements = cached.total;
      if (!this.cache.has('sellers_all')) this.cache.set('sellers_all', this.items);
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r) => {
        this.items         = (r as any)?._embedded?.sellerResponseDTOList ?? [];
        this.totalElements = (r as any)?.page?.totalElements ?? 0;
        this.cache.set(key, { items: this.items, total: this.totalElements });
        this.cache.set('sellers_all', this.items);
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
    this.cache.invalidate('sellers_all');
    this.load(this.page, true);
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
        this.invalidateAllPages();
        this.load(this.page, true);
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
      next: () => {
        this.toast.success('Vendedor excluído!');
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
    this.cache.invalidate('sellers_all');
  }
}