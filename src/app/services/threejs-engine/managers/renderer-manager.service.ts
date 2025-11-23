import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * RENDERER MANAGER
 * 
 * Gestiona el renderizador WebGL
 * - Configuración de rendering
 * - Antialiasing
 * - Shadows
 * - Tone mapping
 */
@Injectable({
  providedIn: 'root'
})
export class RendererManagerService {
  private renderer: THREE.WebGLRenderer | null = null;

  /**
   * Inicializa el renderer
   */
  async initialize(
    container: HTMLElement, 
    width: number, 
    height: number
  ): Promise<void> {
    console.log('🎨 Inicializando Renderer...');

    // Crear renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    // Configurar tamaño
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Configurar shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Configurar tone mapping para mejores colores
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Output encoding
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Añadir canvas al contenedor
    container.appendChild(this.renderer.domElement);
    
    console.log('✅ Renderer inicializado');
  }

  /**
   * Obtiene el renderer
   */
  getRenderer(): THREE.WebGLRenderer {
    if (!this.renderer) {
      throw new Error('Renderer no está inicializado');
    }
    return this.renderer;
  }

  /**
   * Redimensiona el renderer
   */
  resize(width: number, height: number): void {
    if (!this.renderer) return;

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /**
   * Habilita/deshabilita shadows
   */
  setShadowsEnabled(enabled: boolean): void {
    if (this.renderer) {
      this.renderer.shadowMap.enabled = enabled;
    }
  }

  /**
   * Limpieza
   */
  dispose(): void {
    if (!this.renderer) return;

    // Eliminar canvas del DOM
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }

    this.renderer.dispose();
    this.renderer = null;
    
    console.log('✅ Renderer limpiado');
  }
}
