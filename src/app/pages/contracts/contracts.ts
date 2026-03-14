import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { ContractService, SaleService } from '../../services/business.service';
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
  private fb      = inject(FormBuilder);
  private cdr     = inject(ChangeDetectorRef);

  loading = true;
  modalOpen = false;
  items: any[] = [];
  sales: any[] = [];
  page = 0;
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

  load(page = 0): void {
    this.loading = true;
    this.page = page;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r) => {
        this.items         = (r as any)?._embedded?.contractResponseDTOList ?? [];
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
    this.saleSvc.getAll(0, 200).subscribe((r) => {
      this.sales = (r as any)?._embedded?.saleResponseDTOList ?? [];
      this.cdr.markForCheck();
    });

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
        this.load(this.page);
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
      next: () => { this.toast.success('Contrato excluído!'); this.load(this.page); },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }
}