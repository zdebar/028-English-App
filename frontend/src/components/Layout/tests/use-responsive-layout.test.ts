import { describe, expect, it } from 'vitest';
import { resolveResponsiveLayout } from '../use-responsive-layout';

const componentSizes = {
  maxCardHeight: 400,
  headerHeight: 84,
  secondaryControlsHeight: 52,
};

describe('resolveResponsiveLayout', () => {
  it('keeps header above and secondary controls below in portrait', () => {
    expect(
      resolveResponsiveLayout({
        ...componentSizes,
        viewportWidth: 400,
        viewportHeight: 500,
      }),
    ).toEqual({ headerLayout: 'top', secondaryLayout: 'bottom' });
  });

  it('moves header and secondary controls to the sides at the card-height boundary', () => {
    expect(
      resolveResponsiveLayout({
        ...componentSizes,
        viewportWidth: 800,
        viewportHeight: 400,
      }),
    ).toEqual({ headerLayout: 'side', secondaryLayout: 'side' });
  });

  it('keeps only the header at the sides above the card-height boundary', () => {
    expect(
      resolveResponsiveLayout({
        ...componentSizes,
        viewportWidth: 800,
        viewportHeight: 401,
      }),
    ).toEqual({ headerLayout: 'side', secondaryLayout: 'bottom' });
  });

  it('moves the header above when all components fit', () => {
    expect(
      resolveResponsiveLayout({
        ...componentSizes,
        viewportWidth: 800,
        viewportHeight: 536,
      }),
    ).toEqual({ headerLayout: 'top', secondaryLayout: 'bottom' });
  });

  it('derives both boundaries from the supplied component sizes', () => {
    const customSizes = {
      maxCardHeight: 420,
      headerHeight: 90,
      secondaryControlsHeight: 60,
    };

    expect(
      resolveResponsiveLayout({
        ...customSizes,
        viewportWidth: 900,
        viewportHeight: 420,
      }),
    ).toEqual({ headerLayout: 'side', secondaryLayout: 'side' });
    expect(
      resolveResponsiveLayout({
        ...customSizes,
        viewportWidth: 900,
        viewportHeight: 570,
      }),
    ).toEqual({ headerLayout: 'top', secondaryLayout: 'bottom' });
  });
});
