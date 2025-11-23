import { Component, Pin } from '../component.model';

export class Resistor extends Component {
  resistance: number; // En Ohmios
  current: number = 0;
  voltageDrop: number = 0;

  constructor(resistance: number, position: { row: number; col: number }) {
    super('RESISTOR', position);
    this.resistance = resistance;
    
    // Resistor tiene 2 pines (terminales)
    this.pins = [
      { 
        id: `${this.id}-pin1`, 
        voltage: 0, 
        current: 0, 
        position: { row: position.row, col: position.col },
        label: 'P1'
      },
      { 
        id: `${this.id}-pin2`, 
        voltage: 0, 
        current: 0, 
        position: { row: position.row, col: position.col + 1 },
        label: 'P2'
      }
    ];
  }

  calculateState(): void {
    // CRÍTICO: Una resistencia SIEMPRE conduce electricidad
    // Solo reduce el voltaje según su resistencia
    
    const pin1Voltage = this.pins[0].voltage;
    const pin2Voltage = this.pins[1].voltage;
    
    console.log(`🔌 Resistor ${this.resistance}Ω - Entrada: P1=${pin1Voltage.toFixed(2)}V, P2=${pin2Voltage.toFixed(2)}V`);
    
    // Si ambos pines tienen voltaje, calcular caída
    if (pin1Voltage > 0 && pin2Voltage > 0) {
      this.voltageDrop = Math.abs(pin1Voltage - pin2Voltage);
      this.current = this.voltageDrop / this.resistance;
      
      console.log(`   Caída: ${this.voltageDrop.toFixed(2)}V, Corriente: ${(this.current * 1000).toFixed(2)}mA`);
      return;
    }
    
    // Si pin1 tiene voltaje y pin2 no
    if (pin1Voltage > 0 && pin2Voltage === 0) {
      // Asumir una carga típica en serie (LED + resistencia = ~2.5V caída total)
      // Para 220Ω con LED típico: caída en resistencia ≈ 0.5V
      const estimatedCurrent = 0.015; // 15mA típico para LED
      this.voltageDrop = estimatedCurrent * this.resistance;
      this.current = estimatedCurrent;
      
      // El pin2 recibe el voltaje menos la caída
      this.pins[1].voltage = Math.max(0, pin1Voltage - this.voltageDrop);
      
      console.log(`   ➡️ Propaga de P1 a P2: ${pin1Voltage.toFixed(2)}V → ${this.pins[1].voltage.toFixed(2)}V (caída: ${this.voltageDrop.toFixed(2)}V)`);
      return;
    }
    
    // Si pin2 tiene voltaje y pin1 no (dirección inversa)
    if (pin2Voltage > 0 && pin1Voltage === 0) {
      const estimatedCurrent = 0.015;
      this.voltageDrop = estimatedCurrent * this.resistance;
      this.current = estimatedCurrent;
      
      this.pins[0].voltage = Math.max(0, pin2Voltage - this.voltageDrop);
      
      console.log(`   ⬅️ Propaga de P2 a P1: ${pin2Voltage.toFixed(2)}V → ${this.pins[0].voltage.toFixed(2)}V (caída: ${this.voltageDrop.toFixed(2)}V)`);
      return;
    }
    
    // Si ninguno tiene voltaje
    if (pin1Voltage === 0 && pin2Voltage === 0) {
      this.voltageDrop = 0;
      this.current = 0;
      console.log(`   ⚫ Sin voltaje en ningún pin`);
    }
    
    // Actualizar corriente en ambos pines
    this.pins[0].current = this.current;
    this.pins[1].current = this.current;
  }

  getResistanceValue(): string {
    if (this.resistance >= 1000) {
      return `${(this.resistance / 1000).toFixed(1)}kΩ`;
    }
    return `${this.resistance}Ω`;
  }
}