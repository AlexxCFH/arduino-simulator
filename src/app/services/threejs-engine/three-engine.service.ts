import { Injectable, ElementRef, signal, WritableSignal } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneManagerService } from './managers/scene-manager.service';
import { CameraManagerService } from './managers/camera-manager.service';
import { RendererManagerService } from './managers/renderer-manager.service';
import { LightingManagerService } from './managers/lighting-manager.service';
import { ArduinoModelService } from './models/arduino-model.service';
import { ProtoboardModelService } from './models/protoboard-model.service';
import { ComponentModelService } from './models/component-model.service';

/**
 * THREEJS ENGINE - PATRÓN FACHADA
 * 
 * Esta clase actúa como punto de entrada único y simplificado
 * para toda la funcionalidad de Three.js en el simulador.
 * 
 * Responsabilidades:
 * - Inicialización del motor 3D
 * - Coordinación entre managers
 * - API simplificada para el resto de la aplicación
 * - Ciclo de vida del motor (start, stop, dispose)
 */
@Injectable({
  providedIn: 'root'
})
export class ThreeEngineService {
  // Estado del motor
  private isInitialized = false;
  private isRunning = false;
  private animationFrameId: number | null = null;
  
  // Canvas y contenedor
  private container: ElementRef<HTMLElement> | null = null;
  
  // Signals para reactividad
  public engineReady: WritableSignal<boolean> = signal(false);
  public fps: WritableSignal<number> = signal(0);
  
  // FPS tracking
  private lastTime = 0;
  private frameCount = 0;
  private fpsUpdateInterval = 1000; // Update FPS every second

  constructor(
    private sceneManager: SceneManagerService,
    private cameraManager: CameraManagerService,
    private rendererManager: RendererManagerService,
    private lightingManager: LightingManagerService,
    private arduinoModel: ArduinoModelService,
    private protoboardModel: ProtoboardModelService,
    private componentModel: ComponentModelService
  ) {}

