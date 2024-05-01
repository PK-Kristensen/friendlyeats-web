"use client";
import { useState, useEffect } from "react";
import AISuggestionBox from "../src/components/AiEvent/AISuggestionBox";
import { Canvas } from "react-three-fiber";
import { Stars } from "@react-three/drei";

const Typewriter = ({
  phrases,
  typingDelay = 50,
  deletingDelay = 30,
  delayBetweenPhrases = 1000,
}) => {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [delay, setDelay] = useState(typingDelay);

  useEffect(() => {
    const handleTyping = () => {
      const currentPhrase = phrases[index];
      const nextPhrase = phrases[(index + 1) % phrases.length];
      const commonPrefixLength = getCommonPrefixLength(
        currentPhrase,
        nextPhrase
      );

      if (isDeleting) {
        if (text.length > commonPrefixLength) {
          setText(currentPhrase.substring(0, text.length - 1));
          setDelay(deletingDelay);
        } else {
          setIsDeleting(false);
          setIndex((index + 1) % phrases.length);
          setDelay(delayBetweenPhrases);
        }
      } else {
        if (text.length < currentPhrase.length) {
          setText(currentPhrase.substring(0, text.length + 1));
          setDelay(typingDelay);
        } else {
          setIsDeleting(true);
          setDelay(delayBetweenPhrases);
        }
      }
    };

    const timer = setTimeout(handleTyping, delay);
    return () => clearTimeout(timer);
  }, [text, isDeleting, index, delay]);

  const getCommonPrefixLength = (str1, str2) => {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return i;
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      <h1 className="text-4xl font-bold">{text ? text : ""}</h1>
    </div>
  );
};

const AnimatedBackground = () => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <Stars
        radius={100} // Radius of the inner sphere (default=100)
        depth={50} // Depth of area where stars are placed (default=50)
        count={5000} // Amount of stars (default=5000)
        factor={4} // Size factor (default=4)
        saturation={0} // Saturation 0 means grayscale (default=0)
        fade // Fading dots toward the center
      />
    </Canvas>
  );
};

export default function Home() {
  const phrases = [
    "Finn ditt neste sted for ditt arrangement",
    "Finn underholdning til arrangementet ditt",
    "Finn mat til arrangemetet ditt",
  ];

  return (
    <main className="m-9 rounded-lg">
      <AnimatedBackground />
      <div className="relative">
        <Typewriter phrases={phrases} />
        <AISuggestionBox />
      </div>
    </main>
  );
}
