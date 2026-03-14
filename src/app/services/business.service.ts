import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Vehicle,
  InventoryItem,
  Customer,
  CustomerAddress,
  Seller,
  SellerRegisterRequest,
  Sale,
  Contract,
  Branch,
  Appointment,
  Admin,
  AdminRegisterRequest,
  PagedResponse,
} from '../shared/interfaces/models.interface';

// ─── Vehicle Service ──────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class VehicleService {
  constructor(private api: ApiService) {}
  getAll(page = 0, size = 12) {
    return this.api.getAll<Vehicle>('/vehicles', page, size);
  }
  getById(id: string) {
    return this.api.getById<Vehicle>('/vehicles', id);
  }
  create(v: Vehicle) {
    return this.api.create<Vehicle>('/vehicles', v);
  }
  update(id: string, v: Partial<Vehicle>) {
    return this.api.update<Vehicle>('/vehicles', id, v);
  }
  delete(id: string) {
    return this.api.remove('/vehicles', id);
  }
}

// ─── Inventory Service ────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private api: ApiService) {}
  getAll(page = 0, size = 12) {
    return this.api.getAll<InventoryItem>('/inventory-items', page, size);
  }
  create(i: InventoryItem) {
    return this.api.create<InventoryItem>('/inventory-items', i);
  }
  update(id: string, i: Partial<InventoryItem>) {
    return this.api.update<InventoryItem>('/inventory-items', id, i);
  }
  delete(id: string) {
    return this.api.remove('/inventory-items', id);
  }
}

// ─── Customer Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CustomerService {
  constructor(private api: ApiService) {}
  getAll(page = 0, size = 12) {
    return this.api.getAll<Customer>('/customers', page, size);
  }
  create(c: Customer) {
    return this.api.create<Customer>('/customers', c);
  }
  update(id: string, c: Partial<Customer>) {
    return this.api.update<Customer>('/customers', id, c);
  }
  delete(id: string) {
    return this.api.remove('/customers', id);
  }
  getAddresses(page = 0) {
    return this.api.getAll<CustomerAddress>('/customers-address', page, 50);
  }
  deleteAddress(id: string) {
    return this.api.remove('/customers-address', id);
  }
}

// ─── Seller Service ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SellerService {
  constructor(private api: ApiService) {}
  getAll(page = 0, size = 12) {
    return this.api.getAll<Seller>('/sellers', page, size);
  }
  create(s: SellerRegisterRequest) {
    return this.api.create<Seller>('/sellers', s);
  }
  delete(id: string) {
    return this.api.remove('/sellers', id);
  }
}

// ─── Sale Service ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SaleService {
  constructor(private api: ApiService) {}
  getAll(page = 0, size = 12) {
    return this.api.getAll<Sale>('/sales', page, size);
  }
  create(s: Sale) {
    return this.api.create<Sale>('/sales', s);
  }
  delete(id: string) {
    return this.api.remove('/sales', id);
  }
}

// ─── Contract Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ContractService {
  constructor(private api: ApiService) {}
  getAll(page = 0, size = 12) {
    return this.api.getAll<Contract>('/contracts', page, size);
  }
  create(c: Contract) {
    return this.api.create<Contract>('/contracts', c);
  }
  update(id: string, c: Partial<Contract>) {
    return this.api.update<Contract>('/contracts', id, c);
  }
  delete(id: string) {
    return this.api.remove('/contracts', id);
  }
}

// ─── Branch Service ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class BranchService {
  constructor(private api: ApiService) {}
  getAll(page = 0, size = 24) {
    return this.api.getAll<Branch>('/branches', page, size);
  }
  getById(id: string) {
    return this.api.getById<Branch>('/branches', id);
  }
  create(b: Branch) {
    return this.api.create<Branch>('/branches', b);
  }
  update(id: string, b: Partial<Branch>) {
    return this.api.update<Branch>('/branches', id, b);
  }
  delete(id: string) {
    return this.api.remove('/branches', id);
  }
}

// ─── Appointment Service ──────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private api: ApiService) {}
  getAll(page = 0, size = 12) {
    return this.api.getAll<Appointment>('/appointments', page, size);
  }
  create(a: Appointment) {
    return this.api.create<Appointment>('/appointments', a);
  }
  update(id: string, a: Partial<Appointment>) {
    return this.api.update<Appointment>('/appointments', id, a);
  }
  delete(id: string) {
    return this.api.remove('/appointments', id);
  }
}

// ─── Admin Service ────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}
  getAll(page = 0, size = 50) {
    return this.api.getAll<Admin>('/adm', page, size);
  }
  create(a: AdminRegisterRequest) {
    return this.api.create<Admin>('/adm', a);
  }
  delete(id: string) {
    return this.api.remove('/adm', id);
  }
}
