import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/business.service';
import { ToastService } from '../../core/services/toast.service';
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
  private fb    = inject(FormBuilder);
  private cdr   = inject(ChangeDetectorRef);

  loading    = true;
  modalOpen  = false;
  activeTab  = 'list';
  items:     any[] = [];
  filtered:  any[] = [];
  addresses: any[] = [];
  editId       = '';
  searchQuery  = '';
  page         = 0;
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

  load(page = 0): void {
    this.loading = true;
    this.page = page;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r) => {
        this.items         = (r as any)?._embedded?.customerResponseDTOList ?? [];
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

  loadAddresses(): void {
    this.svc.getAddresses().subscribe((r) => {
      this.addresses = (r as any)?._embedded?.customerAddressResponseDTOList ?? [];
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
      title: `Excluir ${c.name}?`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(c.id).subscribe({
      next: () => { this.toast.success('Cliente excluído!'); this.load(this.page); },
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
      next: () => { this.toast.success('Endereço removido!'); this.loadAddresses(); },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }
}