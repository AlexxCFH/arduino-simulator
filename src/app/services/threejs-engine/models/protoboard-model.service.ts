import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * PROTOBOARD MODEL SERVICE
 * 
 * Crea y gestiona el modelo 3D de la protoboard
 * Con 10 filas (A-J) y 30 columnas
 */
@Injectable({
  providedIn: 'root'
})
export class ProtoboardModelService {
  private readonly ROWS = 10;
  private readonly COLS = 30;
  private readonly HOLE_SIZE = 0.12;
  private readonly HOLE_SPACING = 0.25;
  private readonly BOARD_THICKNESS = 0.3;
  
  /**
   * Crea el modelo 3D de la protoboard
   */
  async create(): Promise<THREE.Group> {
    const protoboard = new THREE.Group();
    protoboard.name = 'Protoboard';

    // Calcular dimensiones
    const boardWidth = (this.COLS - 1) * this.HOLE_SPACING + 1;
    const boardDepth = (this.ROWS - 1) * this.HOLE_SPACING + 1;

    // Base de la protoboard
    const baseGeometry = new THREE.BoxGeometry(
      boardWidth,
      this.BOARD_THICKNESS,
      boardDepth
    );
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0, // Color blanco/beige de las protoboards
      metalness: 0.1,
      roughness: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    protoboard.add(base);

    // Crear agujeros
    this.createHoles(protoboard, boardWidth, boardDepth);

    // Crear líneas de separación visual
    this.createSeparatorLines(protoboard, boardWidth, boardDepth);

    // Crear labels de filas (A-J)
    this.createRowLabels(protoboard, boardWidth, boardDepth);

    // Crear labels de columnas (1-30)
    this.createColumnLabels(protoboard, boardWidth, boardDepth);

    return protoboard;
  }

  /**
   * Crea los agujeros de la protoboard
   */
  private createHoles(
    protoboard: THREE.Group,
    boardWidth: number,
    boardDepth: number
  ): void {
    const holeGeometry = new THREE.CylinderGeometry(
      this.HOLE_SIZE / 2,
      this.HOLE_SIZE / 2,
      this.BOARD_THICKNESS + 0.01,
      16
    );
    const holeMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.2
    });

    const startX = -boardWidth / 2 + 0.5;
    const startZ = -boardDepth / 2 + 0.5;

    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        
        const x = startX + col * this.HOLE_SPACING;
        const z = startZ + row * this.HOLE_SPACING;
        
        hole.position.set(x, 0, z);
        hole.rotation.x = Math.PI / 2;
        
        // Metadata del agujero
        hole.name = `hole_${row}_${col}`;
        hole.userData.row = row;
        hole.userData.col = col;
        hole.userData.isHole = true;
        hole.userData.section = row < 5 ? 'top' : 'bottom';
        
        protoboard.add(hole);
      }
    }
  }

  /**
   * Crea las líneas de separación visual (canal central)
   */
  private createSeparatorLines(
    protoboard: THREE.Group,
    boardWidth: number,
    boardDepth: number
  ): void {
    // Línea del canal central (entre fila 4 y 5)
    const lineGeometry = new THREE.BoxGeometry(
      boardWidth - 0.4,
      0.05,
      0.15
    );
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      metalness: 0.2,
      roughness: 0.5
    });
    
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.y = this.BOARD_THICKNESS / 2 + 0.025;
    protoboard.add(line);
  }

  /**
   * Crea los labels de las filas (A-J)
   */
  private createRowLabels(
    protoboard: THREE.Group,
    boardWidth: number,
    boardDepth: number
  ): void {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const startZ = -boardDepth / 2 + 0.5;
    const labelX = -boardWidth / 2 - 0.3;

    labels.forEach((label, row) => {
      const z = startZ + row * this.HOLE_SPACING;
      
      // Crear un pequeño marcador visual para el label
      const labelGeometry = new THREE.PlaneGeometry(0.2, 0.2);
      const labelMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        side: THREE.DoubleSide
      });
      
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      labelMesh.position.set(labelX, this.BOARD_THICKNESS / 2 + 0.01, z);
      labelMesh.rotation.x = -Math.PI / 2;
      labelMesh.userData.label = label;
      
      protoboard.add(labelMesh);
    });
  }

  /**
   * Crea los labels de las columnas (1-30)
   */
  private createColumnLabels(
    protoboard: THREE.Group,
    boardWidth: number,
    boardDepth: number
  ): void {
    const startX = -boardWidth / 2 + 0.5;
    const labelZ = -boardDepth / 2 - 0.3;

    for (let col = 0; col < this.COLS; col++) {
      const x = startX + col * this.HOLE_SPACING;
      
      // Crear marcador visual cada 5 columnas para no saturar
      if (col % 5 === 0) {
        const labelGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const labelMaterial = new THREE.MeshBasicMaterial({
          color: 0x333333,
          side: THREE.DoubleSide
        });
        
        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
        labelMesh.position.set(x, this.BOARD_THICKNESS / 2 + 0.01, labelZ);
        labelMesh.rotation.x = -Math.PI / 2;
        labelMesh.userData.label = (col + 1).toString();
        
        protoboard.add(labelMesh);
      }
    }
  }

  /**
   * Obtiene la posición 3D de un agujero específico
   */
  getHolePosition(
    protoboard: THREE.Group,
    row: number,
    col: number
  ): THREE.Vector3 | null {
    const holeName = `hole_${row}_${col}`;
    const hole = protoboard.getObjectByName(holeName);
    
    if (!hole) return null;

    const worldPosition = new THREE.Vector3();
    hole.getWorldPosition(worldPosition);
    
    // Ajustar la altura para colocar componentes encima
    worldPosition.y += this.BOARD_THICKNESS / 2 + 0.05;
    
    return worldPosition;
  }

  /**
   * Destaca un agujero específico (útil para hover/click)
   */
  highlightHole(
    protoboard: THREE.Group,
    row: number,
    col: number,
    color: number = 0x00ff00
  ): void {
    const holeName = `hole_${row}_${col}`;
    const hole = protoboard.getObjectByName(holeName);
    
    if (hole && hole instanceof THREE.Mesh) {
      const material = hole.material as THREE.MeshStandardMaterial;
      material.emissive.setHex(color);
      material.emissiveIntensity = 0.5;
    }
  }

  /**
   * Remueve el highlight de un agujero
   */
  removeHighlight(protoboard: THREE.Group, row: number, col: number): void {
    const holeName = `hole_${row}_${col}`;
    const hole = protoboard.getObjectByName(holeName);
    
    if (hole && hole instanceof THREE.Mesh) {
      const material = hole.material as THREE.MeshStandardMaterial;
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
  }

  /**
   * Obtiene todos los agujeros conectados verticalmente en una columna
   */
  getConnectedHoles(
    protoboard: THREE.Group,
    row: number,
    col: number
  ): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const section = row < 5 ? 'top' : 'bottom';
    
    const startRow = section === 'top' ? 0 : 5;
    const endRow = section === 'top' ? 5 : 10;
    
    for (let r = startRow; r < endRow; r++) {
      const pos = this.getHolePosition(protoboard, r, col);
      if (pos) {
        positions.push(pos);
      }
    }
    
    return positions;
  }
}
