import { Injectable } from '@angular/core';
import { Component } from '../models/component.model';
import { LED } from '../models/electronic-components/led.model';
import { Resistor } from '../models/electronic-components/resistor.model';
import { Wire } from '../models/electronic-components/wire.model';
import { ComponentTemplate } from '../state/selection.state';

@Injectable({
  providedIn: 'root'
})
export class ComponentFactoryService {

  createComponent(
    type: string, 
    position: { row: number; col: number },
    template?: ComponentTemplate
  ): Component {

    const normalizedType = type.toLowerCase();

    switch(normalizedType) {

      case 'led':
        const color = template?.color as any || 'red';
        const led = new LED(color, position);
        
        // NO establecer voltaje por defecto
        // El voltaje se establecerá cuando se conecten los cables
        
        return led;

      case 'resistor':
        const resistance = template?.resistance || 1000;
        const resistor = new Resistor(resistance, position);
        return resistor;

      case 'wire':
        const wireColor = template?.color || '#ff0000';
        const wire = new Wire(position, wireColor);
        return wire;

      default:
        throw new Error(`Tipo de componente desconocido: ${type}`);
    }
  }
}