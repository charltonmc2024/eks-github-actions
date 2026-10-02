import type { JSX } from "react";
import { IconType } from "react-icons";

export type Feature = {
  id: number;
  icon: JSX.Element | IconType;
  title: string;
  paragraph: string;
};
