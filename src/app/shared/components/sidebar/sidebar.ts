import { Component, inject, signal, OnInit, HostListener, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../authentication/services/auth.service';
import { NavItem } from '../../interfaces/models.interface';
import Swal from 'sweetalert2';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { Toast } from '../toast/toast';

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',       label: 'Dashboard',       icon: 'dashboard', section: 'Principal'  },
  { path: '/veiculos',        label: 'Veículos',         icon: 'car',       section: 'Vendas'     },
  { path: '/estoque',         label: 'Estoque',          icon: 'box',       section: 'Vendas'     },
  { path: '/vendas',          label: 'Vendas',           icon: 'sale',      section: 'Vendas'     },
  { path: '/contratos',       label: 'Contratos',        icon: 'contract',  section: 'Vendas'     },
  { path: '/clientes',        label: 'Clientes',         icon: 'customers', section: 'Cadastros'  },
  { path: '/vendedores',      label: 'Vendedores',       icon: 'seller',    section: 'Cadastros'  },
  { path: '/filiais',         label: 'Filiais',          icon: 'branch',    section: 'Cadastros'  },
  { path: '/agendamentos',    label: 'Agendamentos',     icon: 'calendar',  section: 'Sistema'    },
  { path: '/administradores', label: 'Administradores',  icon: 'shield',    section: 'Sistema'    },
  { path: '/arquivos',        label: 'Arquivos',         icon: 'upload',    section: 'Sistema'    },
];

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ThemeToggle,
    Toast,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit {
  auth           = inject(AuthService);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);

  sidebarOpen     = signal(false);
  currentLabel    = signal('Dashboard');
  isMobile        = signal(false);
  isTransitioning = signal(false);
  isLeaving       = signal(false);

  readonly sections = ['Principal', 'Vendas', 'Cadastros', 'Sistema'];

  readonly todayDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  private readonly labelMap: Record<string, string> = {
    '/dashboard':       'Dashboard',
    '/veiculos':        'Veículos',
    '/estoque':         'Estoque',
    '/vendas':          'Vendas',
    '/contratos':       'Contratos',
    '/clientes':        'Clientes',
    '/vendedores':      'Vendedores',
    '/filiais':         'Filiais',
    '/agendamentos':    'Agendamentos',
    '/administradores': 'Administradores',
    '/arquivos':        'Arquivos',
  };

  ngOnInit(): void {
    this.checkMobile();

    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationStart) {
        // Fase 1: cortina sobe de baixo para cima
        this.isTransitioning.set(true);
        this.isLeaving.set(false);
        this.cdr.markForCheck();
      }

      if (
        ev instanceof NavigationEnd ||
        ev instanceof NavigationCancel ||
        ev instanceof NavigationError
      ) {
        if (ev instanceof NavigationEnd) {
          this.currentLabel.set(this.labelMap[ev.urlAfterRedirects] ?? 'AutoStock');
          this.cdr.markForCheck();
        }

        // Fase 2: após slideUpIn (220ms), troca para slideUpOut
        setTimeout(() => {
          this.isLeaving.set(true);
          this.cdr.markForCheck();

          // Remove overlay após slideUpOut terminar (mais 220ms)
          setTimeout(() => {
            this.isTransitioning.set(false);
            this.isLeaving.set(false);
            this.cdr.markForCheck();
          }, 220);
        }, 220);
      }
    });
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile.set(window.innerWidth < 768);
    if (!this.isMobile()) this.sidebarOpen.set(false);
    this.cdr.markForCheck();
  }

  onNavClick(label: string): void {
    this.currentLabel.set(label);
    if (this.isMobile()) this.sidebarOpen.set(false);
  }

  navBySection(section: string): NavItem[] {
    return NAV_ITEMS.filter((n) => n.section === section);
  }

  userInitial(): string {
    return (this.auth.currentUser()?.name ?? 'A')[0].toUpperCase();
  }

  async confirmLogout(): Promise<void> {
    const r = await Swal.fire({
      title: 'Sair do sistema?',
      text: 'Você será redirecionado para o login.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, sair',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ea580c',
    });
    if (r.isConfirmed) this.auth.logout();
  }

  getIcon(icon: string): string {
    const icons: Record<string, string> = {
      dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      car:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
      box:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
      sale:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>`,
      contract:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
      customers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
      seller:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      branch:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      calendar:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      shield:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      upload:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    };
    return icons[icon] ?? icons['dashboard'];
  }
}