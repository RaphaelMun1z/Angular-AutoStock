import {
  Component, inject, signal, computed, OnInit, OnDestroy,
  HostListener, ChangeDetectorRef, ChangeDetectionStrategy,
  ViewChild, ElementRef, AfterViewInit,
} from '@angular/core';
import {
  RouterOutlet, RouterLink, RouterLinkActive, Router,
  NavigationStart, NavigationEnd, NavigationCancel, NavigationError,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../authentication/services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Subscription, timer, map, catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { Toast } from '../toast/toast';

export interface NavChild { path: string; label: string; }
export interface NavItem  { path: string; label: string; icon: string; children?: NavChild[]; }

export interface SearchResult { path: string; label: string; section: string; icon: string; }

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  {
    path: '/vendas-group', label: 'Vendas', icon: 'sale',
    children: [
      { path: '/veiculos',  label: 'Veículos' },
      { path: '/vendas',    label: 'Registrar venda' },
      { path: '/contratos', label: 'Contratos' },
    ],
  },
  {
    path: '/estoque-group', label: 'Estoque', icon: 'box',
    children: [
      { path: '/estoque', label: 'Itens em estoque' },
    ],
  },
  {
    path: '/cadastros-group', label: 'Cadastros', icon: 'customers',
    children: [
      { path: '/clientes',   label: 'Clientes' },
      { path: '/vendedores', label: 'Vendedores' },
      { path: '/filiais',    label: 'Filiais' },
    ],
  },
  {
    path: '/sistema-group', label: 'Sistema', icon: 'shield',
    children: [
      { path: '/agendamentos',    label: 'Agendamentos' },
      { path: '/administradores', label: 'Administradores' },
      { path: '/arquivos',        label: 'Arquivos' },
    ],
  },
];

// Flat list for search
const SEARCH_DATA: SearchResult[] = NAV_ITEMS.flatMap(item =>
  item.children
    ? item.children.map(c => ({ path: c.path, label: c.label, section: item.label, icon: item.icon }))
    : [{ path: item.path, label: item.label, section: item.label, icon: item.icon }]
);

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, ThemeToggle, Toast],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit, OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private http      = inject(HttpClient);
  auth              = inject(AuthService);
  private router    = inject(Router);
  private cdr       = inject(ChangeDetectorRef);

  @ViewChild('searchRef') searchRef?: ElementRef<HTMLInputElement>;

  sidebarOpen     = signal(true);
  isMobile        = signal(false);
  isTransitioning = signal(false);
  isLeaving       = signal(false);
  currentLabel    = signal('Dashboard');
  apiStatus       = signal<'checking' | 'online' | 'offline'>('checking');
  searchOpen      = signal(false);
  searchQuery     = '';
  searchResults   = signal<SearchResult[]>([]);

  readonly navItems = NAV_ITEMS;
  private expandedPaths = new Set<string>();
  private pingSub?: Subscription;

  readonly todayDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  private readonly labelMap: Record<string, string> = {
    '/dashboard': 'Dashboard', '/veiculos': 'Veículos', '/estoque': 'Estoque',
    '/vendas': 'Vendas', '/contratos': 'Contratos', '/clientes': 'Clientes',
    '/vendedores': 'Vendedores', '/filiais': 'Filiais',
    '/agendamentos': 'Agendamentos', '/administradores': 'Administradores',
    '/arquivos': 'Arquivos',
  };

  ngOnInit(): void {
    this.checkMobile();
    this.startApiPing();
    this.autoExpandActive();

    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationStart) {
        this.isTransitioning.set(true);
        this.isLeaving.set(false);
        this.cdr.markForCheck();
      }
      if (ev instanceof NavigationEnd || ev instanceof NavigationCancel || ev instanceof NavigationError) {
        if (ev instanceof NavigationEnd) {
          this.currentLabel.set(this.labelMap[ev.urlAfterRedirects] ?? 'AutoStock');
          this.autoExpandActive();
        }
        setTimeout(() => {
          this.isLeaving.set(true);
          this.cdr.markForCheck();
          setTimeout(() => {
            this.isTransitioning.set(false);
            this.isLeaving.set(false);
            this.cdr.markForCheck();
          }, 300);
        }, 320);
      }
    });
  }

  ngOnDestroy(): void { this.pingSub?.unsubscribe(); }

  @HostListener('window:resize')
  checkMobile(): void {
    const mobile = window.innerWidth < 768;
    this.isMobile.set(mobile);
    if (mobile) this.sidebarOpen.set(false);
    this.cdr.markForCheck();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.searchOpen() ? this.closeSearch() : this.openSearch();
    }
    if (e.key === 'Escape' && this.searchOpen()) {
      this.closeSearch();
    }
  }

  openSearch(): void {
    this.searchOpen.set(true);
    this.cdr.markForCheck();
    setTimeout(() => this.searchRef?.nativeElement.focus(), 60);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
    this.searchQuery = '';
    this.searchResults.set([]);
    this.cdr.markForCheck();
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) { this.searchResults.set([]); return; }
    this.searchResults.set(
      SEARCH_DATA.filter(r =>
        r.label.toLowerCase().includes(q) || r.section.toLowerCase().includes(q)
      )
    );
    this.cdr.markForCheck();
  }

  navigateFromSearch(label: string): void {
    this.currentLabel.set(label);
    this.closeSearch();
  }

  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }

  toggleExpand(path: string): void {
    if (this.expandedPaths.has(path)) this.expandedPaths.delete(path);
    else this.expandedPaths.add(path);
    this.cdr.markForCheck();
  }

  isExpanded(path: string): boolean { return this.expandedPaths.has(path); }

  hasActiveChild(item: NavItem): boolean {
    const url = this.router.url;
    return !!item.children?.some(c => url.startsWith(c.path));
  }

  private autoExpandActive(): void {
    const url = this.router.url;
    for (const item of NAV_ITEMS) {
      if (item.children?.some(c => url.startsWith(c.path))) {
        this.expandedPaths.add(item.path);
      }
    }
    this.cdr.markForCheck();
  }

  onNavClick(label: string): void {
    this.currentLabel.set(label);
    if (this.isMobile()) this.sidebarOpen.set(false);
  }

  userInitial(): string { return (this.auth.currentUser()?.name ?? 'A')[0].toUpperCase(); }

  async confirmLogout(): Promise<void> {
    const r = await Swal.fire({
      title: 'Sair do sistema?', text: 'Você será redirecionado para o login.',
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Sim, sair', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ea580c',
    });
    if (r.isConfirmed) this.auth.logout();
  }

  private startApiPing(): void {
    this.pingSub = timer(0, 30000).subscribe(() => {
      this.http.get('http://localhost:8889/api/actuator/health', { responseType: 'text' })
        .pipe(map(() => 'online' as const), catchError(() => of('offline' as const)))
        .subscribe(s => { this.apiStatus.set(s); this.cdr.markForCheck(); });
    });
  }

  getIcon(icon: string): SafeHtml {
    const icons: Record<string, string> = {
      dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      sale:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>`,
      box:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
      customers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
      shield:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    };
    return this.sanitizer.bypassSecurityTrustHtml(icons[icon] ?? icons['dashboard']);
  }
}