export type PinMode = 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';
export type PinState = 'HIGH' | 'LOW';

export interface DigitalPin {
  number: number;
  mode: PinMode;
  state: PinState;
  voltage: number;
  isPWM: boolean;
  pwmValue?: number; // 0-255
}

export interface AnalogPin {
  number: number;
  value: number; // 0-1023
  voltage: number; // 0-5V
}

export interface PowerPin {
  name: string;
  voltage: number;
}

export class ArduinoBoard {
  digitalPins: DigitalPin[] = [];
  analogPins: AnalogPin[] = [];
  powerPins: Map<string, PowerPin> = new Map();

  constructor() {
    this.initializePins();
  }

  private initializePins(): void {
    // Pines digitales D0-D13
    const pwmPins = [3, 5, 6, 9, 10, 11];
    for (let i = 0; i < 14; i++) {
      this.digitalPins.push({
        number: i,
        mode: 'INPUT',
        state: 'LOW',
        voltage: 0,
        isPWM: pwmPins.includes(i),
        pwmValue: 0
      });
    }

    // Pines analógicos A0-A5
    for (let i = 0; i < 6; i++) {
      this.analogPins.push({
        number: i,
        value: 0,
        voltage: 0
      });
    }

    // Pines de alimentación
    this.powerPins.set('5V', { name: '5V', voltage: 5.0 });
    this.powerPins.set('3.3V', { name: '3.3V', voltage: 3.3 });
    this.powerPins.set('GND', { name: 'GND', voltage: 0.0 });
    this.powerPins.set('VIN', { name: 'VIN', voltage: 0.0 });
    this.powerPins.set('RESET', { name: 'RESET', voltage: 0.0 });
  }

  // ==========================================
  // API SIMILAR A ARDUINO
  // ==========================================

  pinMode(pin: number, mode: PinMode): void {
    if (pin >= 0 && pin < this.digitalPins.length) {
      this.digitalPins[pin].mode = mode;
      console.log(`pinMode(${pin}, ${mode})`);
    }
  }

  digitalWrite(pin: number, state: PinState): void {
    if (pin >= 0 && pin < this.digitalPins.length) {
      this.digitalPins[pin].state = state;
      this.digitalPins[pin].voltage = state === 'HIGH' ? 5.0 : 0.0;
      console.log(`digitalWrite(${pin}, ${state}) → ${this.digitalPins[pin].voltage}V`);
    }
  }

  digitalRead(pin: number): PinState {
    if (pin >= 0 && pin < this.digitalPins.length) {
      return this.digitalPins[pin].state;
    }
    return 'LOW';
  }

  analogWrite(pin: number, value: number): void {
    if (pin >= 0 && pin < this.digitalPins.length && this.digitalPins[pin].isPWM) {
      this.digitalPins[pin].pwmValue = Math.max(0, Math.min(255, value));
      // PWM: voltaje promedio = (value/255) * 5V
      this.digitalPins[pin].voltage = (value / 255) * 5.0;
      console.log(`analogWrite(${pin}, ${value}) → ${this.digitalPins[pin].voltage}V`);
    }
  }

  analogRead(pin: number): number {
    if (pin >= 0 && pin < this.analogPins.length) {
      return this.analogPins[pin].value;
    }
    return 0;
  }

  // ==========================================
  // GETTERS DE VOLTAJE
  // ==========================================

  getDigitalPinVoltage(pin: number): number {
    if (pin >= 0 && pin < this.digitalPins.length) {
      return this.digitalPins[pin].voltage;
    }
    return 0;
  }

  getAnalogPinVoltage(pin: number): number {
    if (pin >= 0 && pin < this.analogPins.length) {
      return this.analogPins[pin].voltage;
    }
    return 0;
  }

  getPowerPinVoltage(name: string): number {
    const pin = this.powerPins.get(name);
    return pin ? pin.voltage : 0;
  }

  // ==========================================
  // MAPA DE VOLTAJES PARA CONNECTION MANAGER
  // ==========================================

  getVoltageMap(): Map<string, number> {
    const voltages = new Map<string, number>();

    // Pines digitales
    this.digitalPins.forEach((pin, index) => {
      voltages.set(`arduino_D_${index}`, pin.voltage);
    });

    // Pines analógicos
    this.analogPins.forEach((pin, index) => {
      voltages.set(`arduino_A_${index}`, pin.voltage);
    });

    // Pines de poder
    this.powerPins.forEach((pin, name) => {
      voltages.set(`arduino_PWR_${name}`, pin.voltage);
    });

    return voltages;
  }
}