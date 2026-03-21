export interface Link {
  href: string;
  hreflang?: string;
  title?: string;
  type?: string;
  deprecation?: string;
  profile?: string;
  name?: string;
  templated?: boolean;
}

export interface Links {
  [key: string]: Link;
}

export interface PageMetadata {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface HATEOASResponse<K extends string, T> {
  _embedded?: { [key in K]: T[] };
  _links?: Links;
  page?: PageMetadata;
}

export interface PagedResponse<T> extends HATEOASResponse<string, T> {}

export interface LoginRequest { 
  email?: string; 
  password?: string; 
}

export interface LoginResponse { 
  token?: TokenDTO;
  _links?: Links;
}

export interface TokenDTO {
  username?: string;
  created?: string;
  expiration?: string;
  accessToken?: string;
  _links?: Links;
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
  role?: string;
  enabled?: boolean;
}

export interface AdminRegisterRequest extends Omit<Admin, 'id'> {
  password?: string;
}

export interface AdminResponseDTO extends Admin {
  _links?: Links;
}

export interface DashboardSummary {
  totalVehicles?: number;
  totalInventory?: number;
  totalSales?: number;
  totalCustomers?: number;
}

export type VehicleType = 'CAR' | 'MOTORCYCLE' | 'VAN' | 'BUS' | 'TRUCK' | 'BOAT' | 'OTHER_VEHICLE_TYPE';
export type VehicleCategory = 'SUV' | 'SEDAN' | 'HATCHBACK' | 'SPORTS' | 'UTILITARIAN' | 'COUPE' | 'CONVERTIBLE' | 'WAGON' | 'PICKUP' | 'VAN' | 'MOTORHOME' | 'ELECTRIC' | 'HYBRID' | 'OTHERS';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'ETHANOL' | 'LPG' | 'CNG' | 'PROPANE' | 'OTHERS';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'SEMI_AUTOMATIC' | 'CVT' | 'DUAL_CLUTCH' | 'OTHERS';
export type VehicleStatus = 'NEW' | 'USED' | 'SEMINOVO' | 'OTHERS';
export type VehicleAvailability = 'AVAILABLE' | 'SOLD' | 'PENDING' | 'RESERVED' | 'IN_NEGOTIATION' | 'OTHERS';

export interface VehicleImageFile {
  id?: string;
  name: string;
  downloadUri: string;
  type?: string;
  size?: number;
}

export interface VehicleSpecificDetail {
  id?: string;
  detail: string;
}

// Interfaces de Branch movidas para cima para poderem ser usadas dentro do Vehicle
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

export interface BranchAddressResponseDTO extends BranchAddress {
  _links?: Links;
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

export interface BranchResponseDTO extends Omit<Branch, 'address'> {
  address?: BranchAddressResponseDTO;
  _links?: Links;
}

export interface Vehicle {
  id?: string;
  brand: string;
  model: string;
  type: VehicleType;
  category: VehicleCategory;
  manufactureYear: number;
  color: string;
  mileage: number;
  weight: number;
  fuelType: FuelType;
  transmissionType?: TransmissionType;
  numberOfCylinders: number;
  infotainmentSystem: string;
  fuelTankCapacity: number;
  enginePower: number;
  passengerCapacity: number;
  salePrice: number;
  status?: VehicleStatus;
  availability?: VehicleAvailability;
  description: string;
  lastUpdate?: string;
  brakeType?: string;
  groundClearance?: number;
  autonomyRoad?: number;
  autonomyCity?: number;
  numberOfGears?: number;
  steeringType?: string;
  tireSize?: number;
  doors?: number;
  trunkCapacity?: number;
  driveType?: string;
  hasLuggageCarrier?: boolean;
  isCargo?: boolean;
  cargoVolume?: number;
  loadCapacity?: number;
  axles?: number;
  numberOfSeats?: number;
  hasAccessibility?: boolean;
  length?: number;
  hullMaterial?: string;
  autonomy?: number;
  usage?: string;
  branchId?: string;
  // A propriedade abaixo resolve o erro no HTML do vehicles.ts
  branch?: BranchResponseDTO; 
  specificDetails?: VehicleSpecificDetail[];
  images?: VehicleImageFile[];
}

export interface VehicleResponseDTO extends Vehicle {
  _links?: Links;
}

export interface VehicleSpecificDetailResponseDTO extends VehicleSpecificDetail {
  _links?: Links;
}

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

export interface InventoryItemResponseDTO extends Omit<InventoryItem, 'vehicle'> {
  vehicle?: VehicleResponseDTO;
  _links?: Links;
}

export type ClientType = 'INDIVIDUAL' | 'CORPORATE' | 'OTHERS';

export interface Customer {
  id?: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  registrationDate?: string;
  clientType: ClientType;
  validCnh: boolean;
}

export interface CustomerResponseDTO extends Customer {
  _links?: Links;
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
  complement?: string;
}

export interface CustomerAddressResponseDTO extends CustomerAddress {
  _links?: Links;
}

export interface Seller {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  hireDate?: string;
  salary?: number;
  commissionRate?: number;
  status?: string;
  enabled?: boolean;
  role?: string;
}

export interface SellerRegisterRequest extends Omit<Seller, 'id'> {
  password?: string;
}

export interface SellerResponseDTO {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  _links?: Links;
}

export interface Sale {
  id?: string;
  saleDate: string;
  grossAmount: number;
  netAmount?: number;
  appliedDiscount?: number;
  installmentsNumber?: number;
  paymentMethod: string;
  receipt: string;
  invoice?: string;
  seller: Partial<Seller>;
  customer: Partial<Customer>;
  inventoryItem: Partial<InventoryItem>;
}

export interface SaleResponseDTO extends Omit<Sale, 'seller' | 'customer' | 'inventoryItem'> {
  seller?: SellerResponseDTO;
  customer?: CustomerResponseDTO;
  inventoryItem?: InventoryItemResponseDTO;
  _links?: Links;
}

export type PaymentTerms = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CHECK' | 'INSTALLMENTS_WITHOUT_INTEREST' | 'INSTALLMENTS_WITH_INTEREST' | 'FINANCED_BY_BANK' | 'FINANCED_BY_DEALERSHIP' | 'TRADE_IN' | 'PARTIAL_CASH_PARTIAL_FINANCING' | 'OTHER';
export type ContractStatus = 'SIGNED' | 'CANCELLED' | 'EXPIRED' | 'PENDING';

export interface Contract {
  id?: string;
  contractNumber: string;
  contractType: string;
  contractDate: string;
  deliveryDate: string;
  totalAmount: number;
  paymentTerms: PaymentTerms;
  contractStatus?: ContractStatus;
  notes?: string;
  attachments: string;
  sale: Partial<Sale>;
}

export interface ContractResponseDTO extends Omit<Contract, 'sale'> {
  sale?: SaleResponseDTO;
  _links?: Links;
}

export type AppointmentType = 'TEST_DRIVE' | 'NEGOTIATION_VISIT';
export type AppointmentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id?: string;
  date: string;
  appointmentType: AppointmentType;
  appointmentStatus?: AppointmentStatus;
  customer: Partial<Customer>;
  seller: Partial<Seller>;
  inventoryItemCommitments?: any[];
}

export interface AppointmentResponseDTO extends Omit<Appointment, 'customer' | 'seller' | 'inventoryItemCommitments'> {
  customer?: CustomerResponseDTO;
  seller?: SellerResponseDTO;
  inventoryItemCommitments?: InventoryItemResponseDTO[];
  _links?: Links;
}

export interface AppointmentResponse {
  _embedded?: {
    appointmentResponseDTOList: AppointmentResponseDTO[];
  };
  _links?: Links;
  page?: PageMetadata;
}

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  section: string;
}

export interface UploadFileResponseDTO {
  fileName?: string;
  fileDownloadUri?: string;
  fileType?: string;
  size?: number;
}