export interface ProtoboardHole {
  row: number;
  col: number;
  section: 'top' | 'bottom'; // Sección superior o inferior del canal
  label: string; // ej: "A1", "B5", "F12"
}

/**
 * Modelo de Protoboard con lógica de conexiones verticales
 * 
 * ESTRUCTURA:
 * - Filas 0-4 (A-E): Sección superior
 * - Fila 5: Canal central (NO conecta nada)
 * - Filas 5-9 (F-J): Sección inferior
 * 
 * REGLA DE CONEXIÓN:
 * Los agujeros están conectados verticalmente en la MISMA COLUMNA
 * si están en la MISMA SECCIÓN (top o bottom)
 * 
 * Ejemplo:
 * - A1, B1, C1, D1, E1 → CONECTADOS (misma columna 0, sección top)
 * - F1, G1, H1, I1, J1 → CONECTADOS (misma columna 0, sección bottom)
 * - E1 y F1 → NO CONECTADOS (diferentes secciones, separados por canal)
 * - A1 y A2 → NO CONECTADOS (diferentes columnas)
 */
export class Protoboard {
  // Configuración de la protoboard estándar
  readonly ROWS_PER_SECTION = 5;
  readonly TOTAL_ROWS = 10; // 5 arriba + 5 abajo
  readonly COLS = 30;
  readonly CANAL_ROW = 5; // Fila que separa las secciones (entre índice 4 y 5)

  /**
   * Determina la sección de una fila
   * Filas 0-4: top
   * Filas 5-9: bottom
   */
  getSection(row: number): 'top' | 'bottom' {
    return row < this.ROWS_PER_SECTION ? 'top' : 'bottom';
  }

  /**
   * Obtiene el label de un agujero (A-E para top, F-J para bottom)
   */
  getHoleLabel(row: number, col: number): string {
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return `${rowLabels[row]}${col + 1}`;
  }

  /**
   * Verifica si dos posiciones están conectadas internamente
   * 
   * REGLA: Están conectadas si:
   * 1. Están en la misma columna (col)
   * 2. Están en la misma sección (top o bottom)
   * 
   * @param pos1 Primera posición
   * @param pos2 Segunda posición
   * @returns true si están conectadas internamente
   */
  areInternallyConnected(
    pos1: { row: number; col: number },
    pos2: { row: number; col: number }
  ): boolean {
    // Deben estar en la misma columna
    if (pos1.col !== pos2.col) {
      return false;
    }

    // Deben estar en la misma sección
    const section1 = this.getSection(pos1.row);
    const section2 = this.getSection(pos2.row);

    return section1 === section2;
  }

  /**
   * Obtiene todas las posiciones conectadas internamente a una posición dada
   * 
   * Esta es la función clave para la propagación de voltaje.
   * Retorna TODAS las posiciones en la misma columna y sección.
   * 
   * Ejemplos:
   * - getConnectedPositions({row: 0, col: 0}) → [{0,0}, {1,0}, {2,0}, {3,0}, {4,0}]
   *   (A1, B1, C1, D1, E1 - todos conectados en columna 1 superior)
   * 
   * - getConnectedPositions({row: 5, col: 0}) → [{5,0}, {6,0}, {7,0}, {8,0}, {9,0}]
   *   (F1, G1, H1, I1, J1 - todos conectados en columna 1 inferior)
   * 
   * - getConnectedPositions({row: 2, col: 5}) → [{0,5}, {1,5}, {2,5}, {3,5}, {4,5}]
   *   (A6, B6, C6, D6, E6 - todos conectados en columna 6 superior)
   * 
   * @param pos Posición desde la que buscar conexiones
   * @returns Array de todas las posiciones conectadas (incluyendo la posición original)
   */
  getConnectedPositions(pos: { row: number; col: number }): { row: number; col: number }[] {
    const connected: { row: number; col: number }[] = [];
    const section = this.getSection(pos.row);

    // Obtener el rango de filas de la misma sección
    const startRow = section === 'top' ? 0 : this.ROWS_PER_SECTION;
    const endRow = section === 'top' ? this.ROWS_PER_SECTION : this.TOTAL_ROWS;

    // Todas las filas de la misma sección y misma columna están conectadas
    for (let row = startRow; row < endRow; row++) {
      connected.push({ row, col: pos.col });
    }

    return connected;
  }

  /**
   * Verifica si una posición es válida en la protoboard
   */
  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.TOTAL_ROWS && col >= 0 && col < this.COLS;
  }

  /**
   * Obtiene información visual de un agujero
   */
  getHoleInfo(row: number, col: number): {
    label: string;
    section: 'top' | 'bottom';
    columnGroup: string;
  } {
    const section = this.getSection(row);
    const label = this.getHoleLabel(row, col);
    const columnGroup = (col + 1).toString();

    return { label, section, columnGroup };
  }

  /**
   * Obtiene todos los agujeros conectados en una columna específica
   * Útil para debugging y visualización
   */
  getColumnConnections(col: number): {
    top: string[];
    bottom: string[];
  } {
    const top: string[] = [];
    const bottom: string[] = [];

    for (let row = 0; row < this.ROWS_PER_SECTION; row++) {
      top.push(this.getHoleLabel(row, col));
    }

    for (let row = this.ROWS_PER_SECTION; row < this.TOTAL_ROWS; row++) {
      bottom.push(this.getHoleLabel(row, col));
    }

    return { top, bottom };
  }

  /**
   * Verifica si una posición está en el canal central
   * (Útil para debugging, aunque el canal no es una fila física)
   */
  isInCanalZone(row: number): boolean {
    // El canal está entre las filas 4 y 5 (índices)
    // No hay una fila física para el canal
    return false;
  }

  /**
   * Debug: Imprime la estructura de conexiones de una columna
   */
  debugColumn(col: number): void {
    const connections = this.getColumnConnections(col);
    console.log(`\n🔍 DEBUG - Columna ${col + 1}:`);
    console.log(`   Sección Superior (A-E): ${connections.top.join(' ↔ ')}`);
    console.log(`   ━━━━━ CANAL CENTRAL ━━━━━`);
    console.log(`   Sección Inferior (F-J): ${connections.bottom.join(' ↔ ')}`);
  }
}