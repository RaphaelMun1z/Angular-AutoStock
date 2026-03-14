// ─── Pagination & HATEOAS ───────────────────────────────────────────────────

export interface PageMetadata {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface HATEOASResponse<K extends string, T> {
  _embedded?: { [key in K]: T[] };
  _links?: Record<string, { href: string }>;
  page?: PageMetadata;
}

/** Interface genérica usada pelo ApiService.getAll */
export interface PagedResponse<T> extends HATEOASResponse<string, T> {}

// ─── Auth & Admin ────────────────────────────────────────────────────────────

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { token: TokenDTO; }
export interface TokenDTO {
  username: string;
  accessToken: string;
}
export interface CurrentUser {
  email: string;
  name: string;
  role?: string;
}

export interface Admin {
  id?: string;
  name: string;
  email: string;
  phone?: string;
}

export interface AdminRegisterRequest extends Omit<Admin, 'id'> {
  password?: string;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalVehicles:  number;
  totalInventory: number;
  totalSales:     number;
  totalCustomers: number;
}

// ─── Vehicle ─────────────────────────────────────────────────────────────────

export type VehicleType = 'CAR'|'MOTORCYCLE'|'VAN'|'BUS'|'TRUCK'|'BOAT'|'OTHER_VEHICLE_TYPE';
export type VehicleCategory = 'SUV'|'SEDAN'|'HATCHBACK'|'SPORTS'|'UTILITARIAN'|'COUPE'|'CONVERTIBLE'|'WAGON'|'PICKUP'|'VAN'|'MOTORHOME'|'ELECTRIC'|'HYBRID'|'OTHERS';
export type FuelType = 'GASOLINE'|'DIESEL'|'ELECTRIC'|'HYBRID'|'ETHANOL'|'LPG'|'CNG'|'PROPANE'|'OTHERS';
export type VehicleStatus = 'NEW'|'USED'|'SEMINOVO'|'OTHERS';
export type VehicleAvailability = 'AVAILABLE'|'SOLD'|'PENDING'|'RESERVED'|'IN_NEGOTIATION'|'OTHERS';

export interface VehicleImageFile {
  id?: string;
  name: string;
  downloadUri: string;
}

export interface VehicleSpecificDetail {
  id?: string;
  detail: string;
}

export interface Vehicle {
  id?: string;
  brand: string;
  model: string;
  type: VehicleType;
  category: VehicleCategory;
  manufactureYear: string;
  color: string;
  mileage: number;
  weight: number;
  fuelType: FuelType;
  numberOfCylinders: number;
  infotainmentSystem: string;
  fuelTankCapacity: number;
  enginePower: number;
  passengerCapacity: number;
  salePrice: number;
  status?: VehicleStatus;
  availability?: VehicleAvailability;
  description: string;
  specificDetails?: VehicleSpecificDetail[];
  images?: VehicleImageFile[];
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface InventoryItem {
  id?: string;
  stockEntryDate?: string;
  stockExitDate?: string;
  acquisitionPrice?: number;
  profitMargin?: number;
  supplier?: string;
  licensePlate?: string;
  chassis?: string;
  vehicle: Partial<Vehicle>;
}

// ─── Customer ────────────────────────────────────────────────────────────────

export type ClientType = 'INDIVIDUAL'|'CORPORATE'|'OTHERS';

export interface Customer {
  id?: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  clientType: ClientType;
  validCnh: boolean;
}

export interface CustomerAddress {
  id?: string;
  street: string;
  number: number;
  district: string;
  city: string;
  state: string;
  country: string;
  cep?: string;
}

// ─── Seller ──────────────────────────────────────────────────────────────────

export interface Seller {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  hireDate?: string;
  salary?: number;
  commissionRate?: number;
}

export interface SellerRegisterRequest extends Omit<Seller, 'id'> {
  password?: string;
}

// ─── Sale & Contract ─────────────────────────────────────────────────────────

export interface Sale {
  id?: string;
  saleDate: string;
  grossAmount: number;
  netAmount?: number;
  paymentMethod: string;
  receipt: string;
  seller: Partial<Seller>;
  customer: Partial<Customer>;
  inventoryItem: Partial<InventoryItem>;
}

export type PaymentTerms = 'CASH'|'BANK_TRANSFER'|'CREDIT_CARD'|'DEBIT_CARD'|'PIX'|'CHECK'|'OTHER';
export type ContractStatus = 'SIGNED'|'CANCELLED'|'EXPIRED'|'PENDING';

export interface Contract {
  id?: string;
  contractNumber: string;
  contractType: string;
  contractDate: string;
  deliveryDate: string;
  totalAmount: number;
  paymentTerms: PaymentTerms;
  contractStatus?: ContractStatus;
  attachments: string;
  sale: Partial<Sale>;
}

// ─── Branch ──────────────────────────────────────────────────────────────────

export interface BranchAddress {
  id?: string;
  street: string;
  number: number;
  district: string;
  city: string;
  state: string;
  country: string;
  cep?: string;
  complement?: string;
}

export interface Branch {
  id?: string;
  name: string;
  phoneNumber?: string;
  email: string;
  managerName: string;
  openingHours: string;
  branchType: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  address: BranchAddress;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export type AppointmentType = 'TEST_DRIVE'|'NEGOTIATION_VISIT';
export type AppointmentStatus = 'PENDING'|'COMPLETED'|'CANCELLED';

export interface Appointment {
  id?: string;
  date: string;
  appointmentType: AppointmentType;
  appointmentStatus?: AppointmentStatus;
  customer: Partial<Customer>;
  seller: Partial<Seller>;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  section: string;
}

export interface AppointmentResponse {
  _embedded?: {
    appointmentResponseDTOList: any[];
  };
}