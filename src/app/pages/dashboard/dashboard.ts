import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  formatDate,
  aptTypeLabel,
  aptTypeClass,
  aptStatusLabel,
  aptStatusClass,
} from '../../shared/helpers/formatters.helper';
import { AppointmentResponse, DashboardSummary } from '../../shared/interfaces/models.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  stats = signal<any[]>([]);
  appointments = signal<any[]>([]);
  branches = signal<any[]>([]);

  fmtDate = formatDate;
  aptTypeLabel = aptTypeLabel;
  aptTypeClass = aptTypeClass;
  aptStatusLabel = aptStatusLabel;
  aptStatusClass = aptStatusClass;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);

    this.api
      .get<DashboardSummary>('/dashboard/summary')
      .pipe(
        catchError(() =>
          of({
            totalVehicles: 0,
            totalInventory: 0,
            totalSales: 0,
            totalCustomers: 0,
          } as DashboardSummary),
        ),
      )
      .subscribe((res) => {
        this.stats.set(
          this.buildStats(
            res.totalVehicles,
            res.totalInventory,
            res.totalSales,
            res.totalCustomers,
          ),
        );
        this.loading.set(false);
      });

    this.loadRecentAppointments();
    this.loadBranches();
  }

  private loadRecentAppointments(): void {
    this.api
      .getAll<AppointmentResponse>('/appointments', 0, 5)
      .pipe(
        catchError(() =>
          of({ _embedded: { appointmentResponseDTOList: [] } } as AppointmentResponse),
        ),
      )
      .subscribe((res) => {
        const list = res._embedded?.appointmentResponseDTOList ?? [];
        this.appointments.set(list);
      });
  }

  private loadBranches(): void {
    this.api
      .getAll('/branches', 0, 6)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        const data = (res as any)?._embedded?.branchResponseDTOList ?? [];
        this.branches.set(Array.isArray(data) ? data : []);
      });
  }

  private buildStats(v: number, inv: number, s: number, c: number) {
    return [
      {
        label: 'Veículos',
        emoji: '🚗',
        value: v,
        sub: 'Total cadastrado',
        iconBg: 'rgba(234,88,12,0.1)',
      },
      {
        label: 'Estoque',
        emoji: '📦',
        value: inv,
        sub: 'Itens em estoque',
        iconBg: 'rgba(37,99,235,0.1)',
      },
      {
        label: 'Vendas',
        emoji: '💰',
        value: s,
        sub: 'Total de vendas',
        iconBg: 'rgba(22,163,74,0.1)',
      },
      {
        label: 'Clientes',
        emoji: '👥',
        value: c,
        sub: 'Cadastrados',
        iconBg: 'rgba(124,58,237,0.1)',
      },
    ];
  }
}
