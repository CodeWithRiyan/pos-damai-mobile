import type { IconProps } from "@solar-icons/react-native";
import * as BoldIcons from "@solar-icons/react-native/Bold";
import * as BoldDuotoneIcons from "@solar-icons/react-native/BoldDuotone";
import * as LinearIcons from "@solar-icons/react-native/Linear";
import React from "react";

export interface SolarIconBoldProps extends IconProps {
  name: keyof typeof BoldIcons;
}

export interface SolarIconBoldDuotoneProps extends IconProps {
  name: keyof typeof BoldDuotoneIcons;
}

export interface SolarIconLinearProps extends IconProps {
  name: keyof typeof LinearIcons;
}

export const SolarIconBold = ({ name, ...props }: SolarIconBoldProps) => {
  const IconComponent = BoldIcons[name];
  return <IconComponent {...props} />;
};

export const SolarIconBoldDuotone = ({
  name,
  ...props
}: SolarIconBoldDuotoneProps) => {
  const IconComponent = BoldDuotoneIcons[name];
  return <IconComponent {...props} />;
};

export const SolarIconLinear = ({ name, ...props }: SolarIconLinearProps) => {
  const IconComponent = LinearIcons[name];
  return <IconComponent {...props} />;
};
