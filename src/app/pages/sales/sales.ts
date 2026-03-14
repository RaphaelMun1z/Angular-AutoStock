import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  SaleService,
  CustomerService,
  SellerService,
  InventoryService,
} from '../../services/business.service';
import { ToastService } from '../../core/services/toast.service';
import { formatCurrency, formatDate } from '../../shared/helpers/formatters.helper';
import { forkJoin, catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { Pagination } from '../../shared/components/pagination/pagination';
import { Modal } from '../../shared/components/modal/modal';

@Component({
  selector: 'app-sales',
  imports: [CommonModule, ReactiveFormsModule, Modal, Pagination],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sales implements OnInit {
  private svc     = inject(SaleService);
  private custSvc = inject(CustomerService);
  private selSvc  = inject(SellerService);
  private invSvc  = inject(InventoryService);
  private toast   = inject(ToastService);
  private fb      = inject(FormBuilder);
  private cdr     = inject(ChangeDetectorRef);

  loading = true;
  modalOpen = false;
  showInstallments = false;
  items: any[] = [];
  customers: any[] = [];
  sellers: any[] = [];
  inventory: any[] = [];
  page = 0;
  totalElements = 0;
  netDisplay = 'R$ 0,00';

  fmtCurrency = formatCurrency;
  fmtDate     = formatDate;

  form = this.fb.group({
    customerId:         ['', Validators.required],
    sellerId:           ['', Validators.required],
    inventoryId:        ['', Validators.required],
    saleDate:           ['', Validators.required],
    paymentMethod:      ['CASH', Validators.required],
    installmentsNumber: [null],
    grossAmount:        [0, Validators.required],
    appliedDiscount:    [0],
    receipt:            ['', Validators.required],
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
        this.items         = (r as any)?._embedded?.saleResponseDTOList ?? [];
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
      i: this.invSvc.getAll(0, 200).pipe(catchError(() => of(null))),
    }).subscribe((res) => {
      this.customers = (res.c as any)?._embedded?.customerResponseDTOList ?? [];
      this.sellers   = (res.s as any)?._embedded?.sellerResponseDTOList   ?? [];
      this.inventory = (res.i as any)?._embedded?.inventoryItemResponseDTOList ?? [];
      this.cdr.markForCheck();
    });

    this.form.reset({ paymentMethod: 'CASH', grossAmount: 0, appliedDiscount: 0 });
    this.netDisplay      = 'R$ 0,00';
    this.showInstallments = false;
    this.modalOpen        = true;
    this.cdr.markForCheck();
  }

  fillPrice(): void {
    const sel  = this.form.value.inventoryId;
    const item = this.inventory.find((i: any) => i.id === sel);
    if (item?.vehicle?.salePrice) {
      this.form.patchValue({ grossAmount: item.vehicle.salePrice });
      this.calcNet();
    }
  }

  calcNet(): void {
    const g = this.form.value.grossAmount ?? 0;
    const d = this.form.value.appliedDiscount ?? 0;
    this.netDisplay = formatCurrency(g - d);
    this.cdr.markForCheck();
  }

  toggleInstallments(): void {
    const v = this.form.value.paymentMethod ?? '';
    this.showInstallments = v.includes('INSTALLMENT') || v.includes('FINANCED');
    this.cdr.markForCheck();
  }

  save(): void {
    const v     = this.form.value;
    const gross = v.grossAmount ?? 0;
    const disc  = v.appliedDiscount ?? 0;
    const body  = {
      saleDate:           v.saleDate,
      grossAmount:        gross,
      netAmount:          gross - disc,
      appliedDiscount:    disc,
      paymentMethod:      v.paymentMethod,
      installmentsNumber: v.installmentsNumber ?? null,
      receipt:            v.receipt,
      seller:             { id: v.sellerId },
      customer:           { id: v.customerId },
      inventoryItem:      { id: v.inventoryId },
    };
    this.svc.create(body as any).subscribe({
      next: () => {
        this.toast.success('Venda registrada!');
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
      title: 'Excluir venda?', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(s.id).subscribe({
      next: () => { this.toast.success('Venda excluída!'); this.load(this.page); },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }
}