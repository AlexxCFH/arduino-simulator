import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * SCENE MANAGER
 * 
 * Gestiona la escena principal de Three.js
 * - Configuración de la escena
 * - Background
 * - Fog
 * - Grid helper y axes helper
 */
@Injectable({
  providedIn: 'root'
})
export class SceneManagerService {
  private scene: THREE.Scene | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private axesHelper: THREE.AxesHelper | null = null;

  /**
   * Inicializa la escena
   */
  async initialize(): Promise<void> {
    console.log('🎬 Inicializando Scene...');

    // Crear escena
    this.scene = new THREE.Scene();
    
    // Background color - un azul oscuro como el workspace actual
    this.scene.background = new THREE.Color(0x667eea);
    
    // Fog para dar profundidad
    this.scene.fog = new THREE.Fog(0x667eea, 10, 100);
    
    // Grid helper
    this.gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0x444444);
    this.scene.add(this.gridHelper);
    
    // Axes helper (para debugging)
    this.axesHelper = new THREE.AxesHelper(5);
    this.scene.add(this.axesHelper);
    
    console.log('✅ Scene inicializada');
  }

  /**
   * Obtiene la escena
   */
  getScene(): THREE.Scene {
    if (!this.scene) {
      throw new Error('Scene no está inicializada');
    }
    return this.scene;
  }

  /**
   * Cambia el color de fondo
   */
  setBackgroundColor(color: number | string): void {
    if (this.scene) {
      this.scene.background = new THREE.Color(color);
    }
  }

  /**
   * Muestra/oculta el grid helper
   */
  setGridVisible(visible: boolean): void {
    if (this.gridHelper) {
      this.gridHelper.visible = visible;
    }
  }

  /**
   * Muestra/oculta el axes helper
   */
  setAxesVisible(visible: boolean): void {
    if (this.axesHelper) {
      this.axesHelper.visible = visible;
    }
  }

  /**
   * Limpia la escena
   */
  dispose(): void {
    if (!this.scene) return;

    // Eliminar todos los objetos
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);
      
      // Dispose geometry and materials
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    }
    
    this.scene = null;
    this.gridHelper = null;
    this.axesHelper = null;
    
    console.log('✅ Scene limpiada');
  }
}
