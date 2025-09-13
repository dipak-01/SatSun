import { useEffect, useRef, useState } from "react";

const TIPS = [
  {
    id: 1,
    text: "Create a weekend and add days with activities.",
  },
  {
    id: 2,
    text: "Use templates to pre-fill plans quickly.",
  },
  { id: 3, text: "Export your weekend as a shareable image." },
];

export default function OnboardingTips() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const timerRef = useRef();

  useEffect(() => {
    if (localStorage.getItem("satsun:onboardingDone") === "1") return;
    setVisible(true);
    const schedule = (i) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const next = i + 1;
        if (next < TIPS.length) {
          setIndex(next);
          schedule(next);
        } else {
          setVisible(false);
          localStorage.setItem("satsun:onboardingDone", "1");
        }
      }, 3000);
    };
    schedule(0);
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!visible) return null;

  const tip = TIPS[index];

  return (
    <div className="toast toast-start z-30">
      <div className="alert alert-success">
        <div>
          <div className="font-bold">
            Tip {index + 1} of {TIPS.length}
          </div>
          <div className="text-sm">{tip.text}</div>
        </div>
        <div className="ml-2 flex gap-2">
          <button
            className="btn btn-xs"
            onClick={() => {
              const next = Math.min(index + 1, TIPS.length - 1);
              setIndex(next);
              clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => {
                const n2 = next + 1;
                if (n2 < TIPS.length) {
                  setIndex(n2);
                } else {
                  setVisible(false);
                  localStorage.setItem("satsun:onboardingDone", "1");
                }
              }, 3000);
            }}
          >
            Next
          </button>
          <button
            className="btn btn-xs btn-ghost"
            onClick={() => {
              setVisible(false);
              localStorage.setItem("satsun:onboardingDone", "1");
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
