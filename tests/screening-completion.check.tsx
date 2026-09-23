import { expect, mock, test } from 'bun:test';
import React from '../apps/mobile/node_modules/react';
import { act, create, type ReactTestRenderer } from '../apps/mobile/node_modules/react-test-renderer';

const authError = new Error('Auth session missing!');
let setScreeningCalls = 0;

mock.module('../apps/mobile/src/contexts', () => ({
  useAuth: () => ({
    updateUserMetadata: async () => ({ error: authError }),
  }),
}));

mock.module('../apps/mobile/src/db', () => ({
  getScreening: async () => null,
  setScreening: async () => {
    setScreeningCalls += 1;
  },
}));

const { useScreening } = await import('../apps/mobile/src/hooks/useScreening');

test('screening completion surfaces auth errors instead of reporting onboarding as complete', async () => {
  let saveProfile: ReturnType<typeof useScreening>['saveScreeningProfile'] | undefined;
  let renderer: ReactTestRenderer | undefined;

  function Probe() {
    const screening = useScreening();
    saveProfile = screening.saveScreeningProfile;
    return React.createElement('probe', { loading: screening.isLoading });
  }

  await act(async () => {
    renderer = create(React.createElement(Probe));
  });

  let result: Awaited<ReturnType<NonNullable<typeof saveProfile>>>;
  await act(async () => {
    result = await saveProfile!({ initial_stress_level: 5 });
  });

  expect(setScreeningCalls).toBe(1);
  expect(result!.error).toBe(authError);
  expect(renderer!.root.findByType('probe').props.loading).toBe(false);

  await act(async () => {
    renderer!.unmount();
  });
});
