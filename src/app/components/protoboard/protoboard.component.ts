import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircuitSimulatorService } from '../../services/circuit-simulator.service';
import { ComponentFactoryService } from '../../services/component-factory.service';
import { SelectionState } from '../../state/selection.state';
import { LED } from '../../models/electronic-components/led.model';
import { Wire } from '../../models/electronic-components/wire.model';
import { Resistor } from '../../models/electronic-components/resistor.model';

@Component({
  selector: 'app-protoboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './protoboard.component.html',
  styleUrls: ['./protoboard.component.css']
})
export class ProtoboardComponent {
  // Filas superiores (A-E): 0-4
  topRows = Array.from({ length: 5 }, (_, i) => i);
  
  // Filas inferiores (F-J): 5-9
  bottomRows = Array.from({ length: 5 }, (_, i) => i + 5);
  
  // Columnas: 0-29 (30 columnas)
  cols = Array.from({ length: 30 }, (_, i) => i);

  // Computed para contar componentes
  componentCount = computed(() => this.simulator.components().length);

  // Labels de filas (A-J)
  private rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  constructor(
    public simulator: CircuitSimulatorService,
    public selection: SelectionState,
    private factory: ComponentFactoryService
  ) {}

  /**
   * Obtiene el label de una fila (A-J)
   */
  getRowLabel(row: number): string {
    return this.rowLabels[row] || '';
  }

  /**
   * Maneja el clic en un agujero de la protoboard
   */
  onHoleClick(row: number, col: number) {
    const holeLabel = `${this.getRowLabel(row)}${col + 1}`;

    // ============================================
    // MODO CABLEADO
    // ============================================
    if (this.selection.isWiringMode()) {
      const template = this.selection.getSelectedTemplate();
      if (!template) return;

      if (!this.selection.wireStartSet()) {
        const wire = this.factory.createComponent('WIRE', { row, col }, template) as Wire;
        wire.setStart({ type: 'protoboard', row, col });
        this.selection.startWire(wire);
        console.log(`🔌 Cable iniciado en ${holeLabel}`);
        return;
      }

      const currentWire = this.selection.currentWire();
      if (currentWire) {
        currentWire.setEnd({ type: 'protoboard', row, col });
        this.simulator.addComponent(currentWire);
        console.log(`✅ Cable completado: ${currentWire.getConnectionDescription()}`);
        this.selection.completeWire();
      }
      return;
    }

    // ============================================
    // MODO COLOCACIÓN
    // ============================================
    if (this.selection.isPlacementMode()) {
      const template = this.selection.getSelectedTemplate();
      if (!template) return;

      if (template.type.toLowerCase() === 'led' || template.type.toLowerCase() === 'resistor') {
        if (this.isOccupied(row, col) || this.isOccupied(row, col + 1)) {
          console.warn(`⚠️ Posición ${holeLabel} ocupada - el componente necesita 2 agujeros consecutivos`);
          return;
        }

        if (col + 1 >= this.cols.length) {
          console.warn(`⚠️ No hay espacio suficiente - el componente necesita 2 agujeros consecutivos`);
          return;
        }
      } else {
        if (this.isOccupied(row, col)) {
          console.warn(`⚠️ Posición ${holeLabel} ocupada`);
          return;
        }
      }

      const component = this.factory.createComponent(template.type, { row, col }, template);
      this.simulator.addComponent(component);
      console.log(`✅ ${component.type} colocado en ${holeLabel}`);
      this.selection.cancelPlacement();
      return;
    }

    // ============================================
    // MODO NORMAL (Ver información)
    // ============================================
    const component = this.getComponentAt(row, col);
    if (component) {
      console.log(`📍 Componente en ${holeLabel}:`, component);
      console.log('  - Tipo:', component.type);
      console.log('  - ID:', component.id);
      console.log('  - Posición:', component.position);

      if (component instanceof Wire) {
        const wire = component as Wire;
        console.log('  - Conexión:', wire.getConnectionDescription());
        console.log('  - Color:', wire.color);
        console.log('  - Completo:', wire.isComplete() ? 'Sí' : 'No');
      }

      if (component instanceof LED) {
        const led = component as LED;
        console.log('  - Estado:', led.isOn ? '✅ Encendido' : '❌ Apagado');
        console.log('  - Color:', led.color);
        console.log('  - Voltaje ánodo:', led.getAnode().voltage.toFixed(2) + 'V');
        console.log('  - Voltaje cátodo:', led.getCathode().voltage.toFixed(2) + 'V');
        console.log('  - Diferencia:', (led.getAnode().voltage - led.getCathode().voltage).toFixed(2) + 'V');
        console.log('  - Umbral:', led.thresholdVoltage + 'V');
      }

      if (component instanceof Resistor) {
        const resistor = component as Resistor;
        console.log('  - Resistencia:', resistor.getResistanceValue());
        console.log('  - Caída de voltaje:', resistor.voltageDrop.toFixed(2) + 'V');
        console.log('  - Corriente:', (resistor.current * 1000).toFixed(2) + 'mA');
      }
    } else {
      console.log(`📍 ${holeLabel}: Libre`);
    }
  }

