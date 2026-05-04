"use client";
import { cn } from "../../lib/utils";

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export const Meteors = ({
  number = 12,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const meteors = Array.from({ length: number }, (_, idx) => {
    const leftSeed = pseudoRandom(idx + 1);
    const delaySeed = pseudoRandom((idx + 1) * 7);
    const durationSeed = pseudoRandom((idx + 1) * 13);

    return {
      left: `${Math.floor(leftSeed * 800 - 400)}px`,
      animationDelay: `${(delaySeed * 0.6 + 0.2).toFixed(2)}s`,
      animationDuration: `${Math.floor(durationSeed * 8 + 2)}s`,
    };
  });

  return (
    <>
      {meteors.map((meteor, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute h-0.5 w-0.5 rounded-full bg-slate-400 shadow-[0_0_0_1px_#ffffff10] rotate-215",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-12.5 before:h-px before:bg-linear-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={{
            top: 0,
            left: meteor.left,
            animationDelay: meteor.animationDelay,
            animationDuration: meteor.animationDuration,
          }}
        />
      ))}
    </>
  );
};
