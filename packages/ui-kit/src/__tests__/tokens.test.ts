import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  SKYLEARN_COLORS,
  SKYLEARN_TYPOGRAPHY,
  SKYLEARN_RADII,
  SKYLEARN_SHADOWS,
  SKYLEARN_MOTION,
  SEVERITY_THEME_MAP,
  skylearnTokens,
} from '../tokens/skylearnTokens.ts';

describe('Skylearn Tokens Integrity', () => {
  test('verifies all 23 exact hex color tokens', () => {
    const expectedTokens: Record<string, string> = {
      sky: '#3B82F6',
      skyBright: '#60A5FA',
      skyDeep: '#1D4ED8',
      skySoft: '#DBEAFE',
      sun: '#FBBF24',
      sunBright: '#FCD34D',
      sunDeep: '#D97706',
      leaf: '#22C55E',
      leafSoft: '#DCFCE7',
      leafDeep: '#16A34A',
      coral: '#F87171',
      coralSoft: '#FEE2E2',
      berry: '#A855F7',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceElevated: '#FFFFFF',
      surfaceSunken: '#F1F5F9',
      ink: '#0F172A',
      inkMuted: '#475569',
      inkSubtle: '#94A3B8',
      inkFaint: '#CBD5E1',
      outline: '#E2E8F0',
      outlineStrong: '#94A3B8',
    };

    assert.strictEqual(Object.keys(expectedTokens).length, 23, 'Must have exactly 23 tokens');

    for (const [key, value] of Object.entries(expectedTokens)) {
      assert.strictEqual(
        SKYLEARN_COLORS[key as keyof typeof SKYLEARN_COLORS],
        value,
        `Token ${key} must match hex ${value}`
      );
    }
  });

  test('verifies typography font stacks and letterforms', () => {
    assert.match(SKYLEARN_TYPOGRAPHY.fonts.display, /Hubot Sans/);
    assert.match(SKYLEARN_TYPOGRAPHY.fonts.body, /Atkinson Hyperlegible/);
    assert.match(SKYLEARN_TYPOGRAPHY.fonts.reading, /Lexend Deca/);
    assert.match(SKYLEARN_TYPOGRAPHY.fonts.mono, /JetBrains Mono/);

    // Atkinson Hyperlegible letter spacing for dyslexia support
    assert.strictEqual(SKYLEARN_TYPOGRAPHY.letterSpacing.body, '0.01em');
  });

  test('verifies type scale definitions', () => {
    const { scale } = SKYLEARN_TYPOGRAPHY;
    assert.strictEqual(scale.hero.fontSize, '56px');
    assert.strictEqual(scale.h1.fontSize, '40px');
    assert.strictEqual(scale.h2.fontSize, '32px');
    assert.strictEqual(scale.h3.fontSize, '24px');
    assert.strictEqual(scale.h4.fontSize, '19px');
    assert.strictEqual(scale.bodyLarge.fontSize, '20px');
    assert.strictEqual(scale.body.fontSize, '18px');
    assert.strictEqual(scale.small.fontSize, '16px'); // minimum allowed crew text
    assert.strictEqual(scale.caption.fontSize, '14px');
    assert.strictEqual(scale.scoreNumber.fontSize, '56px');
  });

  test('verifies border radii and elevation shadows', () => {
    assert.strictEqual(SKYLEARN_RADII.sm, '8px');
    assert.strictEqual(SKYLEARN_RADII.md, '12px');
    assert.strictEqual(SKYLEARN_RADII.button, '16px');
    assert.strictEqual(SKYLEARN_RADII.card, '20px');
    assert.strictEqual(SKYLEARN_RADII.modal, '28px');
    assert.strictEqual(SKYLEARN_RADII.full, '999px');

    assert.ok(SKYLEARN_SHADOWS.cardActive.includes('#3B82F6') || SKYLEARN_SHADOWS.cardActive.includes('59, 130, 246'));
    assert.ok(SKYLEARN_SHADOWS.rewardGlow.includes('252, 211, 77'));
  });

  test('verifies motion durations and cubic-bezier curve', () => {
    assert.strictEqual(SKYLEARN_MOTION.spring, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
    assert.strictEqual(SKYLEARN_MOTION.durations.snap, 120);
    assert.strictEqual(SKYLEARN_MOTION.durations.standard, 240);
    assert.strictEqual(SKYLEARN_MOTION.durations.burst, 320);
    assert.strictEqual(SKYLEARN_MOTION.durations.progress, 480);
    assert.strictEqual(SKYLEARN_MOTION.durations.celebration, 1600);
    assert.strictEqual(SKYLEARN_MOTION.durations.glow, 2000);
  });

  test('verifies SEVERITY_THEME_MAP never relies on color alone', () => {
    const severities = ['green', 'yellow', 'red'] as const;
    for (const sev of severities) {
      const theme = SEVERITY_THEME_MAP[sev];
      assert.ok(theme.bg, `Severity ${sev} must have background`);
      assert.ok(theme.border, `Severity ${sev} must have border`);
      assert.ok(theme.text, `Severity ${sev} must have text color`);
      assert.ok(theme.label, `Severity ${sev} must have text label`);
      assert.ok(theme.iconName, `Severity ${sev} must have paired icon name`);
    }

    assert.strictEqual(SEVERITY_THEME_MAP.green.iconName, 'check-circle');
    assert.strictEqual(SEVERITY_THEME_MAP.yellow.iconName, 'alert-triangle');
    assert.strictEqual(SEVERITY_THEME_MAP.red.iconName, 'alert-octagon');
  });

  test('verifies skylearnTokens default object has all namespaces', () => {
    assert.ok(skylearnTokens.colors);
    assert.ok(skylearnTokens.typography);
    assert.ok(skylearnTokens.radii);
    assert.ok(skylearnTokens.shadows);
    assert.ok(skylearnTokens.spacing);
    assert.ok(skylearnTokens.motion);
    assert.ok(skylearnTokens.severity);
  });
});
