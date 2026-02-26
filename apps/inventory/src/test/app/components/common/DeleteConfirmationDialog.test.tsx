import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DeleteConfirmationDialog } from '../../../../app/components/common/DeleteConfirmationDialog';

describe('DeleteConfirmationDialog', () => {
  it('should render with default props', () => {
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();

    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        description="Are you sure you want to delete this item?"
      />
    );

    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should render with custom title and button text', () => {
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();

    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="Delete Invoice"
        description="Are you sure you want to delete invoice INV-001?"
        confirmText="Yes, Delete"
        cancelText="No, Keep It"
      />
    );

    expect(screen.getByText('Delete Invoice')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete invoice INV-001?')).toBeInTheDocument();
    expect(screen.getByText('No, Keep It')).toBeInTheDocument();
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
  });

  it('should call onConfirm and onOpenChange when confirm button is clicked', () => {
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();

    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        description="Are you sure?"
      />
    );

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should call onOpenChange when cancel button is clicked', () => {
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();

    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        description="Are you sure?"
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not render when open is false', () => {
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();

    const { container } = render(
      <DeleteConfirmationDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        description="Are you sure?"
      />
    );

    expect(container.querySelector('[role="alertdialog"]')).not.toBeInTheDocument();
  });
});
