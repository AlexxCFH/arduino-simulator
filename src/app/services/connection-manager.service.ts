import { Injectable } from '@angular/core';
import { Component, Pin } from '../models/component.model';
import { Wire, WireConnection } from '../models/electronic-components/wire.model';
import { Circuit } from '../models/circuit.model';
import { LED } from '../models/electronic-components/led.model';
import { Resistor } from '../models/electronic-components/resistor.model';

export interface ConnectionMap {
  [pinId: string]: {
    voltage: number;
    connectedTo: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionManagerService {
  private circuit: Circuit = new Circuit();

  constructor() { }

  updateCircuit(components: Component[]): void {
    this.circuit.components = components;
    this.analyzeConnections();
  }

  private analyzeConnections(): void {
    this.circuit.nodes.clear();

    const wires = this.circuit.components.filter(c => c instanceof Wire) as Wire[];
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 ANÁLISIS DE CONEXIONES');
    console.log(`📦 Total componentes: ${this.circuit.components.length}`);
    console.log(`🔌 Total cables: ${wires.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const wire of wires) {
      if (!wire.isComplete()) {
        console.warn('⚠️ Cable incompleto encontrado:', wire.id);
        continue;
      }

      const startPinId = this.connectionToPinId(wire.startConnection!);
      const endPinId = this.connectionToPinId(wire.endConnection!);

      console.log(`🔗 Cable: ${startPinId} ⟷ ${endPinId}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    this.detectCompleteCircuits();
  }

  private detectCompleteCircuits(): void {
    const leds = this.circuit.components.filter(c => c instanceof LED) as LED[];

    console.log('🔎 DETECCIÓN DE CIRCUITOS COMPLETOS');
    console.log(`💡 LEDs encontrados: ${leds.length}`);

    for (const led of leds) {
      console.log(`\n🔍 Analizando LED ${led.color} en [${led.position.row},${led.position.col}]`);

      const anodePinId = this.pinToId(led.getAnode());
      const cathodePinId = this.pinToId(led.getCathode());

      console.log(`   Ánodo: ${anodePinId} (${this.getRowLabel(led.getAnode().position.row)}${led.getAnode().position.col + 1})`);
      console.log(`   Cátodo: ${cathodePinId} (${this.getRowLabel(led.getCathode().position.row)}${led.getCathode().position.col + 1})`);

      const anodeConnections = this.circuit.findConnectedPins(anodePinId);
      const cathodeConnections = this.circuit.findConnectedPins(cathodePinId);

      console.log(`   Ánodo conectado a ${anodeConnections.length} pines`);
      console.log(`   Cátodo conectado a ${cathodeConnections.length} pines`);

      const hasVoltageSource = anodeConnections.some(pinId =>
        pinId.includes('arduino_D_') || pinId.includes('arduino_PWR_5V')
      );

      const hasGround = cathodeConnections.some(pinId =>
        pinId.includes('arduino_PWR_GND')
      );

      if (hasVoltageSource) {
        const voltagePin = anodeConnections.find(p => p.includes('arduino_D_') || p.includes('arduino_PWR_5V'));
        console.log(`   ✅ Fuente de voltaje encontrada: ${voltagePin}`);
      } else {
        console.log(`   ❌ No hay fuente de voltaje conectada al ánodo`);
      }

      if (hasGround) {
        console.log(`   ✅ GND encontrado en cátodo`);
      } else {
        console.log(`   ❌ No hay GND conectado al cátodo`);
      }

      if (hasVoltageSource && hasGround) {
        console.log(`   🎉 ¡Circuito completo!`);
      } else {
        console.log(`   ⚠️ Circuito incompleto`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  private getRowLabel(row: number): string {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return labels[row] || '?';
  }

  propagateVoltages(arduinoVoltages: Map<string, number>): void {
    console.log('⚡ PROPAGACIÓN DE VOLTAJES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // PASO 1: Establecer voltajes del Arduino en el circuito
    console.log('\n📍 PASO 1: Voltajes del Arduino');
    arduinoVoltages.forEach((voltage, pinId) => {
      if (voltage !== 0) {
        console.log(`   ${pinId}: ${voltage}V`);
      }
      
      const connection = this.pinIdToConnection(pinId);
      if (connection) {
        this.circuit.setVoltageAt(connection, voltage);
      }
    });

    // PASO 2: Actualizar voltajes de pines de Arduino en cables
    console.log('\n📍 PASO 2: Actualizar Cables Conectados a Arduino');
    const wires = this.circuit.components.filter(c => c instanceof Wire) as Wire[];
    
    for (const wire of wires) {
      if (!wire.isComplete()) continue;
      
      // Verificar si alguno de los extremos está conectado a Arduino
      const start = wire.startConnection!;
      const end = wire.endConnection!;
      
      if (start.type === 'arduino') {
        const pinId = this.connectionToPinId(start);
        const voltage = arduinoVoltages.get(pinId) || 0;
        wire.pins[0].voltage = voltage;
        console.log(`   Cable ${wire.id}: Pin Arduino inicio = ${voltage}V`);
      }
      
      if (end.type === 'arduino') {
        const pinId = this.connectionToPinId(end);
        const voltage = arduinoVoltages.get(pinId) || 0;
        wire.pins[1].voltage = voltage;
        console.log(`   Cable ${wire.id}: Pin Arduino fin = ${voltage}V`);
      }
    }

    // PASO 3: MÚLTIPLES PASADAS para propagar voltajes
    console.log('\n📍 PASO 3: Propagación Iterativa');
    const MAX_ITERATIONS = 5;
    
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      console.log(`\n🔄 Iteración ${iteration + 1}/${MAX_ITERATIONS}`);
      
      // 3.1: Actualizar voltajes desde el circuito (excepto resistencias)
      for (const component of this.circuit.components) {
        if (component instanceof Resistor) continue;
        if (component instanceof Wire) continue; // Los cables ya se actualizaron
        
        for (const pin of component.pins) {
          const connection: WireConnection = {
            type: 'protoboard',
            row: pin.position.row,
            col: pin.position.col
          };

          const voltage = this.circuit.getVoltageAt(connection);
          if (voltage !== pin.voltage) {
            pin.voltage = voltage;
          }
        }
      }
      
      // 3.2: Propagar voltajes de cables a protoboard
      for (const wire of wires) {
        if (!wire.isComplete()) continue;
        
        const start = wire.startConnection!;
        const end = wire.endConnection!;
        
        // Si el inicio es Arduino y el fin es protoboard
        if (start.type === 'arduino' && end.type === 'protoboard') {
          const voltage = wire.pins[0].voltage;
          if (voltage > 0) {
            const endConnection: WireConnection = {
              type: 'protoboard',
              row: end.row!,
              col: end.col!
            };
            this.circuit.setVoltageAt(endConnection, voltage);
            console.log(`   🔌 Cable propagó ${voltage}V a proto [${end.row},${end.col}]`);
          }
        }
        
        // Si el fin es Arduino y el inicio es protoboard
        if (end.type === 'arduino' && start.type === 'protoboard') {
          const voltage = wire.pins[1].voltage;
          if (voltage > 0) {
            const startConnection: WireConnection = {
              type: 'protoboard',
              row: start.row!,
              col: start.col!
            };
            this.circuit.setVoltageAt(startConnection, voltage);
            console.log(`   🔌 Cable propagó ${voltage}V a proto [${start.row},${start.col}]`);
          }
        }
        
        // Si ambos son protoboard, propagar del que tiene voltaje
        if (start.type === 'protoboard' && end.type === 'protoboard') {
          if (wire.pins[0].voltage > 0) {
            const endConnection: WireConnection = {
              type: 'protoboard',
              row: end.row!,
              col: end.col!
            };
            this.circuit.setVoltageAt(endConnection, wire.pins[0].voltage);
          }
          if (wire.pins[1].voltage > 0) {
            const startConnection: WireConnection = {
              type: 'protoboard',
              row: start.row!,
              col: start.col!
            };
            this.circuit.setVoltageAt(startConnection, wire.pins[1].voltage);
          }
        }
      }
      
      // 3.3: Procesar resistencias - PROPAGACIÓN BIDIRECCIONAL
      const resistors = this.circuit.components.filter(c => c instanceof Resistor) as Resistor[];
      
      for (const resistor of resistors) {
        const pin1Connection: WireConnection = {
          type: 'protoboard',
          row: resistor.pins[0].position.row,
          col: resistor.pins[0].position.col
        };
        
        const pin2Connection: WireConnection = {
          type: 'protoboard',
          row: resistor.pins[1].position.row,
          col: resistor.pins[1].position.col
        };
        
        // Obtener voltajes actuales del circuito
        resistor.pins[0].voltage = this.circuit.getVoltageAt(pin1Connection);
        resistor.pins[1].voltage = this.circuit.getVoltageAt(pin2Connection);
        
        const beforePin1 = resistor.pins[0].voltage;
        const beforePin2 = resistor.pins[1].voltage;
        
        console.log(`   🔍 Resistor antes: P1=${beforePin1.toFixed(2)}V, P2=${beforePin2.toFixed(2)}V`);
        
        // Calcular estado (esto propaga voltaje internamente)
        resistor.calculateState();
        
        const afterPin1 = resistor.pins[0].voltage;
        const afterPin2 = resistor.pins[1].voltage;
        
        console.log(`   🔍 Resistor después: P1=${afterPin1.toFixed(2)}V, P2=${afterPin2.toFixed(2)}V`);
        
        // Propagar cambios al circuito
        if (afterPin1 !== beforePin1) {
          this.circuit.setVoltageAt(pin1Connection, afterPin1);
          console.log(`   ⚡ Resistor actualizó P1 a ${afterPin1.toFixed(2)}V en [${resistor.pins[0].position.row},${resistor.pins[0].position.col}]`);
        }
        
        if (afterPin2 !== beforePin2) {
          this.circuit.setVoltageAt(pin2Connection, afterPin2);
          console.log(`   ⚡ Resistor actualizó P2 a ${afterPin2.toFixed(2)}V en [${resistor.pins[1].position.row},${resistor.pins[1].position.col}]`);
        }
      }
      
      // 3.4: Actualizar TODOS los componentes desde el circuito
      for (const component of this.circuit.components) {
        for (const pin of component.pins) {
          // Saltar pines de Arduino
          if (pin.position.row === -1) continue;
          
          const connection: WireConnection = {
            type: 'protoboard',
            row: pin.position.row,
            col: pin.position.col
          };

          pin.voltage = this.circuit.getVoltageAt(connection);
        }
      }
    }
    
    // PASO 4: Calcular estados finales
    console.log('\n📍 PASO 4: Estados Finales');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const component of this.circuit.components) {
      if (component.type !== 'WIRE') {
        for (const pin of component.pins) {
          if (pin.voltage !== 0 && pin.position.row !== -1) {
            const label = pin.label || 'Pin';
            console.log(`   ${component.type} ${label}[${pin.position.row},${pin.position.col}]: ${pin.voltage.toFixed(2)}V`);
          }
        }
      }
      
      component.calculateState();
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  getVoltageAt(row: number, col: number): number {
    const connection: WireConnection = {
      type: 'protoboard',
      row,
      col
    };
    return this.circuit.getVoltageAt(connection);
  }

  getArduinoPinVoltage(pinType: string, pinIndex: number | string): number {
    const connection: WireConnection = {
      type: 'arduino',
      pinType: pinType as 'D' | 'A' | 'PWR',
      pinIndex: pinIndex
    };
    return this.circuit.getVoltageAt(connection);
  }

  private connectionToPinId(connection: WireConnection): string {
    if (connection.type === 'protoboard') {
      return `proto_${connection.row}_${connection.col}`;
    } else {
      return `arduino_${connection.pinType}_${connection.pinIndex}`;
    }
  }

  private pinToId(pin: Pin): string {
    return `proto_${pin.position.row}_${pin.position.col}`;
  }

  private pinIdToConnection(pinId: string): WireConnection | null {
    const parts = pinId.split('_');
    
    if (parts[0] === 'proto') {
      return {
        type: 'protoboard',
        row: parseInt(parts[1]),
        col: parseInt(parts[2])
      };
    } else if (parts[0] === 'arduino') {
      return {
        type: 'arduino',
        pinType: parts[1] as 'D' | 'A' | 'PWR',
        pinIndex: isNaN(Number(parts[2])) ? parts[2] : parseInt(parts[2])
      };
    }
    
    return null;
  }

  getConnectionMap(): ConnectionMap {
    const map: ConnectionMap = {};

    this.circuit.nodes.forEach((node, pinId) => {
      map[pinId] = {
        voltage: node.voltage,
        connectedTo: node.connectedPins
      };
    });

    return map;
  }

  areConnected(connection1: WireConnection, connection2: WireConnection): boolean {
    const pinId1 = this.connectionToPinId(connection1);
    const pinId2 = this.connectionToPinId(connection2);
    
    const connectedPins = this.circuit.findConnectedPins(pinId1);
    return connectedPins.includes(pinId2);
  }

  findConnectedPins(pinId: string): string[] {
    return this.circuit.findConnectedPins(pinId);
  }
}