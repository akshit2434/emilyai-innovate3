"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CinematicMessageProps {
  content: string;
  isAssistant?: boolean;
  isLoaded?: boolean;
}

// Tracks how many words have already been animated globally per message
const useWordTracker = (totalWords: number) => {
  const animatedCountRef = useRef(0);
  const previousTotal = useRef(0);
  
  // Calculate how many words are new since last render
  const startAnimatingFrom = animatedCountRef.current;
  
  // Update the count after this render
  useEffect(() => {
    if (totalWords > previousTotal.current) {
      animatedCountRef.current = previousTotal.current;
      previousTotal.current = totalWords;
    }
  });
  
  return startAnimatingFrom;
};

interface WordProps {
  children: string;
  index: number;
  shouldAnimate: boolean;
  animationDelay: number;
}

const Word = ({ children, index, shouldAnimate, animationDelay }: WordProps) => {
  if (!shouldAnimate) {
    // Already visible word - render immediately without animation
    return <span className="inline-block">{children}</span>;
  }
  
  return (
    <motion.span
      initial={{ opacity: 0, filter: "blur(8px)", y: 5 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{
        duration: 0.4,
        delay: animationDelay,
        ease: [0.2, 0, 0.2, 1],
      }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
};

interface AnimatedTextProps {
  text: string;
  startAnimatingFrom: number;
  getNextWordIndex: () => number;
}

const AnimatedText = ({ text, startAnimatingFrom, getNextWordIndex }: AnimatedTextProps) => {
  const words = useMemo(() => text.split(/(\s+)/), [text]);

  return (
    <>
      {words.map((part, i) => {
        if (part.trim() === "") {
          return <span key={i}>{part}</span>;
        }
        const currentIdx = getNextWordIndex();
        const shouldAnimate = currentIdx >= startAnimatingFrom;
        // The delay is relative to when this batch of new words starts
        const animationDelay = shouldAnimate ? (currentIdx - startAnimatingFrom) * 0.03 : 0;
        return (
          <Word 
            key={`${currentIdx}-${part}`} 
            index={currentIdx}
            shouldAnimate={shouldAnimate}
            animationDelay={animationDelay}
          >
            {part}
          </Word>
        );
      })}
    </>
  );
};

interface AnimatedChildrenProps {
  children: React.ReactNode;
  startAnimatingFrom: number;
  getNextWordIndex: () => number;
}

const AnimatedChildren = ({ children, startAnimatingFrom, getNextWordIndex }: AnimatedChildrenProps) => {
  return (
    <>
      {React.Children.map(children, (child) =>
        typeof child === "string" ? (
          <AnimatedText 
            text={child} 
            startAnimatingFrom={startAnimatingFrom}
            getNextWordIndex={getNextWordIndex}
          />
        ) : child
      )}
    </>
  );
};

export const CinematicMessage = React.memo(({ content, isAssistant = true, isLoaded = false }: CinematicMessageProps) => {
  // Count total words in content for the tracker
  const totalWords = useMemo(() => {
    return content.split(/\s+/).filter(word => word.trim() !== "").length;
  }, [content]);
  
  // Track which words have already been animated
  const startAnimatingFrom = useWordTracker(totalWords);
  
  // Create a word index counter that persists across the render
  const wordIndexRef = useRef(0);
  wordIndexRef.current = 0; // Reset for each render
  
  const getNextWordIndex = () => wordIndexRef.current++;
  
  if (!isAssistant) {
    return (
      <motion.div 
        className="inline-block max-w-md"
        initial={isLoaded ? { opacity: 0, filter: "blur(8px)" } : false}
        animate={isLoaded ? { opacity: 1, filter: "blur(0px)" } : undefined}
        transition={{ duration: 0.4, ease: [0.2, 0, 0.2, 1] }}
      >
        <p className="text-base font-medium text-[#1a1a1a]/70 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-black/[0.04] shadow-sm whitespace-pre-wrap">
          {content}
        </p>
      </motion.div>
    );
  }

  // For loaded assistant messages, render without word-by-word animation
  if (isLoaded) {
    return (
      <motion.div 
        className="flex-1 prose prose-sm prose-neutral max-w-none"
        initial={{ opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0.2, 1] }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p className="text-xl md:text-2xl font-[var(--font-cormorant)] font-medium leading-relaxed text-[#1a1a1a]/80 mb-4 last:mb-0">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-[#1a1a1a]">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic">
                {children}
              </em>
            ),
            ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
            li: ({ children }) => (
              <li className="text-lg md:text-xl font-[var(--font-cormorant)] text-[#1a1a1a]/70">
                {children}
              </li>
            ),
            code: ({ children }) => (
              <code className="bg-[#1a1a1a]/5 px-1.5 py-0.5 rounded font-[var(--font-jetbrains)] text-sm">
                {children}
              </code>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 prose prose-sm prose-neutral max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="text-xl md:text-2xl font-[var(--font-cormorant)] font-medium leading-relaxed text-[#1a1a1a]/80 mb-4 last:mb-0 flex flex-wrap gap-x-[0.1em]">
              <AnimatedChildren startAnimatingFrom={startAnimatingFrom} getNextWordIndex={getNextWordIndex}>{children}</AnimatedChildren>
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#1a1a1a]">
              <AnimatedChildren startAnimatingFrom={startAnimatingFrom} getNextWordIndex={getNextWordIndex}>{children}</AnimatedChildren>
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic">
              <AnimatedChildren startAnimatingFrom={startAnimatingFrom} getNextWordIndex={getNextWordIndex}>{children}</AnimatedChildren>
            </em>
          ),
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
          li: ({ children }) => (
            <li className="text-lg md:text-xl font-[var(--font-cormorant)] text-[#1a1a1a]/70">
              <AnimatedChildren startAnimatingFrom={startAnimatingFrom} getNextWordIndex={getNextWordIndex}>{children}</AnimatedChildren>
            </li>
          ),
          code: ({ children }) => (
            <code className="bg-[#1a1a1a]/5 px-1.5 py-0.5 rounded font-[var(--font-jetbrains)] text-sm">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

CinematicMessage.displayName = "CinematicMessage";
