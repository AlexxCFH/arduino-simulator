export interface ProtoboardHole {
  row: number;
  col: number;
  section: 'top' | 'bottom'; // Sección superior o inferior del canal
  label: string; // ej: "A1", "B5", "F12"
}

export class Protoboard {
  // Configuración de la protoboard estándar
  readonly ROWS_PER_SECTION = 5;
  readonly TOTAL_ROWS = 10; // 5 arriba + 5 abajo
  readonly COLS = 30;
  readonly CANAL_ROW = 5; // Fila que separa las secciones (entre índice 4 y 5)

  /**
   * Determina la sección de una fila
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
   * En una protoboard real, están conectados si:
   * 1. Misma columna
   * 2. Misma sección (top o bottom)
   */
  areInternallyConnected(
    pos1: { row: number; col: number },
    pos2: { row: number; col: number }
  ): boolean {
    // Deben estar en la misma columna
    if (pos1.col !== pos2.col) return false;

    // Deben estar en la misma sección
    const section1 = this.getSection(pos1.row);
    const section2 = this.getSection(pos2.row);

    return section1 === section2;
  }

  /**
   * Obtiene todas las posiciones conectadas internamente a una posición dada
   * Por ejemplo, si paso A1 (row:0, col:0), devuelve [A1, B1, C1, D1, E1]
   */
  getConnectedPositions(pos: { row: number; col: number }): { row: number; col: number }[] {
    const connected: { row: number; col: number }[] = [];
    const section = this.getSection(pos.row);

    // Obtener el rango de filas de la misma sección
    const startRow = section === 'top' ? 0 : this.ROWS_PER_SECTION;
    const endRow = section === 'top' ? this.ROWS_PER_SECTION : this.TOTAL_ROWS;

    // Todas las filas de la misma sección y misma columna
    for (let row = startRow; row < endRow; row++) {
      connected.push({ row, col: pos.col });
    }

    return connected;
  }

  /**
   * Verifica si una posición es válida
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
}