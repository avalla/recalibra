import { Text, TextInput } from 'react-native';

import { FontFamily } from '../constants';

export function applyDefaultTextProps() {
  const TextWithDefaultProps = Text as unknown as { defaultProps?: { style?: unknown } };
  TextWithDefaultProps.defaultProps = {
    ...(TextWithDefaultProps.defaultProps || {}),
    style: [{ fontFamily: FontFamily.regular }, TextWithDefaultProps.defaultProps?.style],
  };

  const TextInputWithDefaultProps = TextInput as unknown as { defaultProps?: { style?: unknown } };
  TextInputWithDefaultProps.defaultProps = {
    ...(TextInputWithDefaultProps.defaultProps || {}),
    style: [{ fontFamily: FontFamily.regular }, TextInputWithDefaultProps.defaultProps?.style],
  };
}
