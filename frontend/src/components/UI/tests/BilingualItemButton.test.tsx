import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BilingualItemButton from '../buttons/BilingualItemButton';

function createRect(width: number): DOMRect {
  return {
    bottom: 0,
    height: 0,
    left: 0,
    right: width,
    top: 0,
    width,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
}

describe('BilingualItemButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows both languages and emphasizes English', () => {
    render(
      <BilingualItemButton
        item={{ czech: 'ahoj', english: 'hello', pronunciation: 'həˈləʊ' }}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('ahoj')).toBeTruthy();
    expect(screen.getByText('hello').className).toContain('font-bold');
    expect(screen.getByRole('button').getAttribute('title')).toContain('həˈləʊ');
  });

  it('returns stacked text to a row after the container becomes wide enough', () => {
    let containerWidth = 200;
    let observedResize: () => void = () => undefined;

    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.tagName === 'DIV' ? containerWidth : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.textContent?.startsWith('long') ? 150 : 40;
      return createRect(width);
    });
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          observedResize = () => callback([], this as unknown as ResizeObserver);
        }

        observe() {}
        disconnect() {}
      },
    );

    render(
      <BilingualItemButton
        item={{ czech: 'long czech text', english: 'short', pronunciation: '' }}
        onClick={vi.fn()}
      />,
    );

    const row = screen.getByText('long czech text').parentElement;
    expect(row?.className).toContain('flex-col');

    containerWidth = 400;
    act(() => observedResize());

    expect(row?.className).toContain('flex-row');
  });

  it('chooses the layout independently for each button', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.tagName === 'DIV' ? 200 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.textContent?.startsWith('long individual') ? 150 : 40;
      return createRect(width);
    });

    render(
      <>
        <BilingualItemButton
          item={{ czech: 'long individual czech text', english: 'short', pronunciation: '' }}
          onClick={vi.fn()}
        />
        <BilingualItemButton
          item={{ czech: 'brief czech', english: 'brief english', pronunciation: '' }}
          onClick={vi.fn()}
        />
      </>,
    );

    expect(screen.getByText('long individual czech text').parentElement?.className).toContain(
      'flex-col',
    );
    expect(screen.getByText('brief czech').parentElement?.className).toContain('flex-row');
  });

  it('shows the selected leading language first', () => {
    render(
      <BilingualItemButton
        item={{ czech: 'ahoj', english: 'hello', pronunciation: '' }}
        leadingLanguage="english"
        onClick={vi.fn()}
      />,
    );

    const languageTexts = screen.getByRole('button').querySelectorAll('span');
    expect([...languageTexts].map((element) => element.textContent)).toEqual(['hello', 'ahoj']);
  });

  it('stacks overflowing text and includes full values in its tooltip', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.tagName === 'DIV' ? 200 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.textContent?.startsWith('velmi') ? 250 : 40;
    });

    render(
      <BilingualItemButton
        item={{
          czech: 'velmi dlouhý český text',
          english: 'short',
          pronunciation: 'test',
        }}
        onClick={vi.fn()}
      />,
    );

    const row = screen.getByText('velmi dlouhý český text').parentElement;
    expect(row?.className).toContain('flex-col');
    expect(screen.getByRole('button').className).toContain('min-h-[calc(var(--height-input)*2)]');
    expect(screen.getByRole('button').className).not.toMatch(/(?:^|\s)h-input(?:\s|$)/);
    expect(screen.getByRole('button').getAttribute('title')).toContain('velmi dlouhý český text');
  });
});
