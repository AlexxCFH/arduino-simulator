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
    // Calcular la caída de voltaje en la resistencia (V = I × R)
    const pin1Voltage = this.pins[0].voltage;
    const pin2Voltage = this.pins[1].voltage;
    
    this.voltageDrop = Math.abs(pin1Voltage - pin2Voltage);
    
    // Calcular corriente (I = V / R)
    if (this.resistance > 0) {
      this.current = this.voltageDrop / this.resistance;
      this.pins[0].current = this.current;
      this.pins[1].current = this.current;
      
      console.log(`🔌 Resistor ${this.resistance}Ω: ${this.voltageDrop.toFixed(2)}V, ${(this.current * 1000).toFixed(2)}mA`);
    }
  }

  getResistanceValue(): string {
    if (this.resistance >= 1000) {
      return `${(this.resistance / 1000).toFixed(1)}kΩ`;
    }
    return `${this.resistance}Ω`;
  }
}