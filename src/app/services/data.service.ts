import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

// Interfaz para tipado fuerte
export interface Registro {
  internal_key: string;
  dni_productor: string;
  nombre_completo: string;
  tipo_cultivo: string;
  area_ha: number;
  geojson: any; // Objeto GeoJSON
  fotos: { id: number; tipo_foto: string; url: string }[];
  fecha_creacion: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = 'https://backend-geodais.onrender.com/api';

  // Signals para el estado reactivo
  registros = signal<Registro[]>([]);
  selectedRegistro = signal<Registro | null>(null);
  loading = signal<boolean>(false);

  constructor() {
    // Solo cargar datos si estamos en el navegador para evitar bloqueos en SSR
    if (isPlatformBrowser(this.platformId)) {
      this.loadRegistros();
    }
  }

  loadRegistros() {
    this.loading.set(true);
    this.http.get<Registro[]>(`${this.apiUrl}/registros`)
      .subscribe({
        next: (data) => {
          this.registros.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando registros', err);
          this.loading.set(false);
        }
      });
  }

  selectRegistro(registro: Registro) {
    this.selectedRegistro.set(registro);
  }
}
