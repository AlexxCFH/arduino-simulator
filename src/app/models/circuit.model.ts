import { Component, Pin } from './component.model';
import { Wire, WireConnection } from './electronic-components/wire.model';
import { Protoboard } from './protoboard.model';

export interface ElectricalNode {
  id: string;
  voltage: number;
  connectedPins: string[];
}

export class Circuit {
  components: Component[] = [];
  nodes: Map<string, ElectricalNode> = new Map();
  protoboard: Protoboard = new Protoboard();

  /**
   * Encuentra todos los pines conectados usando BFS
   * Considera:
   * 1. Conexiones directas por cables
   * 2. Conexiones internas de la protoboard (columnas verticales)
   */
  findConnectedPins(pinId: string): string[] {
    const visited = new Set<string>();
    const queue: string[] = [pinId];
    const connected: string[] = [];
    const wires = this.components.filter(c => c instanceof Wire) as Wire[];

    console.log(`🔎 Buscando conexiones para: ${pinId}`);

    while (queue.length > 0) {
      const currentPinId = queue.shift()!;

      if (visited.has(currentPinId)) continue;
      visited.add(currentPinId);
      connected.push(currentPinId);

      // 1. CONEXIONES POR CABLES
      for (const wire of wires) {
        if (!wire.isComplete()) continue;

        const startPinId = this.connectionToPinId(wire.startConnection!);
        const endPinId = this.connectionToPinId(wire.endConnection!);

        if (startPinId === currentPinId && !visited.has(endPinId)) {
          console.log(`  🔗 Cable conecta a: ${endPinId}`);
          queue.push(endPinId);
        } else if (endPinId === currentPinId && !visited.has(startPinId)) {
          console.log(`  🔗 Cable conecta a: ${startPinId}`);
          queue.push(startPinId);
        }
      }

      // 2. CONEXIONES INTERNAS DE LA PROTOBOARD (Verticales)
      const currentPos = this.pinIdToPosition(currentPinId);
      if (currentPos) {
        const internalConnections = this.protoboard.getConnectedPositions(currentPos);

        console.log(`  📍 Conexiones internas en columna ${currentPos.col + 1}:`, internalConnections.length);

        for (const connectedPos of internalConnections) {
          const connectedPinId = `proto_${connectedPos.row}_${connectedPos.col}`;

          if (!visited.has(connectedPinId)) {
            // IMPORTANTE: Añadir TODOS los pines de la columna vertical, no solo los que tienen componentes
            // Esto permite que la corriente fluya a través de la columna
            console.log(`    ↔️ Añadiendo conexión interna: ${connectedPinId}`);
            queue.push(connectedPinId);
          }
        }
      }
    }

    console.log(`  ✅ Total conectados: ${connected.length} pines`);
    return connected;
  }

  /**
   * Verifica si hay un componente en una posición
   */
  private hasComponentAt(row: number, col: number): boolean {
    return this.components.some(c =>
      c.pins.some(pin => pin.position.row === row && pin.position.col === col)
    );
  }

  /**
   * Convierte un pinId en una posición {row, col}
   */
  private pinIdToPosition(pinId: string): { row: number; col: number } | null {
    const parts = pinId.split('_');

    if (parts[0] === 'proto') {
      return {
        row: parseInt(parts[1]),
        col: parseInt(parts[2])
      };
    }

    return null;
  }

  /**
   * Convierte una conexión en un ID de pin único
   */
  private connectionToPinId(connection: WireConnection): string {
    if (connection.type === 'protoboard') {
      return `proto_${connection.row}_${connection.col}`;
    } else {
      return `arduino_${connection.pinType}_${connection.pinIndex}`;
    }
  }

  /**
   * Obtiene el voltaje en una conexión específica
   */
  getVoltageAt(connection: WireConnection): number {
    const pinId = this.connectionToPinId(connection);
    const connectedPins = this.findConnectedPins(pinId);

    // Buscar el voltaje más alto en los pines conectados
    let maxVoltage = 0;

    for (const pin of connectedPins) {
      const node = this.nodes.get(pin);
      if (node && node.voltage !== undefined) {
        if (Math.abs(node.voltage) > Math.abs(maxVoltage)) {
          maxVoltage = node.voltage;
        }
      }
    }

    return maxVoltage;
  }

  /**
   * Establece el voltaje en una conexión y lo propaga a todos los pines conectados
   */
  setVoltageAt(connection: WireConnection, voltage: number): void {
    const pinId = this.connectionToPinId(connection);
    const connectedPins = this.findConnectedPins(pinId);

    console.log(`⚡ Estableciendo ${voltage.toFixed(2)}V en ${pinId} y ${connectedPins.length} pines conectados`);

    for (const pin of connectedPins) {
      this.nodes.set(pin, {
        id: pin,
        voltage: voltage,
        connectedPins: connectedPins
      });
    }
  }
}