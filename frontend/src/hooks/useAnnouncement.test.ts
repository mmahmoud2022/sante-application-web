/**
 * Announcement Hook Tests
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAnnouncement } from './useAnnouncement';

describe('useAnnouncement', () => {
  beforeEach(() => {
    // Clear any existing announcements
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('creates announcement element with correct attributes', () => {
    const { result } = renderHook(() => useAnnouncement());
    
    result.current.announce('Test message');
    
    const announcement = document.querySelector('[role="status"]');
    expect(announcement).toBeInTheDocument();
    expect(announcement).toHaveAttribute('aria-live', 'polite');
    expect(announcement).toHaveAttribute('aria-atomic', 'true');
    expect(announcement).toHaveClass('sr-only');
    expect(announcement).toHaveTextContent('Test message');
  });

  it('uses polite priority by default', () => {
    const { result } = renderHook(() => useAnnouncement());
    
    result.current.announce('Test message');
    
    const announcement = document.querySelector('[role="status"]');
    expect(announcement).toHaveAttribute('aria-live', 'polite');
  });

  it('uses assertive priority when specified', () => {
    const { result } = renderHook(() => useAnnouncement());
    
    result.current.announce('Urgent message', 'assertive');
    
    const announcement = document.querySelector('[role="status"]');
    expect(announcement).toHaveAttribute('aria-live', 'assertive');
  });

  it('removes announcement after timeout', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAnnouncement());
    
    result.current.announce('Test message');
    
    let announcement = document.querySelector('[role="status"]');
    expect(announcement).toBeInTheDocument();
    
    vi.advanceTimersByTime(1000);
    
    announcement = document.querySelector('[role="status"]');
    expect(announcement).not.toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it('can create multiple announcements', () => {
    const { result } = renderHook(() => useAnnouncement());
    
    result.current.announce('First message');
    result.current.announce('Second message');
    
    const announcements = document.querySelectorAll('[role="status"]');
    expect(announcements.length).toBe(2);
    expect(announcements[0]).toHaveTextContent('First message');
    expect(announcements[1]).toHaveTextContent('Second message');
  });

  it('creates new function reference on each render', () => {
    const { result, rerender } = renderHook(() => useAnnouncement());
    const firstAnnounce = result.current.announce;
    
    rerender();
    
    const secondAnnounce = result.current.announce;
    expect(firstAnnounce).toBe(secondAnnounce);
  });
});
