import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * COMPONENT MODEL SERVICE
 * 
 * Crea modelos 3D de componentes electrónicos:
 * - LEDs
 * - Resistores
 * - Cables
 */
@Injectable({
  providedIn: 'root'
})
export class ComponentModelService {

  /**
   * Crea un LED 3D
   */
  createLED(color: string): THREE.Group {
    const led = new THREE.Group();
    led.name = 'LED';
    led.userData.isComponent = true;
    led.userData.componentType = 'LED';
    led.userData.color = color;
    led.userData.isOn = false;

    // Convertir color string a hex
    const colorHex = this.getColorHex(color);

    // Cuerpo del LED (cúpula transparente)
    const bodyGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.15;
    body.castShadow = true;
    led.add(body);
    led.userData.body = body;

    // Base del LED (negro)
    const baseGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.05;
    base.castShadow = true;
    led.add(base);

    // Ánodo (+) - cable largo
    const anodeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const pinMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.2
    });
    const anode = new THREE.Mesh(anodeGeometry, pinMaterial);
    anode.position.set(-0.08, -0.2, 0);
    led.add(anode);
    led.userData.anode = anode;

    // Cátodo (-) - cable corto
    const cathodeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const cathode = new THREE.Mesh(cathodeGeometry, pinMaterial.clone());
    cathode.position.set(0.08, -0.15, 0);
    led.add(cathode);
    led.userData.cathode = cathode;

    // Luz puntual (inicialmente apagada)
    const light = new THREE.PointLight(colorHex, 0, 2);
    light.position.y = 0.15;
    led.add(light);
    led.userData.light = light;

    return led;
  }

  /**
   * Actualiza el estado de un LED (encendido/apagado)
   */
  updateLEDState(led: THREE.Object3D, isOn: boolean, color: string): void {
    if (!led.userData.isComponent || led.userData.componentType !== 'LED') {
      return;
    }

    led.userData.isOn = isOn;

    const body = led.userData.body as THREE.Mesh;
    const light = led.userData.light as THREE.PointLight;
    const colorHex = this.getColorHex(color);

    if (isOn) {
      // Encender LED
      light.intensity = 1.5;
      light.distance = 3;
      
      const material = body.material as THREE.MeshPhysicalMaterial;
      material.emissive.setHex(colorHex);
      material.emissiveIntensity = 0.8;
    } else {
      // Apagar LED
      light.intensity = 0;
      
      const material = body.material as THREE.MeshPhysicalMaterial;
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
  }

  /**
   * Crea un resistor 3D
   */
  createResistor(value: number): THREE.Group {
    const resistor = new THREE.Group();
    resistor.name = 'Resistor';
    resistor.userData.isComponent = true;
    resistor.userData.componentType = 'RESISTOR';
    resistor.userData.value = value;

    // Cuerpo del resistor (cilindro beige/marrón)
    const bodyGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      metalness: 0.1,
      roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    resistor.add(body);

    // Bandas de color (simplificado - 3 bandas)
    this.addResistorBands(resistor, value);

    // Pin izquierdo
    const pin1Geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const pinMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.2
    });
    const pin1 = new THREE.Mesh(pin1Geometry, pinMaterial);
    pin1.position.set(-0.35, 0, 0);
    pin1.rotation.z = Math.PI / 2;
    resistor.add(pin1);

    // Pin derecho
    const pin2 = new THREE.Mesh(pin1Geometry, pinMaterial.clone());
    pin2.position.set(0.35, 0, 0);
    pin2.rotation.z = Math.PI / 2;
    resistor.add(pin2);

    return resistor;
  }

  /**
   * Añade bandas de color al resistor
   */
  private addResistorBands(resistor: THREE.Group, value: number): void {
    // Simplificado: solo añadir bandas visuales genéricas
    const bandGeometry = new THREE.CylinderGeometry(0.082, 0.082, 0.04, 16);
    const colors = [0xff0000, 0x00ff00, 0x0000ff]; // Rojo, verde, azul

    for (let i = 0; i < 3; i++) {
      const bandMaterial = new THREE.MeshStandardMaterial({
        color: colors[i],
        metalness: 0.2,
        roughness: 0.6
      });
      const band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.position.set(-0.15 + i * 0.1, 0, 0);
      band.rotation.z = Math.PI / 2;
      resistor.add(band);
    }
  }

  /**
   * Crea un cable 3D entre dos puntos
   */
  createWire(
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: string = '#ff0000'
  ): THREE.Group {
    const wire = new THREE.Group();
    wire.name = 'Wire';
    wire.userData.isComponent = true;
    wire.userData.componentType = 'WIRE';
    wire.userData.color = color;
    wire.userData.start = start.clone();
    wire.userData.end = end.clone();

    const colorHex = this.getColorHex(color);

    // Crear curva para el cable (más natural que una línea recta)
    const curve = new THREE.CatmullRomCurve3([
      start,
      new THREE.Vector3(
        (start.x + end.x) / 2,
        Math.max(start.y, end.y) + 0.5,
        (start.z + end.z) / 2
      ),
      end
    ]);

    // Geometría del cable
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.2,
      roughness: 0.5
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.castShadow = true;
    wire.add(tube);

    // Conectores en los extremos
    const connectorGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const connectorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.3
    });

    const startConnector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    startConnector.position.copy(start);
    wire.add(startConnector);

    const endConnector = new THREE.Mesh(connectorGeometry, connectorMaterial.clone());
    endConnector.position.copy(end);
    wire.add(endConnector);

    return wire;
  }

  /**
   * Actualiza la posición de un cable
   */
  updateWirePosition(
    wire: THREE.Object3D,
    start: THREE.Vector3,
    end: THREE.Vector3
  ): void {
    if (!wire.userData.isComponent || wire.userData.componentType !== 'WIRE') {
      return;
    }

    wire.userData.start = start.clone();
    wire.userData.end = end.clone();

    // Eliminar geometría antigua
    wire.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    wire.clear();

    // Recrear cable
    const colorHex = this.getColorHex(wire.userData.color);

    const curve = new THREE.CatmullRomCurve3([
      start,
      new THREE.Vector3(
        (start.x + end.x) / 2,
        Math.max(start.y, end.y) + 0.5,
        (start.z + end.z) / 2
      ),
      end
    ]);

    const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.2,
      roughness: 0.5
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.castShadow = true;
    wire.add(tube);

    // Recrear conectores
    const connectorGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const connectorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.3
    });

    const startConnector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    startConnector.position.copy(start);
    wire.add(startConnector);

    const endConnector = new THREE.Mesh(connectorGeometry, connectorMaterial.clone());
    endConnector.position.copy(end);
    wire.add(endConnector);
  }

  /**
   * Convierte un color string a hexadecimal
   */
  private getColorHex(color: string): number {
    const colorMap: { [key: string]: number } = {
      'red': 0xff0000,
      'green': 0x00ff00,
      'blue': 0x0000ff,
      'yellow': 0xffff00,
      'white': 0xffffff,
      'orange': 0xff8800,
      'purple': 0x8800ff,
      'pink': 0xff00ff
    };

    if (colorMap[color.toLowerCase()]) {
      return colorMap[color.toLowerCase()];
    }

    // Si es un color hex string (#ff0000)
    if (color.startsWith('#')) {
      return parseInt(color.substring(1), 16);
    }

    // Si es un color RGB string (rgb(255, 0, 0))
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = parseInt(matches[0]);
        const g = parseInt(matches[1]);
        const b = parseInt(matches[2]);
        return (r << 16) | (g << 8) | b;
      }
    }

    // Por defecto, rojo
    return 0xff0000;
  }
}
