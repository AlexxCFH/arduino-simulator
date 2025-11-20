import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircuitSimulatorService } from '../../services/circuit-simulator.service';
import { ComponentFactoryService } from '../../services/component-factory.service';
import { SelectionState } from '../../state/selection.state';
import { LED } from '../../models/electronic-components/led.model';
import { Wire } from '../../models/electronic-components/wire.model';

@Component({
  selector: 'app-arduino-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="arduino-container">
      <h2>Arduino UNO Virtual</h2>

      <div class="board">
        <!-- Header: status + count -->
        <div class="header">
          <div>📦 Componentes: {{ componentCount() }}</div>
          <div>⚡ Estado: {{ simulator.isRunning() ? '🟢 Corriendo' : '🔴 Detenido' }}</div>
          
          @if (selection.isPlacementMode()) {
            <div class="placement-hint">
              👆 Haz clic en un pin para colocar:
              <strong>{{ selection.selectedTemplate()?.name }}</strong>
            </div>
          }

          @if (selection.isWiringMode()) {
            <div class="placement-hint wiring">
              🔌 Modo cableado: 
              <strong>{{ selection.selectedTemplate()?.name }}</strong>
              @if (selection.wireStartSet()) {
                <span class="step">✅ Punto inicial → 👆 Selecciona punto final</span>
              } @else {
                <span class="step">👆 Selecciona punto inicial</span>
              }
            </div>
          }
        </div>

        <!-- DIGITAL PINS -->
        <div class="section">
          <h3>Digital (D0 - D13)</h3>
          <div class="pins-row">
            @for (pin of digitalPins; track pin) {
              <div class="pin"
                   (click)="onPinClick('D', pin)"
                   [class.occupied]="isPinOccupied('D', pin)"
                   [class.hover-valid]="(selection.isPlacementMode() || selection.isWiringMode()) && !isPinOccupied('D', pin)"
                   [class.pwm]="isPWMPin(pin)"
                   [class.wire-start]="isWireStart('D', pin)"
                   [title]="getPinTitle('D', pin)">
                <div class="pin-label">
                  D{{ pin }}
                  @if (isPWMPin(pin)) {
                    <span class="pwm-indicator">~</span>
                  }
                </div>
                @if (getComponentOnPin('D', pin); as component) {
                  <span class="component-icon"
                        [class.led-on]="isLEDOn(component)"
                        [style.color]="getLEDColor(component)">
                    {{ getComponentIcon(component) }}
                  </span>
                }
              </div>
            }
          </div>
        </div>

        <!-- POWER PINS -->
        <div class="section">
          <h3>Power</h3>
          <div class="pins-row">
            @for (pin of powerPins; track pin) {
              <div class="pin power"
                   (click)="onPinClick('PWR', pin)"
                   [class.occupied]="isPinOccupied('PWR', pin)"
                   [class.hover-valid]="(selection.isPlacementMode() || selection.isWiringMode()) && !isPinOccupied('PWR', pin)"
                   [class.gnd]="pin === 'GND'"
                   [class.voltage]="pin === '5V' || pin === '3.3V'"
                   [class.wire-start]="isWireStart('PWR', pin)"
                   [title]="pin">
                <div class="pin-label">{{ pin }}</div>
                @if (getComponentOnPin('PWR', pin); as component) {
                  <span class="component-icon"
                        [class.led-on]="isLEDOn(component)"
                        [style.color]="getLEDColor(component)">
                    {{ getComponentIcon(component) }}
                  </span>
                }
              </div>
            }
          </div>
        </div>

        <!-- ANALOG PINS -->
        <div class="section">
          <h3>Analog (A0 - A5)</h3>
          <div class="pins-row">
            @for (pin of analogPins; track pin) {
              <div class="pin analog"
                   (click)="onPinClick('A', pin)"
                   [class.occupied]="isPinOccupied('A', pin)"
                   [class.hover-valid]="(selection.isPlacementMode() || selection.isWiringMode()) && !isPinOccupied('A', pin)"
                   [class.wire-start]="isWireStart('A', pin)"
                   [title]="'Pin Analógico A' + pin">
                <div class="pin-label">A{{ pin }}</div>
                @if (getComponentOnPin('A', pin); as component) {
                  <span class="component-icon"
                        [class.led-on]="isLEDOn(component)"
                        [style.color]="getLEDColor(component)">
                    {{ getComponentIcon(component) }}
                  </span>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .arduino-container {
      background: #ecf0f1;
      padding: 18px;
      border-radius: 8px;
    }

    h2 {
      text-align: center;
      margin: 0 0 12px;
      color: #2c3e50;
    }

    .board {
      background: linear-gradient(180deg, #1f4d7a, #173a57);
      padding: 18px;
      border-radius: 10px;
      color: #fff;
      width: fit-content;
      margin: 0 auto;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25);
    }

    .header {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      font-weight: 600;
      flex-wrap: wrap;
    }

    .placement-hint {
      background: #3498db;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }

    .placement-hint.wiring {
      background: #16a085;
    }

    .step {
      display: block;
      margin-top: 5px;
      font-size: 13px;
      opacity: 0.95;
    }

    .section {
      margin: 10px 0;
    }

    .section h3 {
      text-align: center;
      margin: 8px 0;
      font-size: 16px;
      color: #ecf0f1;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .pins-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      padding: 8px 4px;
    }

    .pin {
      background: #34495e;
      min-width: 56px;
      height: 56px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform .15s ease, background .15s ease, box-shadow .15s ease;
      position: relative;
      border: 2px solid rgba(0,0,0,0.15);
    }

    .pin:hover {
      transform: translateY(-4px) scale(1.03);
      background: #4a6278;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .pin.pwm {
      background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
      border-color: #e67e22;
    }

    .pin.pwm:hover {
      background: linear-gradient(135deg, #4a6278 0%, #34495e 100%);
      border-color: #f39c12;
    }

    .pin.power {
      background: #d35400;
      color: white;
      font-weight: bold;
    }

    .pin.power:hover {
      background: #e67e22;
    }

    .pin.power.voltage {
      background: #c0392b;
    }

    .pin.power.voltage:hover {
      background: #e74c3c;
    }

    .pin.power.gnd {
      background: #2c3e50;
      border-color: #34495e;
    }

    .pin.power.gnd:hover {
      background: #34495e;
    }

    .pin.analog {
      background: #16a085;
    }

    .pin.analog:hover {
      background: #1abc9c;
    }

    .pin.occupied {
      background: #95a5a6;
      border-color: #7f8c8d;
      color: #2c3e50;
    }

    .pin.occupied:hover {
      background: #7f8c8d;
    }

    .pin.hover-valid {
      background: #27ae60;
      border-color: #2ecc71;
      animation: pulse 0.6s infinite;
      color: white;
      box-shadow: 0 0 15px rgba(46, 204, 113, 0.6);
    }

    .pin.wire-start {
      background: #e67e22;
      border-color: #f39c12;
      animation: blink 1s infinite;
      box-shadow: 0 0 15px rgba(230, 126, 34, 0.6);
    }

    .pin-label {
      font-weight: 700;
      font-size: 13px;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .pwm-indicator {
      font-size: 10px;
      color: #f39c12;
      font-weight: bold;
    }

    .component-icon {
      position: absolute;
      bottom: 4px;
      font-size: 18px;
      pointer-events: none;
      transition: all 0.25s;
    }

    .led-on {
      filter: drop-shadow(0 0 8px currentColor);
      animation: glow 1s infinite;
    }

    @keyframes glow {
      0%, 100% { 
        opacity: 1; 
        transform: scale(1);
      }
      50% { 
        opacity: 0.7; 
        transform: scale(1.1);
      }
    }

    @keyframes pulse {
      0%, 100% { 
        transform: scale(1); 
      }
      50% { 
        transform: scale(1.08); 
      }
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    @media (max-width: 768px) {
      .board {
        padding: 12px;
      }

      .header {
        flex-direction: column;
        gap: 8px;
      }

      .pin {
        min-width: 48px;
        height: 48px;
      }

      .pins-row {
        gap: 6px;
      }
    }
  `]
})
export class ArduinoBoardComponent {
  digitalPins = Array.from({ length: 14 }, (_, i) => i);
  analogPins = Array.from({ length: 6 }, (_, i) => i);
  powerPins = ['5V', '3.3V', 'GND', 'VIN', 'RESET'];
  pwmPins = [3, 5, 6, 9, 10, 11];

  componentCount = computed(() => this.simulator.components().length);

  constructor(
    public simulator: CircuitSimulatorService,
    public selection: SelectionState,
    private factory: ComponentFactoryService
  ) {}

  /**
   * Maneja el clic en un pin del Arduino
   */
  onPinClick(type: 'D' | 'A' | 'PWR', index: any) {
    console.log(`🖱️ Click en Arduino ${type}${index}`);

    // ============================================
    // MODO CABLEADO (Conectar cables)
    // ============================================
    if (this.selection.isWiringMode()) {
      const template = this.selection.getSelectedTemplate();
      if (!template) return;

      // Primer clic: establecer punto inicial del cable
      if (!this.selection.wireStartSet()) {
        const wire = this.factory.createComponent(
          'WIRE',
          { row: -1, col: 0 },
          template
        ) as Wire;

        wire.setStart({
          type: 'arduino',
          pinType: type,
          pinIndex: index
        });

        this.selection.startWire(wire);
        console.log(`🔌 Cable iniciado en Arduino ${type}${index}`);
        return;
      }

      // Segundo clic: establecer punto final del cable
      const currentWire = this.selection.currentWire();
      if (currentWire) {
        currentWire.setEnd({
          type: 'arduino',
          pinType: type,
          pinIndex: index
        });

        this.simulator.addComponent(currentWire);
        this.simulator.connectToPin(currentWire, { 
          board: 'arduino', 
          type, 
          index 
        });
        
        console.log(`✅ Cable completado: ${currentWire.getConnectionDescription()}`);
        this.selection.completeWire();
      }
      return;
    }

    // ============================================
    // MODO COLOCACIÓN (Componentes directos)
    // ============================================
    if (this.selection.isPlacementMode()) {
      const template = this.selection.getSelectedTemplate();
      if (!template) return;

      if (this.isPinOccupied(type, index)) {
        console.warn(`⚠️ Pin ${type}${index} ya está ocupado`);
        return;
      }

      const component = this.factory.createComponent(
        template.type,
        { row: -1, col: 0 },
        template
      );

      this.simulator.addComponent(component);
      
      const connected = this.simulator.connectToPin(component, { 
        board: 'arduino', 
        type, 
        index 
      });

      if (connected) {
        console.log(`📌 ${component.type} colocado en pin ${type}${index}`);
      } else {
        console.error(`❌ No se pudo conectar al pin ${type}${index}`);
        this.simulator.removeComponent(component.id);
      }

      this.selection.cancelPlacement();
      return;
    }

    // ============================================
    // MODO NORMAL (Ver información)
    // ============================================
    const component = this.getComponentOnPin(type, index);
    if (component) {
      console.log(`📍 Pin ${type}${index}:`, component);
      console.log('  - Tipo:', component.type);
      console.log('  - ID:', component.id);
      if (component instanceof Wire) {
        console.log('  - Conexión:', (component as Wire).getConnectionDescription());
      }
    } else {
      console.log(`📍 Pin ${type}${index}: Libre`);
    }
  }

  /**
   * Verifica si un pin está ocupado
   */
  isPinOccupied(type: string, index: any): boolean {
    if (typeof this.simulator.isPinOccupied === 'function') {
      try {
        return this.simulator.isPinOccupied({ board: 'arduino', type, index });
      } catch (error) {
        console.warn('Error al verificar pin ocupado:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Obtiene el componente conectado a un pin
   */
  getComponentOnPin(type: string, index: any) {
    if (typeof this.simulator.getComponentOnPin === 'function') {
      try {
        return this.simulator.getComponentOnPin({ board: 'arduino', type, index });
      } catch (error) {
        console.warn('Error al obtener componente del pin:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Verifica si este pin es el inicio de un cable en progreso
   */
  isWireStart(type: string, index: any): boolean {
    if (!this.selection.isWiringMode() || !this.selection.wireStartSet()) {
      return false;
    }

    const currentWire = this.selection.currentWire();
    if (!currentWire) return false;

    const start = currentWire.startConnection;
    return start?.type === 'arduino' && 
           start.pinType === type && 
           start.pinIndex === index;
  }

  /**
   * Verifica si un pin es PWM
   */
  isPWMPin(pin: number): boolean {
    return this.pwmPins.includes(pin);
  }

  /**
   * Genera el título del pin para el tooltip
   */
  getPinTitle(type: string, index: any): string {
    let title = `Pin ${type}${index}`;
    
    if (type === 'D' && this.isPWMPin(index)) {
      title += ' (PWM)';
    }
    
    const component = this.getComponentOnPin(type, index);
    if (component) {
      title += ` - ${component.type}`;
      if (component instanceof Wire) {
        title += ` | ${(component as Wire).getConnectionDescription()}`;
      }
    } else {
      title += ' - Libre';
    }
    
    return title;
  }

  isLEDOn(component: any): boolean {
    return component instanceof LED && component.isOn;
  }

  getLEDColor(component: any): string {
    if (component instanceof LED && component.isOn) {
      switch(component.color) {
        case 'red': return '#ff4444';
        case 'green': return '#44ff44';
        case 'blue': return '#4444ff';
        case 'yellow': return '#ffff44';
        default: return '#ffffff';
      }
    }
    return '#666666';
  }

  getComponentIcon(component: any): string {
    if (!component) return '';
    
    if (component instanceof LED) {
      return '💡';
    }
    
    if (component instanceof Wire) {
      return '━';
    }
    
    return component.type ? component.type.substring(0, 1).toUpperCase() : '?';
  }
}