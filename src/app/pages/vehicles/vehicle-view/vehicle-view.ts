import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Modal } from '../../../shared/components/modal/modal';
import {
  availabilityClass,
  availabilityLabel,
  vehicleStatusClass,
  vehicleStatusLabel,
  fuelLabel,
} from '../../../shared/helpers/formatters.helper';
import { VehicleResponseDTO } from '../../../shared/interfaces/models.interface';

@Component({
  selector: 'app-vehicle-view',
  imports: [CommonModule, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vehicle-view.html',
  styleUrl: './vehicle-view.css',
})
export class VehicleView {
  @Input() isOpen = false;
  @Input() vehicle: VehicleResponseDTO | null = null;

  @Output() closed = new EventEmitter<void>();

  fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
  fmtMileage = (v: number) => (v != null ? `${Number(v).toLocaleString('pt-BR')} km` : '—');

  availClass = availabilityClass;
  availLabel = availabilityLabel;
  vehicleStatusClass = vehicleStatusClass;
  vehicleStatusLabel = vehicleStatusLabel;
  fuelLabel = fuelLabel;

  getYear = (d: string | number | undefined | null) => {
    if (!d) return '—';
    if (typeof d === 'number') return d;
    return String(d).substring(0, 4);
  };

  getTypeConfig = (type: string | undefined) => {
    const t = type || 'OTHER_VEHICLE_TYPE';
    const config: Record<string, { label: string; icon: string; bg: string; text: string }> = {
      CAR: { label: 'Carro', icon: '🚗', bg: '#eff6ff', text: '#2563eb' },
      MOTORCYCLE: { label: 'Moto', icon: '🏍️', bg: '#f0fdf4', text: '#16a34a' },
      TRUCK: { label: 'Caminhão', icon: '🚚', bg: '#fef2f2', text: '#dc2626' },
      VAN: { label: 'Van', icon: '🚐', bg: '#faf5ff', text: '#9333ea' },
      BUS: { label: 'Ônibus', icon: '🚌', bg: '#fffbeb', text: '#d97706' },
      BOAT: { label: 'Barco', icon: '🚤', bg: '#ecfeff', text: '#0891b2' },
      OTHER_VEHICLE_TYPE: { label: 'Outros', icon: '🚜', bg: '#f3f4f6', text: '#4b5563' },
    };
    return config[t] || config['OTHER_VEHICLE_TYPE'];
  };

  close(): void {
    this.closed.emit();
  }
}
