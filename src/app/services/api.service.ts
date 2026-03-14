import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResponse } from '../shared/interfaces/models.interface';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly BASE = 'http://localhost:8889/api';

  /**
   * GET Genérico para endpoints que não retornam páginas (ex: stats, DTOs simples)
   */
  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.BASE}${path}`);
  }

  /**
   * Busca paginada profissional com suporte a ordenação
   */
  getAll<T>(
    path: string,
    page = 0,
    size = 12,
    direction = 'asc',
    sort = 'id',
  ): Observable<PagedResponse<T>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('direction', direction)
      .set('sort', sort);

    return this.http.get<PagedResponse<T>>(`${this.BASE}${path}`, { params });
  }

  getById<T>(path: string, id: string): Observable<T> {
    return this.http.get<T>(`${this.BASE}${path}/${id}`);
  }

  create<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.BASE}${path}`, body);
  }

  /**
   * PATCH para atualizações parciais (mais performático e profissional que PUT)
   */
  update<T>(path: string, id: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.BASE}${path}/${id}`, body);
  }

  remove(path: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}${path}/${id}`);
  }

  /**
   * Upload de arquivos com FormData
   */
  uploadFile(file: File): Observable<unknown> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.BASE}/file/upload-file`, fd);
  }
}
