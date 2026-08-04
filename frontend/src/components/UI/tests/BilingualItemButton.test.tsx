import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BilingualItemButton from '../buttons/BilingualItemButton';

describe('BilingualItemButton', () => {
  afterEach(() => vi.restoreAllMocks());

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
