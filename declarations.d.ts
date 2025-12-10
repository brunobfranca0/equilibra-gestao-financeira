import { ComponentType } from 'react';
import { TextProps } from 'react-native';

declare module '@expo/vector-icons' {
  interface IconProps extends TextProps {
    name?: string;
    size?: number;
    color?: string;
  }

  export const Ionicons: ComponentType<IconProps>;
  export const MaterialCommunityIcons: ComponentType<IconProps>;
}