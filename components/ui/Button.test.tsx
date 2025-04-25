import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('<Button />', () => {
  const handleClick = jest.fn();

  beforeEach(() => {
    handleClick.mockClear();
  });

  it('renderiza con props por defecto', () => {
    render(<Button onClick={handleClick}>Texto</Button>);
    const btn = screen.getByRole('button', { name: /texto/i }) as HTMLButtonElement;
    expect(btn).toBeInTheDocument();
  });

  it('aplica className extra', () => {
    render(
      <Button onClick={handleClick} className="mi-clase">
        Hola
      </Button>
    );
    const btn = screen.getByRole('button', { name: /hola/i });
    expect(btn).toHaveClass('mi-clase');
  });

  it('llama a onClick al hacer click', async () => {
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('no llama a onClick si está deshabilitado', async () => {
    render(
      <Button onClick={handleClick} disabled>
        Deshabilitado
      </Button>
    );
    const btn = screen.getByRole('button', { name: /deshabilitado/i });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('coincide con el snapshot', () => {
    const { asFragment } = render(
      <Button onClick={handleClick} className="otra-clase">
        Snapshot
      </Button>
    );
    expect(asFragment()).toMatchSnapshot();
  });
}); 