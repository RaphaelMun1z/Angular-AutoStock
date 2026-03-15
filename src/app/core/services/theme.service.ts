import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'autostock_theme';
  theme = signal<Theme>('light');

  init(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    const preferred: Theme = saved ?? 'light';
    this.apply(preferred);
  }

  toggle(): void {
    this.apply(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply(t: Theme): void {
    this.theme.set(t);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(t);
    localStorage.setItem(this.STORAGE_KEY, t);
  }
}
