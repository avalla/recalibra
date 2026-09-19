import { expect, mock, test } from 'bun:test';

// Inspect the actual component's host props and press handlers. Native layout
// and VoiceOver/TalkBack still need device validation; this is not an RN renderer.
mock.module('../apps/mobile/node_modules/react-native', () => ({
  Pressable: 'Pressable', View: 'View', Text: 'Text',
  StyleSheet: { create: (styles: unknown) => styles },
}));
const { StressRating } = await import('../apps/mobile/src/components/StressRating');

interface Element {
  type: string;
  props: {
    children?: Element | Element[];
    onPress: () => void;
    disabled: boolean;
    accessibilityLabel: string;
    accessibilityRole: string;
    accessibilityState: { checked: boolean; disabled: boolean };
  };
}

function options(value: number | null, onChange: (value: number) => void, disabled = false): Element[] {
  const tree = StressRating({ value, onChange, disabled }) as unknown as Element;
  return (tree.props.children as Element[]).flat().filter((element) => element.type === 'Pressable');
}

test('initial control has no declared response and every choice exposes a text label', () => {
  const choices = options(null, () => {});
  expect(choices).toHaveLength(5);
  for (const choice of choices) {
    expect(choice.props.accessibilityRole).toBe('radio');
    expect(choice.props.accessibilityState.checked).toBeFalse();
    expect(choice.props.accessibilityLabel).toMatch(/stress, \d+ out of 10\./);
  }
});

test('pressing either endpoint or an intermediate choice updates the same value and checked state', () => {
  let selected: number | null = null;
  const onChange = (value: number) => { selected = value; };
  for (const [index, value] of [[0, 1], [2, 5], [4, 10]] as const) {
    options(selected, onChange)[index]!.props.onPress();
    expect(selected).toBe(value);
    const choices = options(selected, onChange);
    expect(choices[index]!.props.accessibilityState.checked).toBeTrue();
    expect(choices.filter((choice) => choice.props.accessibilityState.checked)).toHaveLength(1);
  }
});

test('saving disables all choices and exposes the disabled state to assistive technology', () => {
  for (const choice of options(5, () => {}, true)) {
    expect(choice.props.disabled).toBeTrue();
    expect(choice.props.accessibilityState.disabled).toBeTrue();
  }
});