  /**
   * Verifica si una posición está ocupada
   */
  isOccupied(row: number, col: number): boolean {
    return this.simulator.isPositionOccupied(row, col);
  }

  /**
   * Obtiene el componente en una posición
   */
  getComponentAt(row: number, col: number) {
    return this.simulator.getComponentAt(row, col);
  }

  /**
   * Verifica si esta posición es el inicio de un cable en progreso
   */
  isWireStart(row: number, col: number): boolean {
    if (!this.selection.isWiringMode() || !this.selection.wireStartSet()) {
      return false;
    }

    const currentWire = this.selection.currentWire();
    if (!currentWire) return false;

    const start = currentWire.startConnection;
    return start?.type === 'protoboard' && start.row === row && start.col === col;
  }

  /**
   * Verifica si este agujero es un tipo específico de pin
   */
  isPinType(row: number, col: number, label: string): boolean {
    const components = this.simulator.components();

    for (const component of components) {
      if (label === 'RESISTOR' && component instanceof Resistor) {
        for (const pin of component.pins) {
          if (pin.position.row === row && pin.position.col === col) {
            return true;
          }
        }
      }

      for (const pin of component.pins) {
        if (pin.position.row === row && pin.position.col === col && pin.label === label) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Verifica si el pin de un LED está encendido
   * Usado para aplicar el efecto de parpadeo
   */
  isPinOn(row: number, col: number): boolean {
    const component = this.getComponentAt(row, col);
    if (!component || !(component instanceof LED)) {
      return false;
    }

    const led = component as LED;
    return led.isOn;
  }

  /**
   * Obtiene el color del LED para un pin específico
   * Usado para el atributo data-led-color en el HTML
   */
  getLEDColorForPin(row: number, col: number): string | null {
    const component = this.getComponentAt(row, col);
    if (!component || !(component instanceof LED)) {
      return null;
    }

    const led = component as LED;
    return led.color;
  }

  /**
   * Obtiene el título descriptivo del agujero para el tooltip
   */
  getHoleTitle(row: number, col: number): string {
    const component = this.getComponentAt(row, col);
    const holeLabel = `${this.getRowLabel(row)}${col + 1}`;

    if (component) {
      if (component instanceof LED) {
        const led = component as LED;
        const pin = led.pins.find(p => p.position.row === row && p.position.col === col);

        if (pin) {
          const pinName = pin.label === 'A+' ? 'Ánodo (+)' : 'Cátodo (-)';
          const status = led.isOn ? 'Encendido ✨' : 'Apagado';
          return `${holeLabel}\nLED ${led.color} - ${pinName}\nVoltaje: ${pin.voltage.toFixed(2)}V\nEstado: ${status}`;
        }
      }

      if (component instanceof Resistor) {
        const resistor = component as Resistor;
        const pin = resistor.pins.find(p => p.position.row === row && p.position.col === col);
        const pinLabel = pin?.label || 'Pin';
        return `${holeLabel}\nResistor ${resistor.getResistanceValue()}\n${pinLabel}\nVoltaje: ${pin?.voltage.toFixed(2)}V`;
      }

      if (component instanceof Wire) {
        const wire = component as Wire;
        return `${holeLabel}\nCable ${wire.color}\n${wire.getConnectionDescription()}`;
      }

      return `${holeLabel}\n${component.type}`;
    }

    const section = row < 5 ? 'Superior (A-E)' : 'Inferior (F-J)';
    return `${holeLabel}\nLibre\nSección: ${section}\nConectado verticalmente en esta columna`;
  }

  /**
   * Verifica si un LED está encendido
   */
  isLEDOn(component: any): boolean {
    return component instanceof LED && component.isOn;
  }

  /**
   * Obtiene el color del LED para visualización
   */
  getLEDColor(component: any): string {
    if (component instanceof LED && component.isOn) {
      switch (component.color) {
        case 'red':
          return '#ff4444';
        case 'green':
          return '#44ff44';
        case 'blue':
          return '#4444ff';
        case 'yellow':
          return '#ffff44';
        default:
          return '#ffffff';
      }
    }

    if (component instanceof Wire) {
      return (component as Wire).color;
    }

    return '#666666';
  }

  /**
   * Obtiene el ícono del componente según su tipo y posición
   */
  getComponentIcon(component: any, row: number, col: number): string {
    if (component instanceof LED) {
      const led = component as LED;
      const pin = led.pins.find(p => p.position.row === row && p.position.col === col);

      if (pin) {
        return pin.label === 'A+' ? '+' : '-';
      }

      return '💡';
    }

    if (component instanceof Resistor) {
      return 'R';
    }

    if (component instanceof Wire) {
      return '━';
    }

    return component.type ? component.type.substring(0, 1).toUpperCase() : '?';
  }
}