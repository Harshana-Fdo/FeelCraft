import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, test } from 'vitest';
import Gallery from './Gallery';

afterEach(cleanup);

test('applies linked filters and resets all filter controls', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/templates?feeling=love&tier=free']}><Gallery /></MemoryRouter>);
  expect(screen.getByRole('status').textContent).toBe('1 template');
  expect(screen.getByRole('link', { name: 'Preview Eternal Love' }).getAttribute('href')).toBe('/templates/eternal-love');

  await user.selectOptions(screen.getByLabelText('Collection'), 'premium');
  expect(screen.getByRole('heading', { name: 'No matching templates' })).toBeTruthy();

  await user.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByRole('status').textContent).toBe('5 templates');
  expect(screen.getByLabelText('Feeling').value).toBe('');
});
