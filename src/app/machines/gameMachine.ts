import { createMachine, assign } from 'xstate';

type GameContext = {
  selectedNodeId: string | null;
  selectedRoadId: string | null;
};

type GameEvent =
  | { type: 'SELECT_NODE'; id: string }
  | { type: 'SELECT_ROAD'; id: string }
  | { type: 'INICIAR_CONEXION' }
  | { type: 'CANCELAR_ACCION' }
  | { type: 'CLOSE_PANEL' };

export const gameMachine = createMachine({
  id: 'gameUI',
  initial: 'idle',
  context: {
    selectedNodeId: null,
    selectedRoadId: null,
  } as GameContext,
  states: {
    idle: {
      on: {
        SELECT_NODE: { target: 'nodeSelected', actions: assign({ selectedNodeId: ({ event }) => event.id, selectedRoadId: () => null }) },
        SELECT_ROAD: { target: 'roadSelected', actions: assign({ selectedRoadId: ({ event }) => event.id, selectedNodeId: () => null }) },
      },
    },
    nodeSelected: {
      on: {
        SELECT_NODE: { target: 'nodeSelected', actions: assign({ selectedNodeId: ({ event }) => event.id }) },
        SELECT_ROAD: { target: 'roadSelected', actions: assign({ selectedRoadId: ({ event }) => event.id, selectedNodeId: () => null }) },
        INICIAR_CONEXION: { target: 'modoConstruccion' },
        CLOSE_PANEL: { target: 'idle', actions: assign({ selectedNodeId: () => null }) },
      },
    },
    modoConstruccion: {
      on: {
        SELECT_NODE: { 
          target: 'nodeSelected', // Regresa manteniendo la vista comercial del nodo
          actions: assign({ selectedNodeId: ({ event }) => event.id }) 
        },
        CANCELAR_ACCION: { target: 'nodeSelected' },
        CLOSE_PANEL: { target: 'idle', actions: assign({ selectedNodeId: () => null }) },
      },
    },
    roadSelected: {
      on: {
        SELECT_ROAD: { target: 'roadSelected', actions: assign({ selectedRoadId: ({ event }) => event.id }) },
        SELECT_NODE: { target: 'nodeSelected', actions: assign({ selectedNodeId: ({ event }) => event.id, selectedRoadId: () => null }) },
        CLOSE_PANEL: { target: 'idle', actions: assign({ selectedRoadId: () => null }) },
      },
    },
  },
});