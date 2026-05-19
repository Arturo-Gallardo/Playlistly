import { Michroma, Nunito, Saira } from "next/font/google";

export const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export const saira = Saira({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-saira",
});

export const michroma = Michroma({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-michroma",
  weight: "400",
});
