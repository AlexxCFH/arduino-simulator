import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircuitSimulatorService } from '../../services/circuit-simulator.service';
import { Protoboard } from '../../models/protoboard.model';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css']
})
export class ControlsComponent {
  blinkInterval: any = null;

  constructor(public simulator: CircuitSimulatorService) {}

  /**
   * Limpia todos los componentes del circuito
   */
  clearAll() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los componentes?')) {
      // Detener simulación
      this.simulator.stop();

      // Detener blink si está activo
      if (this.blinkInterval) {
        clearInterval(this.blinkInterval);
        this.blinkInterval = null;
      }

      // Limpiar componentes
      const components = this.simulator.components();
      components.forEach(c => this.simulator.removeComponent(c.id));

      console.log('🗑️ Todo limpiado');
    }
  }

  /**
   * Test: Enciende el pin 13 (LED integrado del Arduino)
   */
  testPin13() {
    console.log('🧪 Test: Pin 13 → HIGH');
    this.simulator.pinMode(13, 'OUTPUT');
    this.simulator.digitalWrite(13, 'HIGH');
  }

  /**
   * Test: Enciende el pin 12
   */
  testPin12() {
    console.log('🧪 Test: Pin 12 → HIGH');
    this.simulator.pinMode(12, 'OUTPUT');
    this.simulator.digitalWrite(12, 'HIGH');
  }

  /**
   * Test: Apaga todos los pines digitales
   */
  testAllOff() {
    console.log('🧪 Test: Apagar todos los pines');

    // Detener blink si está activo
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }

    // Apagar todos los pines digitales
    for (let i = 0; i < 14; i++) {
      this.simulator.digitalWrite(i, 'LOW');
    }

    console.log('🔴 Todos los pines apagados');
  }

  /**
   * Test: Hace parpadear el pin 13
   */
  testBlink() {
    if (this.blinkInterval) {
      // Si ya está parpadeando, detenerlo
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
      console.log('⏸️ Blink detenido');
      return;
    }

    console.log('🧪 Test: Blink en Pin 13');

    this.simulator.pinMode(13, 'OUTPUT');
    let state: 'HIGH' | 'LOW' = 'LOW';

    this.blinkInterval = setInterval(() => {
      state = state === 'HIGH' ? 'LOW' : 'HIGH';
      this.simulator.digitalWrite(13, state);
      console.log(`⚡ Blink: ${state}`);
    }, 500); // Cambiar cada 500ms
  }

  /**
   * Debug: Muestra información detallada del circuito
   */
  debugCircuit() {
    console.clear();
    console.log('═══════════════════════════════════════');
    console.log('🔬 DEBUG DEL CIRCUITO');
    console.log('═══════════════════════════════════════');

    const components = this.simulator.components();

    console.log(`\n📦 Total componentes: ${components.length}`);

    if (components.length === 0) {
      console.log('⚠️ No hay componentes en el circuito');
      console.log('═══════════════════════════════════════');
      return;
    }

    components.forEach((comp, index) => {
      console.log(`\n${index + 1}. ${comp.type} (ID: ${comp.id})`);
      console.log(`   Posición base: [${comp.position.row}, ${comp.position.col}]`);
      console.log(`   Cantidad de pines: ${comp.pins.length}`);

      comp.pins.forEach((pin, pIndex) => {
        const label = pin.label || `Pin ${pIndex + 1}`;
        console.log(
          `     ${label}: [${pin.position.row}, ${pin.position.col}] - ${pin.voltage.toFixed(2)}V`
        );
      });
    });

    console.log('\n═══════════════════════════════════════');
  }

  /**
   * Test: Verifica las conexiones de la protoboard
   */
  testProtoboardConnections() {
    console.clear();
    console.log('═══════════════════════════════════════');
    console.log('🧪 TEST DE CONEXIONES DE PROTOBOARD');
    console.log('═══════════════════════════════════════');

    const protoboard = new Protoboard();

    // Test 1: Conexiones verticales en columna 1
    console.log('\n🔍 TEST 1: Conexiones verticales en columna 1');
    console.log('   Probando desde A1 [0, 0]:');
    const connections1 = protoboard.getConnectedPositions({ row: 0, col: 0 });
    console.log(`   ✅ Deberían ser 5 conexiones (A1-E1)`);

    // Test 2: Conexiones verticales en columna 2
    console.log('\n🔍 TEST 2: Conexiones verticales en columna 2');
    console.log('   Probando desde A2 [0, 1]:');
    const connections2 = protoboard.getConnectedPositions({ row: 0, col: 1 });
    console.log(`   ✅ Deberían ser 5 conexiones (A2-E2)`);

    // Test 3: Verificar que las secciones NO se conectan
    console.log('\n🔍 TEST 3: Verificar separación del canal central');
    const areConnected = protoboard.areInternallyConnected({ row: 0, col: 0 }, { row: 5, col: 0 });
    console.log(`   A1 [0,0] y F1 [5,0] conectados: ${areConnected}`);
    console.log(`   ✅ Debería ser FALSE (canal central los separa)`);

    // Test 4: Verificar conexiones en la misma sección
    console.log('\n🔍 TEST 4: Verificar conexiones en la misma sección');
    const sameSection = protoboard.areInternallyConnected({ row: 0, col: 0 }, { row: 1, col: 0 });
    console.log(`   A1 [0,0] y B1 [1,0] conectados: ${sameSection}`);
    console.log(`   ✅ Debería ser TRUE (misma sección y columna)`);

    // Test 5: Verificar que diferentes columnas NO se conectan
    console.log('\n🔍 TEST 5: Verificar que diferentes columnas NO se conectan');
    const diffColumn = protoboard.areInternallyConnected({ row: 0, col: 0 }, { row: 0, col: 1 });
    console.log(`   A1 [0,0] y A2 [0,1] conectados: ${diffColumn}`);
    console.log(`   ✅ Debería ser FALSE (diferente columna)`);

    console.log('\n═══════════════════════════════════════');
  }

  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy() {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
    }
  }
}