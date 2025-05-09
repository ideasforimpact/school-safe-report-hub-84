
import React from 'react';
import { render } from '@testing-library/react';
import VehicleHeader from '../../components/transport-safety/VehicleHeader';
import { BrowserRouter } from 'react-router-dom';

test('renders VehicleHeader component', () => {
  const { container } = render(
    <BrowserRouter>
      <VehicleHeader />
    </BrowserRouter>
  );
  expect(container).toBeInTheDocument();
});
