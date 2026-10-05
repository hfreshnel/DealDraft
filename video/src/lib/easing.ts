import { Easing } from "remotion";

export type EasingFunction = (input: number) => number;

export const EASE_OUT_EXPO: EasingFunction = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT_EXPO: EasingFunction = Easing.bezier(0.87, 0, 0.13, 1);
export const EASE_OUT_QUART: EasingFunction = Easing.bezier(0.25, 1, 0.5, 1);
export const EASE_IN_OUT_QUART: EasingFunction = Easing.bezier(0.76, 0, 0.24, 1);
export const EASE_IN_QUART: EasingFunction = Easing.bezier(0.5, 0, 0.75, 0);
export const EASE_OUT_CUBIC: EasingFunction = Easing.bezier(0.33, 1, 0.68, 1);
export const EASE_IN_CUBIC: EasingFunction = Easing.bezier(0.32, 0, 0.67, 0);
export const EASE_IN_OUT_CUBIC: EasingFunction = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_OUT_BACK: EasingFunction = Easing.bezier(0.34, 1.56, 0.64, 1);
export const LINEAR: EasingFunction = (input) => input;
