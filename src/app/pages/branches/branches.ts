import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { BranchService } from '../../services/business.service';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';

@Component({
  selector: 'app-branches',
  imports: [CommonModule, ReactiveFormsModule, Modal],
  templateUrl: './branches.html',
  styleUrl: './branches.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Branches implements OnInit {
  private svc   = inject(BranchService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);
  private cdr   = inject(ChangeDetectorRef);

  loading   = true;
  modalOpen = false;
  items:    any[] = [];
  editId    = '';

  form = this.fb.group({
    name:         ['', Validators.required],
    email:        ['', Validators.required],
    phoneNumber:  [''],
    managerName:  ['', Validators.required],
    openingHours: ['', Validators.required],
    branchType:   ['', Validators.required],
    status:       ['Ativo'],
    street:       ['', Validators.required],
    number:       [0, Validators.required],
    district:     ['', Validators.required],
    city:         ['', Validators.required],
    state:        ['', Validators.required],
    country:      ['BRASIL', Validators.required],
    cep:          [''],
    complement:   [''],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll().subscribe({
      next: (r) => {
        const raw   = r as any;
        this.items  = raw?._embedded?.branchResponseDTOList ?? (Array.isArray(raw) ? raw : []);
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
    this.editId = '';
    this.form.reset({ country: 'BRASIL', status: 'Ativo', number: 0 });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(id: string): void {
    this.svc.getById(id).subscribe((b) => {
      this.editId = id;
      this.form.patchValue({ ...b, ...b.address } as any);
      this.modalOpen = true;
      this.cdr.markForCheck();
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v    = this.form.value;
    const body = {
      name: v.name, email: v.email, phoneNumber: v.phoneNumber,
      managerName: v.managerName, openingHours: v.openingHours,
      branchType: v.branchType, status: v.status,
      address: {
        street: v.street, number: v.number, district: v.district,
        city: v.city, state: v.state, country: v.country,
        cep: v.cep, complement: v.complement,
      },
    };
    const req = this.editId
      ? this.svc.update(this.editId, body as any)
      : this.svc.create(body as any);

    req.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Filial atualizada!' : 'Filial cadastrada!');
        this.modalOpen = false;
        this.editId    = '';
        this.load();
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro');
        this.cdr.markForCheck();
      },
    });
  }

  async delete(b: any): Promise<void> {
    const r = await Swal.fire({
      title: `Excluir ${b.name}?`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(b.id).subscribe({
      next: () => { this.toast.success('Filial excluída!'); this.load(); },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }
}