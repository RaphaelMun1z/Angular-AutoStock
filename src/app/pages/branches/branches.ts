import { CommonModule, formatDate } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';
import { BranchService } from '../../services/branch.service';
import {
  BranchResponseDTO,
  PagedResponse,
  Branch,
  BranchAddress
} from '../../shared/interfaces/models.interface';

@Component({
  selector: 'app-branches',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Modal],
  templateUrl: './branches.html',
  styleUrl: './branches.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Branches implements OnInit {
  private svc = inject(BranchService);
  private toast = inject(ToastService);
  private cache = inject(CacheService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  modalOpen = false;

  items: BranchResponseDTO[] = [];
  filtered: BranchResponseDTO[] = [];

  editId = '';
  searchQuery = '';
  page = 0;
  totalElements = 0;

  fmtDate = formatDate;

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    managerName: ['', Validators.required],
    openingHours: ['', Validators.required],
    branchType: ['', Validators.required],
    status: [''],
    street: ['', Validators.required],
    number: [null as number | null, Validators.required],
    district: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['', Validators.required],
    cep: [''],
    complement: ['']
  });

  ngOnInit(): void {
    this.load();
  }

  private cacheKey(page: number): string {
    return `branches_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: BranchResponseDTO[]; total: number }>(key)!;
      this.items = cached.items;
      this.totalElements = cached.total;

      if (!this.cache.has('branches_all')) {
        this.cache.set('branches_all', this.items);
      }
      this.applyFilter();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (response) => {
        const r = response as unknown as PagedResponse<BranchResponseDTO>;
        this.items = r._embedded?.['branchResponseDTOList'] ?? [];
        this.totalElements = r.page?.totalElements ?? 0;

        this.cache.set(key, { items: this.items, total: this.totalElements });
        this.cache.set('branches_all', this.items);

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
    this.cache.invalidate('branches_all');
    this.load(this.page, true);
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = !q
      ? [...this.items]
      : this.items.filter((b) => `${b.name} ${b.branchType} ${b.email}`.toLowerCase().includes(q));
  }

  onSearch(): void {
    this.applyFilter();
    this.cdr.markForCheck();
  }

  openNew(): void {
    this.editId = '';
    this.form.reset();
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(id: string): void {
    const b = this.items.find(item => item.id === id);
    if (!b) return;

    this.editId = b.id!;
    this.form.patchValue({
      name: b.name,
      email: b.email,
      phoneNumber: b.phoneNumber,
      managerName: b.managerName,
      openingHours: b.openingHours,
      branchType: b.branchType,
      status: b.status,
      street: b.address?.street,
      number: b.address?.number,
      district: b.address?.district,
      city: b.address?.city,
      state: b.address?.state,
      country: b.address?.country,
      cep: b.address?.cep,
      complement: b.address?.complement
    });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    
    const body: Partial<Branch> = {
      name: v.name ?? undefined,
      email: v.email ?? undefined,
      phoneNumber: v.phoneNumber ?? undefined,
      managerName: v.managerName ?? undefined,
      openingHours: v.openingHours ?? undefined,
      branchType: v.branchType ?? undefined,
      status: v.status ?? undefined,
      address: {
        street: v.street,
        number: v.number,
        district: v.district,
        city: v.city,
        state: v.state,
        country: v.country,
        cep: v.cep,
        complement: v.complement
      } as BranchAddress
    };

    const req = this.editId
      ? this.svc.update(this.editId, body)
      : this.svc.create(body as Branch);

    req.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Filial atualizada!' : 'Filial cadastrada!');
        this.modalOpen = false;
        this.editId = '';
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro');
        this.cdr.markForCheck();
      },
    });
  }

  async delete(b: BranchResponseDTO): Promise<void> {
    const r = await Swal.fire({
      title: `Excluir ${b.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não',
      confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;

    this.svc.delete(b.id!).subscribe({
      next: () => {
        this.toast.success('Filial excluída!');
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
    this.cache.invalidate('branches_all');
  }
}