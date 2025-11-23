import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * LIGHTING MANAGER
 * 
 * Gestiona la iluminación de la escena
 * - Luz ambiente
 * - Luz direccional (sol)
 * - Luces puntuales
 * - Sombras
 */
@Injectable({
  providedIn: 'root'
})
export class LightingManagerService {
  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private pointLights: THREE.PointLight[] = [];

  /**
   * Inicializa las luces
   */
  async initialize(scene: THREE.Scene): Promise<void> {
    console.log('💡 Inicializando Lighting...');

    // Luz ambiente - iluminación suave general
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(this.ambientLight);

    // Luz direccional - simula el sol
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    
    // Configurar sombras de la luz direccional
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 100;
    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;
    
    scene.add(this.directionalLight);
    
    // Helper para visualizar la luz direccional (opcional)
    // const helper = new THREE.DirectionalLightHelper(this.directionalLight, 5);
    // scene.add(helper);

    console.log('✅ Lighting inicializado');
  }

  /**
   * Añade una luz puntual (por ejemplo, para LEDs)
   */
  addPointLight(
    position: THREE.Vector3, 
    color: number | string, 
    intensity: number = 1,
    distance: number = 5
  ): THREE.PointLight {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.copy(position);
    
    this.pointLights.push(light);
    
    return light;
  }

  /**
   * Elimina una luz puntual
   */
  removePointLight(light: THREE.PointLight): void {
    const index = this.pointLights.indexOf(light);
    if (index > -1) {
      this.pointLights.splice(index, 1);
    }
  }

  /**
   * Actualiza la intensidad de la luz ambiente
   */
  setAmbientIntensity(intensity: number): void {
    if (this.ambientLight) {
      this.ambientLight.intensity = intensity;
    }
  }

  /**
   * Actualiza la intensidad de la luz direccional
   */
  setDirectionalIntensity(intensity: number): void {
    if (this.directionalLight) {
      this.directionalLight.intensity = intensity;
    }
  }

  /**
   * Cambia el color de la luz ambiente
   */
  setAmbientColor(color: number | string): void {
    if (this.ambientLight) {
      this.ambientLight.color.set(color);
    }
  }

  /**
   * Cambia el color de la luz direccional
   */
  setDirectionalColor(color: number | string): void {
    if (this.directionalLight) {
      this.directionalLight.color.set(color);
    }
  }

  /**
   * Limpieza
   */
  dispose(): void {
    this.ambientLight = null;
    this.directionalLight = null;
    this.pointLights = [];
    
    console.log('✅ Lighting limpiado');
  }
}
