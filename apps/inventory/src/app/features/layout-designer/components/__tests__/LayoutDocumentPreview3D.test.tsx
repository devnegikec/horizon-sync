/**
 * Tests for the 3D document preview.
 *
 * The scene *derivation* is pure, so it is asserted directly: framing, per-lane rack
 * heights and obstacle boxes are all computed by the compiler in metres.
 *
 * The expanded canvas is deliberately not mounted here - jsdom has no WebGL. What is
 * covered without a GPU is the empty branch and the collapsed toggle; a real render
 * belongs in Playwright, which this repo already runs.
 */

import * as React from 'react';

import { render, screen } from '@testing-library/react';

import { layoutDocSchema } from '../../layout-core';
import { CROSS_AISLE_TWO_WAY, MINIMAL, clone } from '../../layout-core/__tests__/fixtures';
import { LayoutDocumentPreview3D, Preview3DToggle, laneStackHeights, obstacleBoxes, previewFraming } from '../LayoutDocumentPreview3D';

const parse = (document: unknown) => layoutDocSchema.parse(document);

describe('previewFraming', () => {
  it('centres on the building and sizes the radius from its longest side', () => {
    const framing = previewFraming(parse(clone(CROSS_AISLE_TWO_WAY)));

    expect(framing.center).toEqual([20, 0, 16]);
    expect(framing.radius).toBe(40);
    expect(framing.camera[0]).toBeGreaterThan(20);
    expect(framing.camera[1]).toBeGreaterThan(10); // above the 9 m roof
    expect(framing.camera[2]).toBeGreaterThan(16);
  });

  it('never frames closer than a 4 m radius, however small the document', () => {
    const tiny = { schemaVersion: 1, warehouse: { code: 'T', lengthM: 2, widthM: 2, heightM: 2 } };

    expect(previewFraming(parse(tiny)).radius).toBe(4);
  });
});

describe('laneStackHeights', () => {
  it('sums beam plus clear height per lane', () => {
    const heights = laneStackHeights(parse(clone(MINIMAL)));

    // Two levels of 0.08 + 1.4.
    expect(heights.get('A01/A01-L')).toBeCloseTo(2.96, 6);
    expect(heights.size).toBe(1);
  });

  it('keys every lane of every aisle', () => {
    const heights = laneStackHeights(parse(clone(CROSS_AISLE_TWO_WAY)));

    expect(heights.size).toBe(6);
    // Five levels of 0.08 + 1.4.
    expect(heights.get('A03/A03-R')).toBeCloseTo(7.4, 6);
  });

  it('returns nothing without a document', () => {
    expect(laneStackHeights(null).size).toBe(0);
  });
});

describe('obstacleBoxes', () => {
  it('lifts each minimum corner onto the box centre', () => {
    const boxes = obstacleBoxes(parse(clone(CROSS_AISLE_TWO_WAY)));
    const pillar = boxes.find((box) => box.key === 'pil-1');

    // The pillar's minimum corner is (10, 28.5) with a 0.8 m square footprint, 9 m tall.
    expect(pillar?.position).toEqual([10.4, 4.5, 28.9]);
    expect(pillar?.size).toEqual([0.8, 9, 0.8]);
  });

  it('colours by obstacle kind', () => {
    const boxes = obstacleBoxes(parse(clone(CROSS_AISLE_TWO_WAY)));
    const byKey = new Map(boxes.map((box) => [box.key, box.color]));

    expect(byKey.get('col-1')).toBe('#94a3b8');
    expect(byKey.get('pil-1')).toBe('#f59e0b');
    expect(byKey.get('office-1')).toBe('#8b5cf6');
  });

  it('falls back to a synthetic key and the custom colour', () => {
    const document = clone(MINIMAL);
    document.obstacles = [{ kind: 'CUSTOM', x: 0, z: 0, widthM: 1, depthM: 1, heightM: 1 }];

    const boxes = obstacleBoxes(parse(document));

    expect(boxes).toHaveLength(1);
    expect(boxes[0].key).toBe('CUSTOM-0');
    expect(boxes[0].color).toBe('#14b8a6');
  });

  it('returns nothing without a document', () => {
    expect(obstacleBoxes(null)).toEqual([]);
  });
});

describe('LayoutDocumentPreview3D', () => {
  it('explains itself instead of mounting a canvas when there are no bins', () => {
    render(<LayoutDocumentPreview3D document={{ schemaVersion: 1, warehouse: { code: 'EMPTY', lengthM: 10, widthM: 10, heightM: 6 } }} />);

    expect(screen.getByText(/produces no bins/i)).toBeInTheDocument();
  });
});

describe('Preview3DToggle', () => {
  it('starts collapsed so nothing renders a canvas until asked', () => {
    render(<Preview3DToggle document={clone(MINIMAL)} />);

    expect(screen.getByRole('button', { name: /show 3d preview/i })).toBeInTheDocument();
  });
});
