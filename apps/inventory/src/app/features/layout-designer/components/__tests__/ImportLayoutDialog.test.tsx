/**
 * Render tests for the import dialog.
 *
 * These mount the real component tree (Radix dialog + the shared compiler) and drive it
 * through a paste, so a broken hook or a bad prop shape fails here rather than in the
 * browser. The signed-out state is used deliberately: nothing must hit the network for
 * validation to work, which is the whole point of shipping the compiler in the app.
 */

import * as React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@horizon-sync/store', () => ({
  useUserStore: (selector: (state: { accessToken: string | null }) => unknown) => selector({ accessToken: null }),
}));

import { CROSS_AISLE_TWO_WAY, clone } from '../../layout-core/__tests__/fixtures';
import { ImportLayoutDialog } from '../ImportLayoutDialog';

const PASTE_PLACEHOLDER = /\{ "schemaVersion"/;

function renderDialog() {
  return render(<ImportLayoutDialog open onOpenChange={() => undefined} warehouseId="wh-1" />);
}

async function pasteDocument(text: string) {
  fireEvent.change(screen.getByPlaceholderText(PASTE_PLACEHOLDER), { target: { value: text } });
  await userEvent.click(screen.getByRole('button', { name: /validate pasted json/i }));
}

describe('ImportLayoutDialog', () => {
  it('renders its controls without a token or a network call', () => {
    renderDialog();

    expect(screen.getByText('Import layout JSON')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose json file/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(PASTE_PLACEHOLDER)).toBeInTheDocument();
  });

  it('keeps Validate disabled while the paste box is empty', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: /validate pasted json/i })).toBeDisabled();
  });

  it('validates a pasted document locally and shows the derived counts', async () => {
    renderDialog();

    await pasteDocument(JSON.stringify(CROSS_AISLE_TWO_WAY));

    expect(screen.getByText('240')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText(/no blocking errors/i)).toBeInTheDocument();
  });

  it('shows the generated WMS codes for the pasted document', async () => {
    renderDialog();

    await pasteDocument(JSON.stringify(CROSS_AISLE_TWO_WAY));

    expect(screen.getByText('Z01-A01-B01-L01-BN001')).toBeInTheDocument();
  });

  it('reports malformed JSON without throwing', async () => {
    renderDialog();

    await pasteDocument('{ not json }');

    expect(screen.getByText(/not valid json/i)).toBeInTheDocument();
  });

  it('blocks apply when the compiler reports a blocking error', async () => {
    renderDialog();
    const broken = clone(CROSS_AISLE_TWO_WAY);
    broken.aisles[0].centerline = { x1: 4, z1: 7.5, x2: 10, z2: 12 };

    await pasteDocument(JSON.stringify(broken));

    expect(screen.getByText('AISLE_NOT_AXIS_ALIGNED')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply layout/i })).toBeDisabled();
  });

  it('leaves the destructive replace option off until the operator asks for it', async () => {
    renderDialog();

    await pasteDocument(JSON.stringify(CROSS_AISLE_TWO_WAY));

    // Apply submits whatever is ticked in the same click, so it must not start ticked.
    expect(screen.getByRole('checkbox', { name: /deactivate locations/i })).not.toBeChecked();
  });
});
