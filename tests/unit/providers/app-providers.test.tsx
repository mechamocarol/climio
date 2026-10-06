import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppProviders } from '@/providers/app-providers';

describe('AppProviders', () => {
  it('renders its children', async () => {
    const { getByText } = await render(
      <AppProviders>
        <Text>Climio</Text>
      </AppProviders>,
    );

    expect(getByText('Climio')).toBeTruthy();
  });
});
