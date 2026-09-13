import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";

import type { QuizQuestionData } from "@/lib/quizFinale";

type OptionState = "idle" | "correct" | "wrong";

const LETTERS = ["A", "B", "C"] as const;

/**
 * Singola domanda del test finale: tre opzioni cliccabili dal docente.
 * Al click l'opzione si colora (verde = corretta, rosso = sbagliata) e alla
 * prima risposta compare la spiegazione. Nessun punteggio, stato solo locale.
 */
export const QuizQuestion = ({
  data,
  number,
}: {
  data: QuizQuestionData;
  number: number;
}) => {
  const [states, setStates] = useState<OptionState[]>(["idle", "idle", "idle"]);
  const answered = states.some((s) => s !== "idle");

  const handleClick = (idx: number) => {
    setStates((prev) => {
      const next = [...prev];
      next[idx] = idx === data.correctIndex ? "correct" : "wrong";
      return next;
    });
  };

  return (
    <div className="rounded-md border border-border/50 bg-card/60 px-3 py-1.5">
      <p className="text-xs md:text-sm font-semibold text-foreground leading-snug">
        <span className="text-primary font-mono mr-2">{number}.</span>
        {data.question}
      </p>

      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {data.options.map((opt, idx) => {
          const state = states[idx];
          const style =
            state === "correct"
              ? {
                  backgroundColor: "hsl(142 70% 45% / 0.22)",
                  borderColor: "hsl(142 70% 45%)",
                }
              : state === "wrong"
                ? {
                    backgroundColor: "hsl(350 75% 55% / 0.22)",
                    borderColor: "hsl(350 75% 55%)",
                  }
                : undefined;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleClick(idx)}
              className="flex items-center gap-1.5 rounded border border-border/60 bg-background/60 px-2 py-1.5 text-left transition-colors hover:border-primary/70"
              style={style}
            >
              <span
                className="shrink-0 w-5 h-5 rounded-full border border-border/70 flex items-center justify-center font-mono text-[11px] font-bold"
                style={
                  state === "correct"
                    ? {
                        backgroundColor: "hsl(142 70% 45%)",
                        borderColor: "hsl(142 70% 45%)",
                        color: "hsl(220 20% 5%)",
                      }
                    : state === "wrong"
                      ? {
                          backgroundColor: "hsl(350 75% 55%)",
                          borderColor: "hsl(350 75% 55%)",
                          color: "hsl(220 20% 5%)",
                        }
                      : undefined
                }
              >
                {state === "correct" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : state === "wrong" ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  LETTERS[idx]
                )}
              </span>
              <span className="text-[11px] md:text-xs text-foreground/90 leading-tight">
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Spazio riservato alla spiegazione: evita salti di layout al click. */}
      <div className="min-h-[2.6rem] mt-0.5">
        <AnimatePresence>
          {answered && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] md:text-xs text-muted-foreground leading-snug line-clamp-2"
            >
              <span className="text-primary font-semibold">
                Risposta corretta: {LETTERS[data.correctIndex]}.
              </span>{" "}
              {data.explanation}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
