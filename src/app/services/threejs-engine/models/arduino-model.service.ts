import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * ARDUINO MODEL SERVICE
 * 
 * Crea y gestiona el modelo 3D del Arduino UNO
 */
@Injectable({
  providedIn: 'root'
})
export class ArduinoModelService {
  
  /**
   * Crea el modelo 3D del Arduino UNO
   */
  async create(): Promise<THREE.Group> {
    const arduino = new THREE.Group();
    arduino.name = 'Arduino UNO';

    // Placa base
    const boardGeometry = new THREE.BoxGeometry(5.3, 0.15, 6.8);
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0x00979D, // Color azul característico del Arduino
      metalness: 0.1,
      roughness: 0.5
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.castShadow = true;
    board.receiveShadow = true;
    arduino.add(board);

    // Puerto USB
    const usbGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.8);
    const usbMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.2
    });
    const usb = new THREE.Mesh(usbGeometry, usbMaterial);
    usb.position.set(-2.7, 0.3, -2.5);
    usb.castShadow = true;
    arduino.add(usb);

    // Chip ATmega
    const chipGeometry = new THREE.BoxGeometry(1.2, 0.15, 0.8);
    const chipMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.7
    });
    const chip = new THREE.Mesh(chipGeometry, chipMaterial);
    chip.position.set(0.5, 0.15, 0);
    chip.castShadow = true;
    arduino.add(chip);

    // Power LED
    const powerLEDGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8);
    const powerLEDMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
      metalness: 0.2,
      roughness: 0.3
    });
    const powerLED = new THREE.Mesh(powerLEDGeometry, powerLEDMaterial);
    powerLED.position.set(-1.5, 0.2, -2.8);
    powerLED.rotation.x = Math.PI / 2;
    arduino.add(powerLED);

    // Pines digitales (Headers)
    this.createPinHeaders(arduino, 'digital', 2.2, 2.5, 14);
    
    // Pines analógicos
    this.createPinHeaders(arduino, 'analog', 2.2, -2.5, 6);
    
    // Pines de poder
    this.createPowerPins(arduino);

    // Label (opcional)
    this.addLabel(arduino, 'ARDUINO UNO', new THREE.Vector3(0, 0.08, 2));

    return arduino;
  }

  /**
   * Crea los headers de pines
   */
  private createPinHeaders(
    arduino: THREE.Group,
    type: string,
    x: number,
    z: number,
    count: number
  ): void {
    const pinWidth = 0.15;
    const pinSpacing = 0.25;
    const pinHeight = 0.5;

    const startX = x - ((count - 1) * pinSpacing) / 2;

    for (let i = 0; i < count; i++) {
      const pinGroup = new THREE.Group();
      pinGroup.name = `${type}_${i}`;
      pinGroup.userData.pinType = type;
      pinGroup.userData.pinIndex = i;
      pinGroup.userData.isPin = true;

      // Base del pin (negro)
      const baseGeometry = new THREE.BoxGeometry(pinWidth, 0.3, pinWidth);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.2,
        roughness: 0.8
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.22;
      pinGroup.add(base);

      // Pin metálico (dorado)
      const pinGeometry = new THREE.CylinderGeometry(0.04, 0.04, pinHeight, 8);
      const pinMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1
      });
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);
      pin.position.y = 0.22 + 0.15 + pinHeight / 2;
      pinGroup.add(pin);

      pinGroup.position.set(startX + i * pinSpacing, 0, z);
      arduino.add(pinGroup);
    }
  }

  /**
   * Crea los pines de poder
   */
  private createPowerPins(arduino: THREE.Group): void {
    const powerPins = [
      { name: '5V', x: -2, z: 2.5 },
      { name: '3.3V', x: -1.75, z: 2.5 },
      { name: 'GND', x: -1.5, z: 2.5 },
      { name: 'VIN', x: -1.25, z: 2.5 },
      { name: 'GND2', x: -1, z: 2.5 }
    ];

    powerPins.forEach(pinData => {
      const pinGroup = new THREE.Group();
      pinGroup.name = `power_${pinData.name}`;
      pinGroup.userData.pinType = 'power';
      pinGroup.userData.pinName = pinData.name;
      pinGroup.userData.isPin = true;

      const baseGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.15);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.2,
        roughness: 0.8
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.22;
      pinGroup.add(base);

      const pinGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
      const pinMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1
      });
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);
      pin.position.y = 0.22 + 0.15 + 0.25;
      pinGroup.add(pin);

      pinGroup.position.set(pinData.x, 0, pinData.z);
      arduino.add(pinGroup);
    });
  }

  /**
   * Añade un label de texto (opcional, simplificado)
   */
  private addLabel(
    arduino: THREE.Group,
    text: string,
    position: THREE.Vector3
  ): void {
    // En una implementación real, usarías THREE.TextGeometry o un sprite con canvas
    // Por ahora, solo añadimos un marcador visual
    const labelGeometry = new THREE.PlaneGeometry(2, 0.3);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.copy(position);
    label.rotation.x = -Math.PI / 2;
    arduino.add(label);
  }

  /**
   * Obtiene la posición 3D de un pin específico
   */
  getPinPosition(arduino: THREE.Group, type: string, index: number | string): THREE.Vector3 | null {
    let pinName = '';
    
    if (type === 'digital' || type === 'D') {
      pinName = `digital_${index}`;
    } else if (type === 'analog' || type === 'A') {
      pinName = `analog_${index}`;
    } else if (type === 'power' || type === 'PWR') {
      pinName = `power_${index}`;
    }

    const pin = arduino.getObjectByName(pinName);
    if (!pin) return null;

    const worldPosition = new THREE.Vector3();
    pin.getWorldPosition(worldPosition);
    
    return worldPosition;
  }
}
