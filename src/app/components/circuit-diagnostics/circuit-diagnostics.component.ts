import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircuitSimulatorService } from '../../services/circuit-simulator.service';
import { LED } from '../../models/electronic-components/led.model';
import { Wire } from '../../models/electronic-components/wire.model';
import { Resistor } from '../../models/electronic-components/resistor.model';

interface DiagnosticResult {
  component: any;
  type: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string[];
}

@Component({
  selector: 'app-circuit-diagnostics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diagnostics-panel">
      <h3>🔍 Diagnóstico del Circuito</h3>
      
      <div class="summary">
        <div class="stat">
          <span class="label">Componentes:</span>
          <span class="value">{{ componentCount() }}</span>
        </div>
        <div class="stat">
          <span class="label">LEDs:</span>
          <span class="value">{{ ledCount() }}</span>
        </div>
        <div class="stat">
          <span class="label">Cables:</span>
          <span class="value">{{ wireCount() }}</span>
        </div>
      </div>

      <div class="diagnostics-list">
        @for (result of diagnostics(); track $index) {
          <div class="diagnostic-item" [class]="result.status">
            <div class="diagnostic-header">
              <span class="icon">
                @if (result.status === 'ok') { ✅ }
                @if (result.status === 'warning') { ⚠️ }
                @if (result.status === 'error') { ❌ }
              </span>
              <span class="type">{{ result.type }}</span>
            </div>
            <div class="diagnostic-message">{{ result.message }}</div>
            @if (result.details && result.details.length > 0) {
              <ul class="diagnostic-details">
                @for (detail of result.details; track $index) {
                  <li>{{ detail }}</li>
                }
              </ul>
            }
          </div>
        }
      </div>

      @if (circuitComplete()) {
        <div class="circuit-complete">
          <h4>🎉 ¡Circuito Completo!</h4>
          <p>El circuito está correctamente conectado.</p>
          <p>Presiona <strong>▶️ Iniciar</strong> y luego <strong>💡 Test Pin</strong></p>
        </div>
      } @else {
        <div class="circuit-incomplete">
          <h4>⚠️ Circuito Incompleto</h4>
          <p>Revisa los mensajes de arriba para completar el circuito.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .diagnostics-panel {
      background: #2c3e50;
      padding: 15px;
      border-radius: 8px;
      color: white;
      max-height: 400px;
      overflow-y: auto;
    }

    h3 {
      margin: 0 0 15px 0;
      text-align: center;
      color: #ecf0f1;
    }

    .summary {
      display: flex;
      gap: 15px;
      justify-content: space-around;
      margin-bottom: 15px;
      padding: 10px;
      background: #34495e;
      border-radius: 6px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .stat .label {
      font-size: 12px;
      color: #95a5a6;
    }

    .stat .value {
      font-size: 20px;
      font-weight: bold;
      color: #3498db;
    }

    .diagnostics-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .diagnostic-item {
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid;
    }

    .diagnostic-item.ok {
      background: rgba(46, 204, 113, 0.1);
      border-color: #2ecc71;
    }

    .diagnostic-item.warning {
      background: rgba(241, 196, 15, 0.1);
      border-color: #f1c40f;
    }

    .diagnostic-item.error {
      background: rgba(231, 76, 60, 0.1);
      border-color: #e74c3c;
    }

    .diagnostic-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;
    }

    .icon {
      font-size: 18px;
    }

    .type {
      font-weight: bold;
      font-size: 14px;
      color: #ecf0f1;
    }

    .diagnostic-message {
      font-size: 13px;
      color: #bdc3c7;
      margin-bottom: 5px;
    }

    .diagnostic-details {
      margin: 8px 0 0 20px;
      padding: 0;
      font-size: 12px;
      color: #95a5a6;
    }

    .diagnostic-details li {
      margin: 3px 0;
    }

    .circuit-complete {
      margin-top: 15px;
      padding: 15px;
      background: rgba(46, 204, 113, 0.2);
      border: 2px solid #2ecc71;
      border-radius: 6px;
      text-align: center;
    }

    .circuit-complete h4 {
      margin: 0 0 8px 0;
      color: #2ecc71;
    }

    .circuit-complete p {
      margin: 5px 0;
      font-size: 13px;
    }

    .circuit-incomplete {
      margin-top: 15px;
      padding: 15px;
      background: rgba(231, 76, 60, 0.2);
      border: 2px solid #e74c3c;
      border-radius: 6px;
      text-align: center;
    }

    .circuit-incomplete h4 {
      margin: 0 0 8px 0;
      color: #e74c3c;
    }

    .circuit-incomplete p {
      margin: 5px 0;
      font-size: 13px;
    }

    .diagnostics-panel::-webkit-scrollbar {
      width: 6px;
    }

    .diagnostics-panel::-webkit-scrollbar-track {
      background: #34495e;
    }

    .diagnostics-panel::-webkit-scrollbar-thumb {
      background: #3498db;
      border-radius: 3px;
    }
  `]
})
export class CircuitDiagnosticsComponent {
  
  componentCount = computed(() => this.simulator.components().length);
  ledCount = computed(() => this.simulator.components().filter(c => c instanceof LED).length);
  wireCount = computed(() => this.simulator.components().filter(c => c instanceof Wire).length);
  
  diagnostics = computed(() => {
    const results: DiagnosticResult[] = [];
    const components = this.simulator.components();
    
    // Analizar LEDs
    const leds = components.filter(c => c instanceof LED) as LED[];
    for (const led of leds) {
      const ledResult = this.analyzeLED(led, components);
      results.push(ledResult);
    }
    
    // Analizar cables
    const wires = components.filter(c => c instanceof Wire) as Wire[];
    for (const wire of wires) {
      const wireResult = this.analyzeWire(wire);
      results.push(wireResult);
    }
    
    return results;
  });

  circuitComplete = computed(() => {
    return this.diagnostics().every(d => d.status === 'ok');
  });

  constructor(private simulator: CircuitSimulatorService) {}

  private analyzeLED(led: LED, components: any[]): DiagnosticResult {
  const details: string[] = [];
  let status: 'ok' | 'warning' | 'error' = 'ok';
  
  const anodePos = led.getAnode().position;
  const cathodePos = led.getCathode().position;
  
  let message = `LED ${led.color} en [${led.position.row},${led.position.col}]`;
  
  details.push(`📍 Ánodo (+): [${anodePos.row},${anodePos.col}]`);
  details.push(`📍 Cátodo (-): [${cathodePos.row},${cathodePos.col}]`);

  const anodeConnected = this.isConnectedToVoltage(led.getAnode(), components);
  const cathodeConnected = this.isConnectedToGround(led.getCathode(), components);

  if (!anodeConnected) {
    status = 'error';
    details.push(`❌ Necesita cable desde D13 (o 5V) a [${anodePos.row},${anodePos.col}]`);
  } else {
    details.push(`✅ Ánodo conectado a voltaje`);
  }

  if (!cathodeConnected) {
    status = 'error';
    details.push(`❌ Necesita cable desde [${cathodePos.row},${cathodePos.col}] a GND`);
  } else {
    details.push(`✅ Cátodo conectado a GND`);
  }

  // Mostrar voltajes actuales
  const anodeVoltage = led.getAnode().voltage;
  const cathodeVoltage = led.getCathode().voltage;
  
  details.push(`⚡ Voltaje ánodo: ${anodeVoltage.toFixed(2)}V`);
  details.push(`⚡ Voltaje cátodo: ${cathodeVoltage.toFixed(2)}V`);
  details.push(`⚡ Diferencia: ${(anodeVoltage - cathodeVoltage).toFixed(2)}V`);

  if (status === 'ok') {
    message = led.isOn ? `✓ LED ${led.color} ENCENDIDO 💡` : `✓ LED ${led.color} listo (apagado)`;
  } else {
    message = `✗ LED ${led.color} necesita conexiones`;
  }

  return {
    component: led,
    type: `LED ${led.color}`,
    status,
    message,
    details
  };
}

  private analyzeWire(wire: Wire): DiagnosticResult {
    if (!wire.isComplete()) {
      return {
        component: wire,
        type: 'Cable',
        status: 'error',
        message: 'Cable incompleto',
        details: ['El cable necesita dos extremos conectados']
      };
    }

    return {
      component: wire,
      type: 'Cable',
      status: 'ok',
      message: wire.getConnectionDescription(),
      details: []
    };
  }

  private isConnectedToVoltage(pin: any, components: any[]): boolean {
    const wires = components.filter(c => c instanceof Wire) as Wire[];
    const pinPos = pin.position;

    for (const wire of wires) {
      if (!wire.isComplete()) continue;

      const start = wire.startConnection;
      const end = wire.endConnection;

      // Verificar si el cable conecta este pin
      const connectsToPin = 
        (start?.type === 'protoboard' && start.row === pinPos.row && start.col === pinPos.col) ||
        (end?.type === 'protoboard' && end.row === pinPos.row && end.col === pinPos.col);

      if (!connectsToPin) continue;

      // Verificar si el otro extremo está en Arduino con voltaje
      const otherEnd = 
        (start?.type === 'protoboard' && start.row === pinPos.row && start.col === pinPos.col) 
          ? end 
          : start;

      if (otherEnd?.type === 'arduino') {
        // Pines digitales o 5V
        if (otherEnd.pinType === 'D' || 
            (otherEnd.pinType === 'PWR' && (otherEnd.pinIndex === '5V' || otherEnd.pinIndex === '3.3V'))) {
          return true;
        }
      }
    }

    return false;
  }

  private isConnectedToGround(pin: any, components: any[]): boolean {
    const wires = components.filter(c => c instanceof Wire) as Wire[];
    const pinPos = pin.position;

    for (const wire of wires) {
      if (!wire.isComplete()) continue;

      const start = wire.startConnection;
      const end = wire.endConnection;

      const connectsToPin = 
        (start?.type === 'protoboard' && start.row === pinPos.row && start.col === pinPos.col) ||
        (end?.type === 'protoboard' && end.row === pinPos.row && end.col === pinPos.col);

      if (!connectsToPin) continue;

      const otherEnd = 
        (start?.type === 'protoboard' && start.row === pinPos.row && start.col === pinPos.col) 
          ? end 
          : start;

      if (otherEnd?.type === 'arduino' && 
          otherEnd.pinType === 'PWR' && 
          otherEnd.pinIndex === 'GND') {
        return true;
      }
    }

    return false;
  }
}