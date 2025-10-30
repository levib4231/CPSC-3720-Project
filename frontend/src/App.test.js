import { render, screen } from '@testing-library/react';
import App from './App';

// Mock fetch for the App component's event loading
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

test('renders TigerTix app', () => {
  render(<App />);
  const heading = screen.getByText(/Clemson Campus Events/i);
  expect(heading).toBeInTheDocument();
});
