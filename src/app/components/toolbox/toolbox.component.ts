import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionState, ComponentTemplate } from '../../state/selection.state';

@Component({
  selector: 'app-toolbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbox">
      <h3>🧰 Componentes</h3>
      
      <div class="component-list">
        @for (template of availableComponents; track template.type + template.name) {
          <button 
            class="component-btn"
            [class.selected]="isSelected(template)"
            [style.border-color]="template.type === 'WIRE' ? template.color : 'transparent'"
            (click)="selectComponent(template)">
            <span class="icon">{{ template.icon }}</span>
            <span class="name">{{ template.name }}</span>
          </button>
        }
      </div>

      @if (selection.isPlacementMode()) {
        <div class="placement-info">
          <p>📍 Modo colocación activo</p>
          <p><strong>{{ selection.selectedTemplate()?.name }}</strong></p>
          <button class="cancel-btn" (click)="cancelPlacement()">
            ❌ Cancelar
          </button>
        </div>
      }

      @if (selection.isWiringMode()) {
        <div class="placement-info wiring">
          <p>🔌 Modo cableado activo</p>
          <p><strong>{{ selection.selectedTemplate()?.name }}</strong></p>
          @if (selection.wireStartSet()) {
            <p class="step">✅ Punto inicial establecido</p>
            <p class="step">👉 Ahora haz clic en el punto final</p>
          } @else {
            <p class="step">👉 Haz clic en el punto inicial</p>
          }
          <button class="cancel-btn" (click)="cancelPlacement()">
            ❌ Cancelar
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toolbox {
      background: #34495e;
      padding: 20px;
      border-radius: 8px;
      color: white;
      min-width: 200px;
      max-height: 90vh;
      overflow-y: auto;
    }

    h3 {
      margin-top: 0;
      margin-bottom: 15px;
      text-align: center;
    }

    .component-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .component-btn {
      background: #2c3e50;
      border: 2px solid #2c3e50;
      color: white;
      padding: 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.2s;
    }

    .component-btn:hover {
      background: #3d5a6b;
      transform: translateY(-2px);
    }

    .component-btn.selected {
      border-color: #3498db;
      background: #2980b9;
      box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
    }

    .icon {
      font-size: 24px;
    }

    .name {
      font-weight: bold;
      font-size: 14px;
    }

    .placement-info {
      margin-top: 20px;
      padding: 15px;
      background: #2980b9;
      border-radius: 6px;
      text-align: center;
    }

    .placement-info.wiring {
      background: #16a085;
    }

    .placement-info p {
      margin: 5px 0;
    }

    .step {
      font-size: 13px;
      margin: 8px 0;
      padding: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }

    .cancel-btn {
      margin-top: 10px;
      background: #e74c3c;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }

    .cancel-btn:hover {
      background: #c0392b;
    }
  `]
})
export class ToolboxComponent {
  availableComponents: ComponentTemplate[] = [
    { type: 'LED', name: 'LED Rojo', icon: '💡', color: 'red' },
    { type: 'LED', name: 'LED Verde', icon: '💚', color: 'green' },
    { type: 'LED', name: 'LED Azul', icon: '💙', color: 'blue' },
    { type: 'RESISTOR', name: 'Resistor 220Ω', icon: '🔌', resistance: 220 },
    { type: 'RESISTOR', name: 'Resistor 1kΩ', icon: '🔌', resistance: 1000 },
    
    // Cables de diferentes colores
    { type: 'WIRE', name: 'Cable Rojo', icon: '━', color: '#ff0000' },
    { type: 'WIRE', name: 'Cable Negro', icon: '━', color: '#000000' },
    { type: 'WIRE', name: 'Cable Azul', icon: '━', color: '#0000ff' },
    { type: 'WIRE', name: 'Cable Verde', icon: '━', color: '#00ff00' },
    { type: 'WIRE', name: 'Cable Amarillo', icon: '━', color: '#ffff00' },
  ];

  constructor(public selection: SelectionState) {}

  selectComponent(template: ComponentTemplate) {
    this.selection.selectComponent(template);
  }

  cancelPlacement() {
    this.selection.cancelPlacement();
  }

  isSelected(template: ComponentTemplate): boolean {
    const selected = this.selection.selectedTemplate();
    return selected?.type === template.type && 
           selected?.name === template.name;
  }
}