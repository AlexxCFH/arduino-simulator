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

    console.log(`   Ánodo conectado a ${anodeConnections.length} pines:`);
    anodeConnections.slice(0, 10).forEach(pin => console.log(`     - ${pin}`));
    if (anodeConnections.length > 10) console.log(`     ... y ${anodeConnections.length - 10} más`);

    console.log(`   Cátodo conectado a ${cathodeConnections.length} pines:`);
    cathodeConnections.slice(0, 10).forEach(pin => console.log(`     - ${pin}`));
    if (cathodeConnections.length > 10) console.log(`     ... y ${cathodeConnections.length - 10} más`);

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
    
    // Establecer voltajes del Arduino
    arduinoVoltages.forEach((voltage, pinId) => {
      if (voltage !== 0) {
        console.log(`   ${pinId}: ${voltage}V`);
      }
      
      const connection = this.pinIdToConnection(pinId);
      if (connection) {
        this.circuit.setVoltageAt(connection, voltage);
      }
    });

    console.log('\n📊 VOLTAJES EN COMPONENTES:');
    
    // Actualizar voltajes en componentes
    this.updateComponentVoltages();
  }

  private updateComponentVoltages(): void {
    for (const component of this.circuit.components) {
      for (const pin of component.pins) {
        const connection: WireConnection = {
          type: 'protoboard',
          row: pin.position.row,
          col: pin.position.col
        };

        const voltage = this.circuit.getVoltageAt(connection);
        pin.voltage = voltage;
        
        if (voltage !== 0 && component.type !== 'WIRE') {
          console.log(`   ${component.type} Pin[${pin.position.row},${pin.position.col}]: ${voltage.toFixed(2)}V`);
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
