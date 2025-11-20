import { Component, Pin } from '../component.model';

export interface WireConnection {
  type: 'protoboard' | 'arduino';
  // Si es protoboard
  row?: number;
  col?: number;
  // Si es arduino
  pinType?: 'D' | 'A' | 'PWR';
  pinIndex?: number | string;
}

export class Wire extends Component {
  startConnection: WireConnection | null = null;
  endConnection: WireConnection | null = null;
  color: string = '#ff0000';

  constructor(position: { row: number; col: number }, color: string = '#ff0000') {
    super('WIRE', position);
    this.color = color;

    // IMPORTANTE: Los pines del wire se actualizan dinámicamente
    // No se inicializan aquí porque pueden conectar protoboard-arduino
    this.pins = [
      {
        id: `${this.id}-start`,
        voltage: 0,
        current: 0,
        position: { row: position.row, col: position.col }
      },
      {
        id: `${this.id}-end`,
        voltage: 0,
        current: 0,
        position: { row: position.row, col: position.col }
      }
    ];
  }

  setStart(connection: WireConnection) {
    this.startConnection = connection;

    // Solo actualizar posición del pin si es protoboard
    if (connection.type === 'protoboard' && connection.row !== undefined && connection.col !== undefined) {
      this.pins[0].position = { row: connection.row, col: connection.col };
    } else if (connection.type === 'arduino') {
      // Para Arduino, usar una posición especial que indique que es Arduino
      this.pins[0].position = { row: -1, col: -1 };
      this.pins[0].label = `Arduino ${connection.pinType}${connection.pinIndex}`;
    }

    console.log(`🔌 Cable ${this.id} - Inicio configurado:`, this.startConnection);
  }

  setEnd(connection: WireConnection) {
    this.endConnection = connection;

    // Solo actualizar posición del pin si es protoboard
    if (connection.type === 'protoboard' && connection.row !== undefined && connection.col !== undefined) {
      this.pins[1].position = { row: connection.row, col: connection.col };
    } else if (connection.type === 'arduino') {
      // Para Arduino, usar una posición especial que indique que es Arduino
      this.pins[1].position = { row: -1, col: -1 };
      this.pins[1].label = `Arduino ${connection.pinType}${connection.pinIndex}`;
    }

    console.log(`🔌 Cable ${this.id} - Fin configurado:`, this.endConnection);
  }

  isComplete(): boolean {
    return this.startConnection !== null && this.endConnection !== null;
  }

  getConnectionDescription(): string {
    if (!this.isComplete()) return 'Cable incompleto';

    const start = this.formatConnection(this.startConnection!);
    const end = this.formatConnection(this.endConnection!);

    return `${start} ⟷ ${end}`;
  }

  private formatConnection(conn: WireConnection): string {
    if (conn.type === 'protoboard') {
      const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const rowLabel = rowLabels[conn.row!] || '?';
      const colLabel = (conn.col! + 1).toString();
      return `${rowLabel}${colLabel}`;
    } else {
      return `Arduino ${conn.pinType}${conn.pinIndex}`;
    }
  }

  calculateState(): void {
    // Un cable simplemente conduce electricidad
    // El voltaje se propaga a través del ConnectionManager
  }
}