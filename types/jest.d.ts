import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveBeenCalledTimes(times: number): R;
      toBeDisabled(): R;
      toHaveBeenCalled(): R;
      toMatchSnapshot(): R;
    }
  }
}
