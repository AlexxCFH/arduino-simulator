import { Injectable, signal } from '@angular/core';
import { Wire } from '../models/electronic-components/wire.model';

export interface ComponentTemplate {
  type: string;
  name: string;
  icon: string;
  color?: string;
  resistance?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SelectionState {
  selectedTemplate = signal<ComponentTemplate | null>(null);
  isPlacementMode = signal<boolean>(false);
  
  // Estado específico para cables
  isWiringMode = signal<boolean>(false);
  currentWire = signal<Wire | null>(null);
  wireStartSet = signal<boolean>(false);

  selectComponent(template: ComponentTemplate) {
    this.selectedTemplate.set(template);
    
    // Si es un cable, activar modo de cableado
    if (template.type.toLowerCase() === 'wire') {
      this.isWiringMode.set(true);
      this.isPlacementMode.set(false);
      console.log('🔌 Modo cableado activado');
    } else {
      this.isPlacementMode.set(true);
      this.isWiringMode.set(false);
    }
  }

  startWire(wire: Wire) {
    this.currentWire.set(wire);
    this.wireStartSet.set(true);
    console.log('📍 Punto inicial del cable establecido');
  }

  completeWire() {
    this.currentWire.set(null);
    this.wireStartSet.set(false);
    this.isWiringMode.set(false);
    this.selectedTemplate.set(null);
    console.log('✅ Cable completado');
  }

  cancelPlacement() {
    this.selectedTemplate.set(null);
    this.isPlacementMode.set(false);
    this.isWiringMode.set(false);
    this.currentWire.set(null);
    this.wireStartSet.set(false);
    console.log('❌ Colocación cancelada');
  }

  getSelectedTemplate() {
    return this.selectedTemplate();
  }
}