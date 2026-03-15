import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CacheService } from '../../services/cache.service';
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
  private api   = inject(ApiService);
  private cache = inject(CacheService);

  loading      = signal(true);
  stats        = signal<any[]>([]);
  appointments = signal<any[]>([]);
  branches     = signal<any[]>([]);

  // Chaves de cache para isolar os blocos de dados
  private readonly cacheKeys = {
    summary: 'dash_summary',
    appointments: 'dash_appointments',
    branches: 'dash_branches'
  };

  fmtDate        = formatDate;
  aptTypeLabel   = aptTypeLabel;
  aptTypeClass   = aptTypeClass;
  aptStatusLabel = aptStatusLabel;
  aptStatusClass = aptStatusClass;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  refresh(): void {
    this.cache.invalidate(this.cacheKeys.summary);
    this.cache.invalidate(this.cacheKeys.appointments);
    this.cache.invalidate(this.cacheKeys.branches);
    this.loadDashboardData(true);
  }

  loadDashboardData(forceRefresh = false): void {
    this.loading.set(true);

    // 1. Bloco de Resumo (Cards Superiores)
    if (!forceRefresh && this.cache.has(this.cacheKeys.summary)) {
      this.stats.set(this.cache.get<any[]>(this.cacheKeys.summary)!);
      this.loading.set(false);
    } else {
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
          const statsData = this.buildStats(
            res.totalVehicles,
            res.totalInventory,
            res.totalSales,
            res.totalCustomers,
          );
          this.stats.set(statsData);
          this.cache.set(this.cacheKeys.summary, statsData);
          this.loading.set(false);
        });
    }

    // Carrega os outros dois blocos passando a flag de atualização
    this.loadRecentAppointments(forceRefresh);
    this.loadBranches(forceRefresh);
  }

  private loadRecentAppointments(forceRefresh: boolean): void {
    if (!forceRefresh && this.cache.has(this.cacheKeys.appointments)) {
      this.appointments.set(this.cache.get<any[]>(this.cacheKeys.appointments)!);
      return;
    }

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
        this.cache.set(this.cacheKeys.appointments, list);
      });
  }

  private loadBranches(forceRefresh: boolean): void {
    if (!forceRefresh && this.cache.has(this.cacheKeys.branches)) {
      this.branches.set(this.cache.get<any[]>(this.cacheKeys.branches)!);
      return;
    }

    this.api
      .getAll('/branches', 0, 6)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        const data = (res as any)?._embedded?.branchResponseDTOList ?? [];
        const list = Array.isArray(data) ? data : [];
        this.branches.set(list);
        this.cache.set(this.cacheKeys.branches, list);
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