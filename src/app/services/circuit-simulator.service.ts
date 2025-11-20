import { Injectable, signal } from '@angular/core';
import { Component } from '../models/component.model';
import { ArduinoBoard } from '../models/arduino-board.model';
import { ConnectionManagerService } from './connection-manager.service';

export interface ArduinoPinRef {
  board: 'arduino';
  type: 'D' | 'A' | 'PWR';
  index: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class CircuitSimulatorService {
  components = signal<Component[]>([]);
  isRunning = signal<boolean>(false);
  
  arduino: ArduinoBoard = new ArduinoBoard();

  private intervalId: any;
  private arduinoPinMap = new Map<string, string>();

  constructor(private connectionManager: ConnectionManagerService) {
    this.initializeArduino();
  }

  private initializeArduino(): void {
    // Configurar algunos pines por defecto
    this.arduino.pinMode(13, 'OUTPUT');
    this.arduino.digitalWrite(13, 'HIGH');
    
    console.log('🤖 Arduino inicializado');
  }

  addComponent(component: Component) {
    this.components.update(list => [...list, component]);
    console.log('✅ Componente agregado:', component.type, 'ID:', component.id);
    
    // Actualizar conexiones inmediatamente
    this.updateConnections();
  }

  removeComponent(id: string) {
    this.components.update(list => list.filter(c => c.id !== id));

    for (const [key, compId] of this.arduinoPinMap.entries()) {
      if (compId === id) {
        this.arduinoPinMap.delete(key);
      }
    }

    console.log('🗑️ Componente eliminado:', id);
    this.updateConnections();
  }

  isPositionOccupied(row: number, col: number): boolean {
    return this.components().some(c =>
      c.pins.some(pin =>
        pin.position.row === row && pin.position.col === col
      )
    );
  }

  getComponentAt(row: number, col: number): Component | undefined {
    return this.components().find(c =>
      c.pins.some(pin =>
        pin.position.row === row && pin.position.col === col
      )
    );
  }

  private normalizePinType(t: string): 'D' | 'A' | 'PWR' {
    if (t.toUpperCase().startsWith('D')) return 'D';
    if (t.toUpperCase().startsWith('A')) return 'A';
    return 'PWR';
  }

  private buildArduinoKey(pin: ArduinoPinRef): string {
    return `arduino:${pin.type}:${pin.index}`;
  }

  connectToPin(component: Component, pin: { board:'arduino', type:string, index:number|string }): boolean {
    const normalizedType = this.normalizePinType(pin.type);

    const finalPin: ArduinoPinRef = {
      board: 'arduino',
      type: normalizedType,
      index: pin.index
    };

    const key = this.buildArduinoKey(finalPin);

    if (this.arduinoPinMap.has(key)) {
      console.warn('⚠️ Pin ya ocupado:', key);
      return false;
    }

    this.arduinoPinMap.set(key, component.id);
    console.log(`🔌 Componente ${component.id} conectado al pin`, key);

    this.updateConnections();

    return true;
  }

  isPinOccupied(pin: { board:'arduino', type:string, index:number|string }): boolean {
    const t = this.normalizePinType(pin.type);
    const key = this.buildArduinoKey({ board:'arduino', type:t, index:pin.index });
    return this.arduinoPinMap.has(key);
  }

  getComponentOnPin(pin: { board:'arduino', type:string, index:number|string }): Component | null {
    const t = this.normalizePinType(pin.type);
    const key = this.buildArduinoKey({ board:'arduino', type:t, index:pin.index });

    const compId = this.arduinoPinMap.get(key);
    if (!compId) return null;

    return this.components().find(c => c.id === compId) || null;
  }

  private updateConnections(): void {
    // Actualizar el circuito en el connection manager
    this.connectionManager.updateCircuit(this.components());
    
    // Obtener voltajes del Arduino
    const arduinoVoltages = this.arduino.getVoltageMap();
    
    // Propagar voltajes a través de los cables
    this.connectionManager.propagateVoltages(arduinoVoltages);
  }

  start() {
    if (this.isRunning()) return;

    this.isRunning.set(true);
    console.log('▶️ Simulación iniciada');

    // Primera actualización inmediata
    this.updateConnections();

    this.intervalId = setInterval(() => {
      this.simulationStep();
    }, 100);
  }

  stop() {
    this.isRunning.set(false);
    clearInterval(this.intervalId);
    console.log('⏸️ Simulación detenida');
  }

  private simulationStep() {
    // Actualizar conexiones y propagar voltajes
    this.updateConnections();
    
    // Los componentes ya calculan su estado en updateConnections
    // Solo logueamos el estado actual
    const leds = this.components().filter(c => c.type === 'LED');
    if (leds.length > 0) {
      // Los LEDs ya loguean su estado en calculateState()
    }
  }

  pinMode(pin: number, mode: 'INPUT' | 'OUTPUT'): void {
    this.arduino.pinMode(pin, mode);
    if (this.isRunning()) {
      this.updateConnections();
    }
  }

  digitalWrite(pin: number, state: 'HIGH' | 'LOW'): void {
    this.arduino.digitalWrite(pin, state);
    if (this.isRunning()) {
      this.updateConnections();
    }
  }

  digitalRead(pin: number): 'HIGH' | 'LOW' {
    return this.arduino.digitalRead(pin);
  }

  analogWrite(pin: number, value: number): void {
    this.arduino.analogWrite(pin, value);
    if (this.isRunning()) {
      this.updateConnections();
    }
  }

  analogRead(pin: number): number {
    return this.arduino.analogRead(pin);
  }
}