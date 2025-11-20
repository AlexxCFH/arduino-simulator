export interface Pin {
  id: string;
  voltage: number;
  current: number;
  position: { row: number; col: number };
  label?: string; // Para identificar visualmente (ej: "A+", "K-")
}

export abstract class Component {
  id: string;
  type: string;
  position: { row: number; col: number };
  pins: Pin[] = [];

  constructor(type: string, position: { row: number; col: number }) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.type = type;
    this.position = position;
  }

  abstract calculateState(): void;
}