  /**
   * Inicializa el motor 3D
   * @param container ElementRef del contenedor HTML donde se renderizará
   */
  async initialize(container: ElementRef<HTMLElement>): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ ThreeJS Engine ya está inicializado');
      return;
    }

    console.log('🎮 Inicializando ThreeJS Engine...');
    
    this.container = container;

    try {
      // 1. Inicializar Scene
      await this.sceneManager.initialize();
      
      // 2. Inicializar Camera
      const canvas = container.nativeElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      await this.cameraManager.initialize(width, height);
      
      // 3. Inicializar Renderer
      await this.rendererManager.initialize(canvas, width, height);
      
      // 4. Inicializar Lighting
      await this.lightingManager.initialize(this.sceneManager.getScene());
      
      // 5. Cargar modelos principales
      await this.loadMainModels();
      
      // 6. Configurar controles
      this.setupControls();
      
      // 7. Configurar eventos
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.engineReady.set(true);
      
      console.log('✅ ThreeJS Engine inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error al inicializar ThreeJS Engine:', error);
      throw error;
    }
  }

  /**
   * Carga los modelos principales (Arduino y Protoboard)
   */
  private async loadMainModels(): Promise<void> {
    console.log('📦 Cargando modelos 3D...');
    
    const scene = this.sceneManager.getScene();
    
    // Cargar Arduino
    const arduino = await this.arduinoModel.create();
    arduino.position.set(-5, 0, 0);
    scene.add(arduino);
    
    // Cargar Protoboard
    const protoboard = await this.protoboardModel.create();
    protoboard.position.set(5, 0, 0);
    scene.add(protoboard);
    
    console.log('✅ Modelos 3D cargados');
  }

  /**
   * Configura los controles de cámara (OrbitControls)
   */
  private setupControls(): void {
    const camera = this.cameraManager.getCamera();
    const renderer = this.rendererManager.getRenderer();
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2; // No permitir ver desde abajo
    
    this.cameraManager.setControls(controls);
    
    console.log('🎮 Controles de cámara configurados');
  }

  /**
   * Configura event listeners para resize, etc.
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    console.log('📡 Event listeners configurados');
  }

  /**
   * Maneja el evento de resize de ventana
   */
  private onWindowResize(): void {
    if (!this.container) return;
    
    const width = this.container.nativeElement.clientWidth;
    const height = this.container.nativeElement.clientHeight;
    
    this.cameraManager.resize(width, height);
    this.rendererManager.resize(width, height);
  }

  /**
   * Inicia el loop de renderizado
   */
  start(): void {
    if (!this.isInitialized) {
      console.warn('⚠️ El motor no está inicializado');
      return;
    }

    if (this.isRunning) {
      console.warn('⚠️ El motor ya está corriendo');
      return;
    }

    console.log('▶️ Iniciando motor 3D...');
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  /**
   * Detiene el loop de renderizado
   */
  stop(): void {
    if (!this.isRunning) return;
    
    console.log('⏸️ Deteniendo motor 3D...');
    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Loop principal de animación
   */
  private animate(): void {
    if (!this.isRunning) return;
    
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    // Update FPS
    this.updateFPS();
    
    // Update controls
    const controls = this.cameraManager.getControls();
    if (controls) {
      controls.update();
    }
    
    // Render scene
    const scene = this.sceneManager.getScene();
    const camera = this.cameraManager.getCamera();
    const renderer = this.rendererManager.getRenderer();
    
    renderer.render(scene, camera);
  }

  /**
   * Actualiza el contador de FPS
   */
  private updateFPS(): void {
    const now = performance.now();
    this.frameCount++;
    
    if (now >= this.lastTime + this.fpsUpdateInterval) {
      this.fps.set(Math.round((this.frameCount * 1000) / (now - this.lastTime)));
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  /**
   * API PÚBLICA - Componentes
   */

  /**
   * Añade un LED a la escena
   */
  addLED(position: THREE.Vector3, color: string): THREE.Object3D {
    const led = this.componentModel.createLED(color);
    led.position.copy(position);
    this.sceneManager.getScene().add(led);
    return led;
  }

  /**
   * Añade un resistor a la escena
   */
  addResistor(position: THREE.Vector3, value: number): THREE.Object3D {
    const resistor = this.componentModel.createResistor(value);
    resistor.position.copy(position);
    this.sceneManager.getScene().add(resistor);
    return resistor;
  }

  /**
   * Añade un cable a la escena
   */
  addWire(start: THREE.Vector3, end: THREE.Vector3, color: string): THREE.Object3D {
    const wire = this.componentModel.createWire(start, end, color);
    this.sceneManager.getScene().add(wire);
    return wire;
  }

  /**
   * Elimina un objeto de la escena
   */
  removeObject(object: THREE.Object3D): void {
    this.sceneManager.getScene().remove(object);
    
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

  /**
   * Actualiza el estado de un LED (encendido/apagado)
   */
  updateLEDState(led: THREE.Object3D, isOn: boolean, color: string): void {
    this.componentModel.updateLEDState(led, isOn, color);
  }

  /**
   * API PÚBLICA - Cámara
   */

  /**
   * Centra la cámara en un objeto
   */
  focusOnObject(object: THREE.Object3D): void {
    this.cameraManager.focusOn(object);
  }

  /**
   * Resetea la posición de la cámara
   */
  resetCamera(): void {
    this.cameraManager.reset();
  }

  /**
   * API PÚBLICA - Scene
   */

  /**
   * Obtiene la escena (para casos avanzados)
   */
  getScene(): THREE.Scene {
    return this.sceneManager.getScene();
  }

  /**
   * Limpia todos los componentes de la escena
   */
  clearComponents(): void {
    const scene = this.sceneManager.getScene();
    const objectsToRemove: THREE.Object3D[] = [];
    
    scene.traverse((object) => {
      if (object.userData.isComponent) {
        objectsToRemove.push(object);
      }
    });
    
    objectsToRemove.forEach(obj => this.removeObject(obj));
  }

  /**
   * Limpieza y disposición de recursos
   */
  dispose(): void {
    console.log('🗑️ Limpiando ThreeJS Engine...');
    
    this.stop();
    
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    this.rendererManager.dispose();
    this.sceneManager.dispose();
    
    this.isInitialized = false;
    this.engineReady.set(false);
    
    console.log('✅ ThreeJS Engine limpiado');
  }

  /**
   * Getters de estado
   */
  isEngineInitialized(): boolean {
    return this.isInitialized;
  }

  isEngineRunning(): boolean {
    return this.isRunning;
  }
}
