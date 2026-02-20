import { Component, inject, effect, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';

import { DataService } from '../../services/data.service';
import type { Map, GeoJSON } from 'leaflet'; // Importamos solo los TIPOS, no la librería completa

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    DatePipe
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements AfterViewInit {

    dataService = inject(DataService);
    private platformId = inject(PLATFORM_ID); // Para detectar si estamos en el navegador

    private map: Map | undefined;
    private geoJsonLayer: GeoJSON | undefined;

    // Propiedad para controlar el modal de fotos
    selectedPhotoIndex: number | null = null;
    currentCoordinates: string | null = null;

    @ViewChild('mapContainer') mapContainer!: ElementRef;

    constructor() {
    // Effect: Reacciona automáticamente cuando cambia el registro seleccionado
    effect(() => {
      const selected = this.dataService.selectedRegistro();
      if (selected && this.map) {
        this.showGeometry(selected);
      }
    });
  }
  ngAfterViewInit() {
    // Solo inicializamos el mapa si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
    }
  }

  private async initMap() {
    // Importación dinámica: Carga Leaflet solo cuando se necesita en el navegador
    const L = await import('leaflet').then(module => module.default || module) as any;

    // Inicializa el mapa centrado en Perú
    this.map = L.map(this.mapContainer.nativeElement).setView([-9.00, -70.0152], 6);

    // Capa de Calles (OpenStreetMap)
    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });

    // Capa Satelital (Esri World Imagery)
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // Añadir capa por defecto y el control de capas
    streets.addTo(this.map!);
    L.control.layers({ "Calles": streets, "Satélite": satellite }).addTo(this.map!);
  }

  private async showGeometry(registro: any) {
    const L = await import('leaflet').then(module => module.default || module) as any;

    if (this.geoJsonLayer) {
      this.map?.removeLayer(this.geoJsonLayer);
    }

    if (registro.geojson) {
      this.geoJsonLayer = L.geoJSON(registro.geojson, {
        style: { color: '#3880ff', weight: 4, fillOpacity: 0.4 }
      }).addTo(this.map!);

      try {
        const bounds = this.geoJsonLayer.getBounds();
        this.map?.fitBounds(bounds);

        const center = bounds.getCenter();
        this.currentCoordinates = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
      } catch (e) {
        console.warn('Geometría inválida o vacía');
        this.currentCoordinates = null;
      }
    } else {
      this.currentCoordinates = null;
    }
  }

  // Métodos para el modal de fotos
  openPhoto(index: number) {
    this.selectedPhotoIndex = index;
  }

  closePhoto() {
    this.selectedPhotoIndex = null;
  }

  nextPhoto() {
    const registro = this.dataService.selectedRegistro();
    if (registro?.fotos && this.selectedPhotoIndex !== null) {
      // Usamos módulo (%) para que al llegar al final vuelva al principio
      this.selectedPhotoIndex = (this.selectedPhotoIndex + 1) % registro.fotos.length;
    }
  }

  prevPhoto() {
    const registro = this.dataService.selectedRegistro();
    if (registro?.fotos && this.selectedPhotoIndex !== null) {
      // Sumamos la longitud antes del módulo para manejar índices negativos correctamente
      this.selectedPhotoIndex = (this.selectedPhotoIndex - 1 + registro.fotos.length) % registro.fotos.length;
    }
  }

  get currentPhotoUrl(): string | null {
    const registro = this.dataService.selectedRegistro();
    if (registro?.fotos && this.selectedPhotoIndex !== null) {
      return registro.fotos[this.selectedPhotoIndex]?.url || null;
    }
    return null;
  }
}
