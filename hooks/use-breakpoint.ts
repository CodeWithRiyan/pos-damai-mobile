import { Dimensions } from "react-native";

interface BreakpointProps {
  sm?: boolean;
  md?: boolean;
  lg?: boolean;
  xl?: boolean;
  "2xl"?: boolean;
  "3xl"?: boolean;
}

export default function useBreakpoint(): BreakpointProps {
  const { width } = Dimensions.get("window");

  if (width >= 1536) {
    return { "3xl": true };
  }

  if (width >= 1280) {
    return { xl: true };
  }

  if (width >= 1024) {
    return { lg: true };
  }

  if (width >= 768) {
    return { md: true };
  }

  if (width >= 640) {
    return { sm: true };
  }

  return {};
}
