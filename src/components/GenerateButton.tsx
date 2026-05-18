import React, { useRef, useEffect, ReactNode } from 'react';
import gsap from 'gsap';

interface GenerateButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;  // 좌측 아이콘 (기본 별 SVG)
}

const GenerateButton: React.FC<GenerateButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  icon,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const starsTimelineRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || disabled) return;

    const width = button.offsetWidth;
    const height = button.offsetHeight;
    const style = getComputedStyle(button);
    const svgNS = "http://www.w3.org/2000/svg";

    //[Stroke 외곽선 SVG 생성]
    const strokeGroup = document.createElement("div");
    strokeGroup.classList.add("generate-button__stroke");

    const createStrokeSvg = () => {
      const svg = document.createElementNS(svgNS, "svg");
      svg.classList.add("generate-button__stroke-line");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", "100%");
      rect.setAttribute("height", "100%");
      rect.setAttribute("rx", String(parseInt(style.borderRadius, 10)));
      rect.setAttribute("ry", String(parseInt(style.borderRadius, 10)));
      rect.setAttribute("pathLength", "10");
      svg.appendChild(rect);
      return svg;
    };

    strokeGroup.appendChild(createStrokeSvg());
    strokeGroup.appendChild(createStrokeSvg()); // 두 번째 (블러 처리용)
    button.appendChild(strokeGroup);

    //[별 펄스 애니메이션]
    const stars = gsap.to(button, {
      repeat: -1,
      repeatDelay: 0.75,
      paused: true,
      keyframes: [
        {
          "--gb-star-2-scale": ".5",
          "--gb-star-2-opacity": ".25",
          "--gb-star-3-scale": "1.25",
          "--gb-star-3-opacity": "1",
          duration: 0.3,
        },
        {
          "--gb-star-1-scale": "1.5",
          "--gb-star-1-opacity": ".5",
          "--gb-star-2-scale": ".5",
          "--gb-star-3-scale": "1",
          "--gb-star-3-opacity": ".5",
          duration: 0.3,
        },
        {
          "--gb-star-1-scale": "1",
          "--gb-star-1-opacity": ".25",
          "--gb-star-2-scale": "1.15",
          "--gb-star-2-opacity": "1",
          duration: 0.3,
        },
        {
          "--gb-star-2-scale": "1",
          duration: 0.35,
        },
      ],
    });
    starsTimelineRef.current = stars;

    //[호버 이벤트 핸들러]
    const handlePointerEnter = () => {
      setTimeout(() => stars.restart().play(), 200);
    };

    const handlePointerLeave = () => {
      gsap.to(button, {
        "--gb-star-1-opacity": ".25",
        "--gb-star-1-scale": "1",
        "--gb-star-2-opacity": "1",
        "--gb-star-2-scale": "1",
        "--gb-star-3-opacity": ".5",
        "--gb-star-3-scale": "1",
        duration: 0.15,
        onComplete: () => {
          stars.pause();
        },
      });
    };

    button.addEventListener("pointerenter", handlePointerEnter);
    button.addEventListener("pointerleave", handlePointerLeave);

    //[Cleanup]
    return () => {
      button.removeEventListener("pointerenter", handlePointerEnter);
      button.removeEventListener("pointerleave", handlePointerLeave);
      stars.kill();
      if (strokeGroup.parentNode) strokeGroup.remove();
    };
  }, [disabled]);

  return (
    <button 
      ref={buttonRef}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`generate-button ${disabled ? 'generate-button--disabled' : ''} ${className}`}
    >
      {icon || <DefaultStarIcon />}
      <span>{children}</span>
    </button>
  );
};

//[기본 별 아이콘 SVG]
const DefaultStarIcon: React.FC = () => (
  <svg 
    className="generate-button__icon" 
    viewBox="0 0 24 26" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 3.79L7.21 0.79L8.42 3.79L11.42 5L8.42 6.21L7.21 9.21L6 6.21L3 5L6 3.79Z" />
    <path d="M14.5 7L17 13L23 15.5L17 18L14.5 24L12 18L6 15.5L12 13L14.5 7Z" />
    <path d="M6 19.79L7.21 16.79L8.42 19.79L11.42 21L8.42 22.21L7.21 25.21L6 22.21L3 21L6 19.79Z" />
  </svg>
);

export default GenerateButton;