import React from "react";
import BSFLLogo from "@/public/logos/BSFL_logo";
import ETBLogo from "@/public/logos/ETB_logo";
import TGPLogo from "@/public/logos/TGP_logo";
import YOULogo from "@/public/logos/YOU_logo";
import HyfiLogo from "@/public/logos/HyfiLogo";

export type BrandCode = "BSFL" | "ETB" | "TGP" | "YOU" | "HYFI";

export type SessionType = "classic" | "speed" | "team" | "survival";

export type SessionData = {
  id: SessionType;
  name: string;
  description: string;
  icon: string;
};

type BrandData = {
  name: string;
  description: string;
  background: string;
  logo: React.ReactNode;
  sessions: SessionData[];
};

export const brands: Record<BrandCode, BrandData> = {
  HYFI: {
    name: "Hyfi",
    description: "Digital Curriculum for the Next Generation",
    background: 'center / cover url("/hyfi-background.jpg") no-repeat',
    logo: <HyfiLogo />,
    sessions: [
      {
        id: "classic",
        name: "Session 01 - The Promised Messiah",
        description: "Jesus, the promised Messiah, was sent to save humanity.",
        icon: "🎯",
      },
      {
        id: "speed",
        name: "Session 02 - The Messiah is Born",
        description: "Jesus is the true King who came humbly into the world.",
        icon: "⚡",
      },
      {
        id: "team",
        name: "Session 03 - A Long Wait",
        description: "We are called to praise Jesus, the Savior.",
        icon: "👥",
      },
      {
        id: "survival",
        name: "Session 04 - Eat This Scroll",
        description: "God empowers us to share His Word with others.",
        icon: "🏆",
      },
    ],
  },
  BSFL: {
    name: "Bible Studies for Life",
    description: "Intentional, biblical discipleship rooted in everyday life",
    background: "linear-gradient(180deg, #f05a47 0%, #ff8979 100%)",
    logo: <BSFLLogo />,
    sessions: [
      {
        id: "classic",
        name: "Session 01 - The Promised Messiah",
        description: "Traditional quiz format with timed questions",
        icon: "🎯",
      },
      {
        id: "speed",
        name: "Session 02 - The Messiah is Born",
        description: "Fast-paced questions with shorter time limits",
        icon: "⚡",
      },
      {
        id: "team",
        name: "Session 03 - A Long Wait",
        description: "Compete in teams for the highest score",
        icon: "👥",
      },
      {
        id: "survival",
        name: "Session 04 - Eat This Scroll",
        description: "One wrong answer and you're out!",
        icon: "🏆",
      },
    ],
  },
  ETB: {
    name: "Explore the Bible",
    description: "An expository, book-by-book study of Scripture",
    background: "linear-gradient(180deg, #CECECE 0%, #EAEAEA 100%)",
    logo: <ETBLogo />,
    sessions: [
      {
        id: "classic",
        name: "Session 01 - The Promised Messiah",
        description: "Traditional quiz format with timed questions",
        icon: "🎯",
      },
      {
        id: "speed",
        name: "Session 02 - The Messiah is Born",
        description: "Fast-paced questions with shorter time limits",
        icon: "⚡",
      },
      {
        id: "team",
        name: "Session 03 - A Long Wait",
        description: "Compete in teams for the highest score",
        icon: "👥",
      },
      {
        id: "survival",
        name: "Session 04 - Eat This Scroll",
        description: "One wrong answer and you're out!",
        icon: "🏆",
      },
    ],
  },
  TGP: {
    name: "The Gospel Project",
    description: "A Christ-centered, chronological study of Scripture",
    background: "linear-gradient(180deg, #1F2638 0%, #6375A5 100%)",
    logo: <TGPLogo />,
    sessions: [
      {
        id: "classic",
        name: "Session 01 - The Promised Messiah",
        description: "Traditional quiz format with timed questions",
        icon: "🎯",
      },
      {
        id: "speed",
        name: "Session 02 - The Messiah is Born",
        description: "Fast-paced questions with shorter time limits",
        icon: "⚡",
      },
      {
        id: "team",
        name: "Session 03 - A Long Wait",
        description: "Compete in teams for the highest score",
        icon: "👥",
      },
      {
        id: "survival",
        name: "Session 04 - Eat This Scroll",
        description: "One wrong answer and you're out!",
        icon: "🏆",
      },
    ],
  },
  YOU: {
    name: "You",
    description: "A Bible Study for Urban and Multicultural Believers",
    background: "linear-gradient(69.95deg, #EBF3F9 4.99%, #B0DDFC 69.32%)",
    logo: <YOULogo />,
    sessions: [
      {
        id: "classic",
        name: "Session 01 - The Promised Messiah",
        description: "Traditional quiz format with timed questions",
        icon: "🎯",
      },
      {
        id: "speed",
        name: "Session 02 - The Messiah is Born",
        description: "Fast-paced questions with shorter time limits",
        icon: "⚡",
      },
      {
        id: "team",
        name: "Session 03 - A Long Wait",
        description: "Compete in teams for the highest score",
        icon: "👥",
      },
      {
        id: "survival",
        name: "Session 04 - Eat This Scroll",
        description: "One wrong answer and you're out!",
        icon: "🏆",
      },
    ],
  },
};
