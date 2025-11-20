import { Component } from '@angular/core';
import { ToolboxComponent } from './components/toolbox/toolbox.component';
import { ProtoboardComponent } from './components/protoboard/protoboard.component';
import { ControlsComponent } from './components/controls/controls.component';
import { ArduinoBoardComponent } from './components/arduino-board/arduino-board.component';
import { CircuitDiagnosticsComponent } from './components/circuit-diagnostics/circuit-diagnostics.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ToolboxComponent, 
    ProtoboardComponent, 
    ControlsComponent,
    ArduinoBoardComponent,
    CircuitDiagnosticsComponent
  ],
  template: `
    <div class="app-container">
      <header>
        <h1>⚡ Simulador de Arduino</h1>
        <p class="subtitle">Sistema de colocación por clic + Cables de conexión</p>
      </header>

      <div class="workspace">
        <aside class="sidebar-left">
          <app-toolbox></app-toolbox>
          <app-circuit-diagnostics></app-circuit-diagnostics>
        </aside>

        <main class="main-content">
          <div class="boards">
            <app-arduino-board></app-arduino-board>
            <app-protoboard></app-protoboard>
          </div>
        </main>

        <aside class="sidebar-right">
          <app-controls></app-controls>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    header {
      text-align: center;
      color: white;
      margin-bottom: 30px;
    }

    h1 {
      margin: 0;
      font-size: 42px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .subtitle {
      margin: 10px 0 0 0;
      font-size: 18px;
      opacity: 0.9;
    }

    .workspace {
      display: grid;
      grid-template-columns: 280px 1fr 280px;
      gap: 20px;
      max-width: 1900px;
      margin: 0 auto;
    }

    .sidebar-left,
    .sidebar-right {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .main-content {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .boards {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
    }

    /* Responsive design */
    @media (max-width: 1600px) {
      .workspace {
        grid-template-columns: 260px 1fr 260px;
      }
    }

    @media (max-width: 1400px) {
      .workspace {
        grid-template-columns: 1fr;
      }

      .sidebar-left,
      .sidebar-right {
        max-width: 900px;
        margin: 0 auto;
      }

      .sidebar-left {
        order: 1;
      }

      .main-content {
        order: 2;
      }

      .sidebar-right {
        order: 3;
      }
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 32px;
      }

      .subtitle {
        font-size: 16px;
      }

      .workspace {
        gap: 15px;
      }
    }
  `]
})
export class AppComponent {
  title = 'Arduino Simulator';
}