import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { ContractService, SaleService } from '../../services/business.service';
import { CacheService } from '../../services/cache.service';
import {
  formatCurrency,
  formatDate,
  contractStatusClass,
  contractStatusLabel,
} from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';

@Component({
  selector: 'app-contracts',
  imports: [CommonModule, ReactiveFormsModule, Modal, Pagination],
  templateUrl: './contracts.html',
  styleUrl: './contracts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contracts implements OnInit {
  private svc     = inject(ContractService);
  private saleSvc = inject(SaleService);
  private toast   = inject(ToastService);
  private cache   = inject(CacheService);
  private fb      = inject(FormBuilder);
  private cdr     = inject(ChangeDetectorRef);

  loading       = false;
  modalOpen     = false;
  items:  any[] = [];
  sales:  any[] = [];
  page          = 0;
  totalElements = 0;

  fmtCurrency = formatCurrency;
  fmtDate     = formatDate;
  statusClass = contractStatusClass;
  statusLabel = contractStatusLabel;

  form = this.fb.group({
    contractNumber: ['', Validators.required],
    contractType:   ['', Validators.required],
    contractDate:   ['', Validators.required],
    deliveryDate:   ['', Validators.required],
    totalAmount:    [0, Validators.required],
    paymentTerms:   ['CASH', Validators.required],
    contractStatus: ['PENDING'],
    saleId:         ['', Validators.required],
    notes:          [''],
    attachments:    [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private cacheKey(page: number): string {
    return `contracts_page_${page}`;
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
        this.items         = (r as any)?._embedded?.contractResponseDTOList ?? [];
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
    const salesKey = 'sales_all';
    if (this.cache.has(salesKey)) {
      this.sales = this.cache.get<any[]>(salesKey)!;
      this.cdr.markForCheck();
    } else {
      this.saleSvc.getAll(0, 200).subscribe((r) => {
        this.sales = (r as any)?._embedded?.saleResponseDTOList ?? [];
        this.cache.set(salesKey, this.sales);
        this.cdr.markForCheck();
      });
    }

    this.form.reset({ paymentTerms: 'CASH', contractStatus: 'PENDING', totalAmount: 0 });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  save(): void {
    const v    = this.form.value;
    const body = {
      contractNumber: v.contractNumber,
      contractType:   v.contractType,
      contractDate:   v.contractDate,
      deliveryDate:   v.deliveryDate,
      totalAmount:    v.totalAmount,
      paymentTerms:   v.paymentTerms,
      contractStatus: v.contractStatus,
      notes:          v.notes,
      attachments:    v.attachments,
      sale:           { id: v.saleId },
    };
    this.svc.create(body as any).subscribe({
      next: () => {
        this.toast.success('Contrato criado!');
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

  async delete(c: any): Promise<void> {
    const r = await Swal.fire({
      title: 'Excluir contrato?', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(c.id).subscribe({
      next: () => {
        this.toast.success('Contrato excluído!');
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