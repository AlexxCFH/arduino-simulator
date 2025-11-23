import { 
  Component, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  OnDestroy,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeEngineService } from '../services/three-engine.service';

/**
 * THREEJS VIEWER COMPONENT
 * 
 * Componente Angular que integra el motor ThreeJS
 * Maneja el ciclo de vida y la interfaz con el usuario
 */
@Component({
  selector: 'app-threejs-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="viewer-container">
      <!-- Canvas container -->
      <div class="canvas-container" #canvasContainer></div>

      <!-- Overlay UI -->
      <div class="overlay-ui">
        <!-- FPS Counter -->
        <div class="fps-counter">
          FPS: {{ engine.fps() }}
        </div>

        <!-- Status -->
        <div class="status" [class.ready]="engine.engineReady()">
          {{ engine.engineReady() ? '🟢 Engine Ready' : '🔴 Loading...' }}
        </div>

        <!-- Controls -->
        <div class="controls">
          <button 
            class="control-btn"
            [disabled]="!engine.engineReady()"
            (click)="toggleEngine()">
            {{ engine.isEngineRunning() ? '⏸️ Pause' : '▶️ Start' }}
          </button>

          <button 
            class="control-btn"
            [disabled]="!engine.engineReady()"
            (click)="resetCamera()">
            🎯 Reset Camera
          </button>

          <button 
            class="control-btn"
            [disabled]="!engine.engineReady()"
            (click)="toggleGrid()">
            {{ showGrid() ? '📏 Hide Grid' : '📐 Show Grid' }}
          </button>

          <button 
            class="control-btn"
            [disabled]="!engine.engineReady()"
            (click)="clearScene()">
            🗑️ Clear
          </button>
        </div>

        <!-- Test Components (para desarrollo) -->
        @if (engine.engineReady() && showTestControls()) {
          <div class="test-controls">
            <h4>🧪 Test Components</h4>
            <button class="test-btn" (click)="testAddLED()">
              Add LED
            </button>
            <button class="test-btn" (click)="testAddResistor()">
              Add Resistor
            </button>
            <button class="test-btn" (click)="testAddWire()">
              Add Wire
            </button>
            <button class="test-btn" (click)="testToggleLED()">
              Toggle LED
            </button>
          </div>
        }
      </div>

      <!-- Loading overlay -->
      @if (!engine.engineReady()) {
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>Loading 3D Engine...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .viewer-container {
      position: relative;
      width: 100%;
      height: 600px;
      background: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .canvas-container {
      width: 100%;
      height: 100%;
    }

    /* Overlay UI */
    .overlay-ui {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    /* FPS Counter */
    .fps-counter {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: bold;
      pointer-events: auto;
    }

    /* Status */
    .status {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(231, 76, 60, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      pointer-events: auto;
      transition: all 0.3s;
    }

    .status.ready {
      background: rgba(46, 204, 113, 0.9);
    }

    /* Controls */
    .controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      pointer-events: auto;
    }

    .control-btn {
      background: rgba(52, 152, 219, 0.9);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(10px);
    }

    .control-btn:hover:not(:disabled) {
      background: rgba(41, 128, 185, 1);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
    }

    .control-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Test Controls */
    .test-controls {
      position: absolute;
      top: 70px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      padding: 15px;
      border-radius: 8px;
      pointer-events: auto;
      max-width: 200px;
    }

    .test-controls h4 {
      margin: 0 0 10px 0;
      color: white;
      font-size: 14px;
    }

    .test-btn {
      width: 100%;
      background: rgba(155, 89, 182, 0.9);
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      margin-bottom: 8px;
      transition: all 0.2s;
    }

    .test-btn:hover {
      background: rgba(142, 68, 173, 1);
      transform: translateX(4px);
    }

    /* Loading Overlay */
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      color: white;
    }

    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-overlay p {
      font-size: 18px;
      font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .viewer-container {
        height: 400px;
      }

      .controls {
        flex-direction: column;
        left: 20px;
        right: 20px;
        transform: none;
      }

      .control-btn {
        width: 100%;
      }

      .test-controls {
        display: none;
      }
    }
  `]
})
export class ThreejsViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: false }) 
  canvasContainer!: ElementRef<HTMLElement>;

  showGrid = signal(true);
  showTestControls = signal(true); // Cambiar a false en producción
  
  // Para testing
  private testLEDs: any[] = [];
  private ledToggleState = false;

  constructor(public engine: ThreeEngineService) {}

  async ngAfterViewInit(): Promise<void> {
    try {
      // Inicializar el motor
      await this.engine.initialize(this.canvasContainer);
      
      // Iniciar el motor automáticamente
      this.engine.start();
      
      console.log('✅ ThreeJS Viewer inicializado');
    } catch (error) {
      console.error('❌ Error al inicializar ThreeJS Viewer:', error);
    }
  }

  ngOnDestroy(): void {
    this.engine.dispose();
  }

  /**
   * Inicia/pausa el motor
   */
  toggleEngine(): void {
    if (this.engine.isEngineRunning()) {
      this.engine.stop();
    } else {
      this.engine.start();
    }
  }

  /**
   * Resetea la posición de la cámara
   */
  resetCamera(): void {
    this.engine.resetCamera();
  }

  /**
   * Muestra/oculta el grid
   */
  toggleGrid(): void {
    this.showGrid.update(v => !v);
    // TODO: Implementar en SceneManager
    console.log('Toggle grid:', this.showGrid());
  }

  /**
   * Limpia la escena
   */
  clearScene(): void {
    if (confirm('¿Estás seguro de que quieres limpiar la escena?')) {
      this.engine.clearComponents();
      this.testLEDs = [];
      console.log('Escena limpiada');
    }
  }

  /**
   * TEST: Añade un LED de prueba
   */
  testAddLED(): void {
    const colors = ['red', 'green', 'blue', 'yellow'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const x = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10;
    
    const led = this.engine.addLED(
      new (window as any).THREE.Vector3(x, 0.5, z),
      color
    );
    
    this.testLEDs.push(led);
    console.log('LED añadido:', color, 'en', x, z);
  }

  /**
   * TEST: Añade un resistor de prueba
   */
  testAddResistor(): void {
    const values = [220, 330, 1000, 10000];
    const value = values[Math.floor(Math.random() * values.length)];
    
    const x = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10;
    
    this.engine.addResistor(
      new (window as any).THREE.Vector3(x, 0.5, z),
      value
    );
    
    console.log('Resistor añadido:', value, 'Ω en', x, z);
  }

  /**
   * TEST: Añade un cable de prueba
   */
  testAddWire(): void {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#000000'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const x1 = (Math.random() - 0.5) * 10;
    const z1 = (Math.random() - 0.5) * 10;
    const x2 = (Math.random() - 0.5) * 10;
    const z2 = (Math.random() - 0.5) * 10;
    
    this.engine.addWire(
      new (window as any).THREE.Vector3(x1, 0.5, z1),
      new (window as any).THREE.Vector3(x2, 0.5, z2),
      color
    );
    
    console.log('Cable añadido:', color, 'de', x1, z1, 'a', x2, z2);
  }

  /**
   * TEST: Enciende/apaga los LEDs
   */
  testToggleLED(): void {
    this.ledToggleState = !this.ledToggleState;
    
    this.testLEDs.forEach(led => {
      const color = led.userData.color;
      this.engine.updateLEDState(led, this.ledToggleState, color);
    });
    
    console.log('LEDs:', this.ledToggleState ? 'ENCENDIDOS' : 'APAGADOS');
  }
}
