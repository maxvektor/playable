import * as merge from 'lodash/merge';
import { StyleSheet } from './style-sheet';

export const defaultThemeConfig = {
  color: '#f00',
  liveColor: '#ea492e',
};

export interface ThemeConfig {
  color?: string;
}

export function createStyleSheet(config: ThemeConfig = {}) {
  const styleSheet = new StyleSheet({
    svgFill: {
      fill: data => data.color,
    },
    svgStroke: {
      stroke: data => data.color,
    },
    volumeProgress: {
      backgroundColor: data => data.color,
      '&:after': {
        backgroundColor: data => data.color,
      },
    },
    volumeProgressBackground: {
      backgroundColor: data => transperentize(data.color, 0.25),
    },
    text: {
      color: data => data.color,
    },
    progressPlayed: {
      backgroundColor: data => data.color,
      '&:after': {
        backgroundColor: data => data.color,
      },
    },
    progressSeekTo: {
      backgroundColor: data => transperentize(data.color, 0.5),
    },
    progressBackground: {
      backgroundColor: data => transperentize(data.color, 0.25),
    },
    progressSyncBtn: {
      borderColor: data => data.color,
    },
  });

  styleSheet.update(merge(defaultThemeConfig, config));

  return styleSheet;
}

function transperentize(color, alpha) {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r},${g},${b},${alpha})`;
}

function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(_, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
