import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/business.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import { formatDate, maskCpf, maskPhone } from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';

@Component({
  selector: 'app-customers',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Modal, Pagination],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Customers implements OnInit {
  private svc   = inject(CustomerService);
  private toast = inject(ToastService);
  private cache = inject(CacheService);
  private fb    = inject(FormBuilder);
  private cdr   = inject(ChangeDetectorRef);

  loading       = false;
  modalOpen     = false;
  activeTab     = 'list';
  items:     any[] = [];
  filtered:  any[] = [];
  addresses: any[] = [];
  editId        = '';
  searchQuery   = '';
  page          = 0;
  totalElements = 0;

  fmtDate = formatDate;

  form = this.fb.group({
    name:       ['', Validators.required],
    cpf:        ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    phone:      ['', Validators.required],
    birthDate:  ['', Validators.required],
    clientType: ['INDIVIDUAL', Validators.required],
    validCnh:   [false],
  });

  ngOnInit(): void { this.load(); }

  private cacheKey(page: number): string {
    return `customers_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: any[]; total: number }>(key)!;
      this.items         = cached.items;
      this.totalElements = cached.total;
      // Atualiza também o cache compartilhado customers_all
      if (!this.cache.has('customers_all')) {
        this.cache.set('customers_all', this.items);
      }
      this.applyFilter();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r) => {
        this.items         = (r as any)?._embedded?.customerResponseDTOList ?? [];
        this.totalElements = (r as any)?.page?.totalElements ?? 0;
        this.cache.set(key, { items: this.items, total: this.totalElements });
        // Atualiza cache compartilhado usado pelos selects de vendas/agendamentos
        this.cache.set('customers_all', this.items);
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
    this.cache.invalidate('customers_all');
    this.load(this.page, true);
  }

  loadAddresses(forceRefresh = false): void {
    const key = 'customers_addresses';
    if (!forceRefresh && this.cache.has(key)) {
      this.addresses = this.cache.get<any[]>(key)!;
      this.cdr.markForCheck();
      return;
    }
    this.svc.getAddresses().subscribe((r) => {
      this.addresses = (r as any)?._embedded?.customerAddressResponseDTOList ?? [];
      this.cache.set(key, this.addresses);
      this.cdr.markForCheck();
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = !q
      ? [...this.items]
      : this.items.filter((c) =>
          `${c.name} ${c.cpf} ${c.email}`.toLowerCase().includes(q),
        );
  }

  onSearch(): void {
    this.applyFilter();
    this.cdr.markForCheck();
  }

  onCpf(e: Event): void {
    const t = e.target as HTMLInputElement;
    t.value = maskCpf(t.value);
    this.form.patchValue({ cpf: t.value });
  }

  onPhone(e: Event): void {
    const t = e.target as HTMLInputElement;
    t.value = maskPhone(t.value);
    this.form.patchValue({ phone: t.value });
  }

  openNew(): void {
    this.editId = '';
    this.form.reset({ clientType: 'INDIVIDUAL', validCnh: false });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(c: any): void {
    this.editId = c.id;
    this.form.patchValue({ ...c });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'address') this.loadAddresses();
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const body = this.form.value;
    const req  = this.editId
      ? this.svc.update(this.editId, body as any)
      : this.svc.create(body as any);

    req.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Cliente atualizado!' : 'Cliente cadastrado!');
        this.modalOpen = false;
        this.editId    = '';
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
      title: `Excluir ${c.name}?`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(c.id).subscribe({
      next: () => {
        this.toast.success('Cliente excluído!');
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }

  async deleteAddr(a: any): Promise<void> {
    const r = await Swal.fire({
      title: 'Excluir endereço?', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.deleteAddress(a.id).subscribe({
      next: () => {
        this.toast.success('Endereço removido!');
        this.cache.invalidate('customers_addresses');
        this.loadAddresses(true);
      },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }

  private invalidateAllPages(): void {
    for (let i = 0; i <= Math.ceil(this.totalElements / 12); i++) {
      this.cache.invalidate(this.cacheKey(i));
    }
    this.cache.invalidate('customers_all');
  }
}