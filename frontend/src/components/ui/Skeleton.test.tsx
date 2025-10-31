/**
 * Skeleton Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { 
  Skeleton, 
  AppointmentCardSkeleton, 
  AppointmentListSkeleton,
  ProfileCardSkeleton,
  TableSkeleton,
  CardSkeleton,
} from './Skeleton';

describe('Skeleton', () => {
  it('renders with default classes', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
    expect(skeleton).toHaveClass('bg-gray-200');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('h-10');
    expect(skeleton).toHaveClass('w-full');
  });

  it('supports additional HTML attributes', () => {
    const { container } = render(<Skeleton data-testid="custom-skeleton" />);
    expect(container.firstChild).toHaveAttribute('data-testid', 'custom-skeleton');
  });
});

describe('AppointmentCardSkeleton', () => {
  it('renders card structure', () => {
    const { container } = render(<AppointmentCardSkeleton />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('rounded-lg');
    
    // Should have multiple skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(3);
  });
});

describe('AppointmentListSkeleton', () => {
  it('renders default number of cards', () => {
    const { container } = render(<AppointmentListSkeleton />);
    const cards = container.querySelectorAll('.border.rounded-lg');
    expect(cards.length).toBe(3);
  });

  it('renders custom number of cards', () => {
    const { container } = render(<AppointmentListSkeleton count={5} />);
    const cards = container.querySelectorAll('.border.rounded-lg');
    expect(cards.length).toBe(5);
  });
});

describe('ProfileCardSkeleton', () => {
  it('renders profile structure with avatar', () => {
    const { container } = render(<ProfileCardSkeleton />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border');
    
    // Should have rounded-full for avatar
    const avatar = container.querySelector('.rounded-full');
    expect(avatar).toBeInTheDocument();
  });
});

describe('TableSkeleton', () => {
  it('renders table with default rows and columns', () => {
    const { container } = render(<TableSkeleton />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
    
    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells.length).toBe(4);
  });

  it('renders table with custom rows and columns', () => {
    const { container } = render(<TableSkeleton rows={3} columns={6} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    
    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells.length).toBe(6);
  });
});

describe('CardSkeleton', () => {
  it('renders card structure', () => {
    const { container } = render(<CardSkeleton />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('rounded-lg');
    
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(2);
  });
});
