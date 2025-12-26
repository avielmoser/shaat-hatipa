import { getActionColor, assignActionColors } from '../lib/domain/action-colors';
import type { ProtocolAction } from '../types/prescription';
import type { ClinicConfig } from '../config/clinics/types';

describe('action-colors', () => {
  describe('getActionColor', () => {
    it('uses explicit action.color if provided', () => {
      const action = { id: 'test-action', name: 'Test', color: '#ff0000' };
      const color = getActionColor(action);
      expect(color).toBe('#ff0000');
    });

    it('uses clinic actionColorMap if action.color is missing', () => {
      const action = { id: 'custom-action', name: 'Custom' };
      const clinic: ClinicConfig = {
        id: 'test-clinic',
        slug: 'test',
        name: 'Test Clinic',
        logoUrl: '/logo.png',
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          button: '#000000',
          text: '#000000',
        },
        copy: {
          he: { heroTitle: '', heroSubtitle: '' },
          en: { heroTitle: '', heroSubtitle: '' },
        },
        supportedProtocols: [],
        protocols: {},
        actionColorMap: {
          'custom-action': '#00ff00',
        },
      } as any;

      const color = getActionColor(action, clinic);
      expect(color).toBe('#00ff00');
    });

    it('uses legacy medication colors for Ein-Tal actions', () => {
      const sterodex = { id: 'sterodex', name: 'Sterodex' };
      const color = getActionColor(sterodex);
      expect(color).toBe('#0ea5e9'); // blue from legacy colors
    });

    it('same id returns same color (deterministic)', () => {
      const action1 = { id: 'unique-action-123', name: 'Action 1' };
      const action2 = { id: 'unique-action-123', name: 'Action 2' };
      
      const color1 = getActionColor(action1);
      const color2 = getActionColor(action2);
      
      expect(color1).toBe(color2);
    });

    it('different ids usually return different colors', () => {
      const action1 = { id: 'action-1', name: 'Action 1' };
      const action2 = { id: 'action-2', name: 'Action 2' };
      const action3 = { id: 'action-3', name: 'Action 3' };
      
      const color1 = getActionColor(action1);
      const color2 = getActionColor(action2);
      const color3 = getActionColor(action3);
      
      // At least two should be different (with 12 colors, collisions are rare but possible)
      const uniqueColors = new Set([color1, color2, color3]);
      expect(uniqueColors.size).toBeGreaterThan(1);
    });

    it('falls back to hash-based color when no explicit or legacy match', () => {
      const action = { id: 'unknown-action-xyz', name: 'Unknown Action' };
      const color = getActionColor(action);
      
      // Should be one of the palette colors
      const palette = [
        '#0ea5e9', '#a855f7', '#f97316', '#22c55e', '#eab308',
        '#ef4444', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981',
        '#ec4899', '#6366f1',
      ];
      expect(palette).toContain(color);
    });

    it('handles action with only name (no id)', () => {
      const action = { id: '', name: 'Action Name Only' };
      const color = getActionColor(action);
      expect(color).toBeTruthy();
      expect(typeof color).toBe('string');
      expect(color.startsWith('#')).toBe(true);
    });
  });

  describe('assignActionColors', () => {
    it('preserves existing action.color', () => {
      const actions: ProtocolAction[] = [
        { id: 'action-1', name: 'Action 1', color: '#ff0000', phases: [] },
        { id: 'action-2', name: 'Action 2', phases: [] },
      ];

      const result = assignActionColors(actions);
      
      expect(result[0].color).toBe('#ff0000');
      expect(result[1].color).toBeTruthy();
      expect(result[1].color).not.toBe('#ff0000');
    });

    it('assigns colors to all actions without color', () => {
      const actions: ProtocolAction[] = [
        { id: 'action-1', name: 'Action 1', phases: [] },
        { id: 'action-2', name: 'Action 2', phases: [] },
        { id: 'action-3', name: 'Action 3', phases: [] },
      ];

      const result = assignActionColors(actions);
      
      expect(result).toHaveLength(3);
      result.forEach(action => {
        expect(action.color).toBeTruthy();
        expect(typeof action.color).toBe('string');
        expect(action.color!.startsWith('#')).toBe(true);
      });
    });

    it('uses clinic actionColorMap when provided', () => {
      const actions: ProtocolAction[] = [
        { id: 'custom-1', name: 'Custom 1', phases: [] },
        { id: 'custom-2', name: 'Custom 2', phases: [] },
      ];

      const clinic: ClinicConfig = {
        id: 'test-clinic',
        slug: 'test',
        name: 'Test Clinic',
        logoUrl: '/logo.png',
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          button: '#000000',
          text: '#000000',
        },
        copy: {
          he: { heroTitle: '', heroSubtitle: '' },
          en: { heroTitle: '', heroSubtitle: '' },
        },
        supportedProtocols: [],
        protocols: {},
        actionColorMap: {
          'custom-1': '#aa0000',
          'custom-2': '#00aa00',
        },
      } as any;

      const result = assignActionColors(actions, clinic);
      
      expect(result[0].color).toBe('#aa0000');
      expect(result[1].color).toBe('#00aa00');
    });

    it('does not mutate original actions array', () => {
      const actions: ProtocolAction[] = [
        { id: 'action-1', name: 'Action 1', phases: [] },
      ];

      const originalColor = actions[0].color;
      const result = assignActionColors(actions);
      
      expect(actions[0].color).toBe(originalColor);
      expect(result[0].color).toBeTruthy();
    });
  });
});

