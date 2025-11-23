import { Component, Pin } from '../component.model';

export class LED extends Component {
  isOn: boolean = false;
  color: 'red' | 'green' | 'blue' | 'yellow';
  thresholdVoltage: number = 2.0;
  forwardVoltage: number = 2.0;
  maxCurrent: number = 0.02; // 20mA máximo

  constructor(color: 'red' | 'green' | 'blue' | 'yellow', position: { row: number; col: number }) {
    super('LED', position);
    this.color = color;

    switch (color) {
      case 'red':
        this.thresholdVoltage = 1.8;
        this.forwardVoltage = 2.0;
        break;
      case 'green':
      case 'blue':
        this.thresholdVoltage = 2.5;
        this.forwardVoltage = 3.0;
        break;
      case 'yellow':
        this.thresholdVoltage = 2.0;
        this.forwardVoltage = 2.2;
        break;
    }

    this.pins = [
      {
        id: `${this.id}-anode`,
        voltage: 0,
        current: 0,
        position: { row: position.row, col: position.col },
        label: 'A+'
      },
      {
        id: `${this.id}-cathode`,
        voltage: 0,
        current: 0,
        position: { row: position.row, col: position.col + 1 },
        label: 'K-'
      }
    ];
  }

  calculateState(): void {
    const anodeVoltage = this.pins[0].voltage;
    const cathodeVoltage = this.pins[1].voltage;
    const voltageDrop = anodeVoltage - cathodeVoltage;

    console.log(`🔬 LED ${this.color} calculateState():`);
    console.log(`   Ánodo: ${anodeVoltage.toFixed(2)}V`);
    console.log(`   Cátodo: ${cathodeVoltage.toFixed(2)}V`);
    console.log(`   Diferencia: ${voltageDrop.toFixed(2)}V`);
    console.log(`   Umbral: ${this.thresholdVoltage}V`);

    // CRÍTICO: Verificar que existe un circuito completo
    // El LED SOLO enciende si:
    // 1. El ánodo tiene voltaje positivo (> umbral)
    // 2. El cátodo está conectado a tierra (voltaje cercano a 0)
    // 3. La diferencia de voltaje es suficiente
    
    // Verificar que el cátodo esté efectivamente conectado a GND
    // (voltaje muy bajo, típicamente < 0.5V)
    const cathodeIsGrounded = cathodeVoltage < 0.5;
    
    if (!cathodeIsGrounded) {
      this.isOn = false;
      console.log(`   ❌ CÁTODO NO ESTÁ CONECTADO A GND (${cathodeVoltage.toFixed(2)}V)`);
      return;
    }

    // Verificar polaridad incorrecta
    if (voltageDrop < 0) {
      this.isOn = false;
      console.log(`   ⚠️ POLARIZADO INCORRECTAMENTE`);
      return;
    }

    // Verificar voltaje mínimo
    if (voltageDrop < this.thresholdVoltage) {
      this.isOn = false;
      console.log(`   🔴 APAGADO (voltaje insuficiente: ${voltageDrop.toFixed(2)}V < ${this.thresholdVoltage}V)`);
      return;
    }

    // Verificar que el ánodo tenga voltaje significativo
    if (anodeVoltage < this.thresholdVoltage) {
      this.isOn = false;
      console.log(`   🔴 APAGADO (ánodo sin voltaje suficiente: ${anodeVoltage.toFixed(2)}V)`);
      return;
    }

    // LED enciende - TODAS las condiciones se cumplen
    this.isOn = true;

    const current = Math.min((voltageDrop - this.forwardVoltage) / 220, this.maxCurrent);
    this.pins[0].current = current;
    this.pins[1].current = current;

    console.log(`   💡 ENCENDIDO! (corriente: ${(current * 1000).toFixed(2)}mA)`);
  }

  getAnode(): Pin {
    return this.pins[0];
  }

  getCathode(): Pin {
    return this.pins[1];
  }
}