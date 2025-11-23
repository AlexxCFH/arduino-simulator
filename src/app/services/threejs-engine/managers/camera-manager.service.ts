import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * CAMERA MANAGER
 * 
 * Gestiona la cámara y los controles de navegación
 * - PerspectiveCamera
 * - OrbitControls
 * - Zoom y focus
 */
@Injectable({
  providedIn: 'root'
})
export class CameraManagerService {
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  
  // Posición inicial de la cámara
  private readonly INITIAL_POSITION = new THREE.Vector3(15, 15, 15);
  private readonly INITIAL_LOOK_AT = new THREE.Vector3(0, 0, 0);

  /**
   * Inicializa la cámara
   */
  async initialize(width: number, height: number): Promise<void> {
    console.log('📷 Inicializando Camera...');

    // Crear cámara de perspectiva
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(
      60,     // FOV
      aspect, // Aspect ratio
      0.1,    // Near plane
      1000    // Far plane
    );

    // Posicionar cámara
    this.camera.position.copy(this.INITIAL_POSITION);
    this.camera.lookAt(this.INITIAL_LOOK_AT);
    
    console.log('✅ Camera inicializada');
  }

  /**
   * Obtiene la cámara
   */
  getCamera(): THREE.PerspectiveCamera {
    if (!this.camera) {
      throw new Error('Camera no está inicializada');
    }
    return this.camera;
  }

  /**
   * Establece los controles
   */
  setControls(controls: OrbitControls): void {
    this.controls = controls;
  }

  /**
   * Obtiene los controles
   */
  getControls(): OrbitControls | null {
    return this.controls;
  }

  /**
   * Redimensiona la cámara
   */
  resize(width: number, height: number): void {
    if (!this.camera) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Centra la cámara en un objeto
   */
  focusOn(object: THREE.Object3D): void {
    if (!this.camera || !this.controls) return;

    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraDistance = maxDim / Math.tan(fov / 2);
    
    const direction = this.camera.position.clone().sub(this.controls.target);
    direction.normalize().multiplyScalar(cameraDistance);
    
    this.camera.position.copy(center).add(direction);
    this.controls.target.copy(center);
    this.controls.update();
  }

  /**
   * Resetea la posición de la cámara
   */
  reset(): void {
    if (!this.camera || !this.controls) return;

    this.camera.position.copy(this.INITIAL_POSITION);
    this.controls.target.copy(this.INITIAL_LOOK_AT);
    this.controls.update();
  }

  /**
   * Limpieza
   */
  dispose(): void {
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    
    this.camera = null;
    
    console.log('✅ Camera limpiada');
  }
}
