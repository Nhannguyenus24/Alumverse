import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const EASE_OUT = [0.22, 1, 0.36, 1];

const getOffset = (direction, distance) => {
  switch (direction) {
    case 'left':
      return { x: distance, y: 0 };
    case 'right':
      return { x: -distance, y: 0 };
    case 'down':
      return { x: 0, y: -distance };
    case 'none':
      return { x: 0, y: 0 };
    case 'up':
    default:
      return { x: 0, y: distance };
  }
};

const itemVariants = {
  hidden: ({ direction = 'up', distance = 26 } = {}) => ({
    opacity: 0,
    ...getOffset(direction, distance),
  }),
  visible: ({ delay = 0, duration = 0.62 } = {}) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration,
      delay,
      ease: EASE_OUT,
    },
  }),
};

const reducedMotionSx = {
  '@media (prefers-reduced-motion: reduce)': {
    transform: 'none !important',
    transition: 'none !important',
  },
};

const useRevealObserver = ({ amount, margin }) => {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(Boolean(reduceMotion));

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (reduceMotion) {
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') {
      const fallbackFrameId = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(fallbackFrameId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.unobserve(entry.target);
      },
      { threshold: amount, rootMargin: margin },
    );

    observer.observe(node);

    const revealIfAlreadyInView = () => {
      const rect = node.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight * 0.92) {
        setIsVisible(true);
        observer.unobserve(node);
      }
    };
    const frameId = window.requestAnimationFrame(revealIfAlreadyInView);
    const timeoutId = window.setTimeout(revealIfAlreadyInView, 320);
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(revealIfAlreadyInView);
    resizeObserver?.observe(node);

    return () => {
      observer.disconnect();
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [amount, margin, reduceMotion]);

  return { ref, isVisible: isVisible || Boolean(reduceMotion) };
};

export const ScrollReveal = ({
  children,
  direction = 'up',
  distance = 26,
  delay = 0,
  duration = 0.62,
  amount = 0.16,
  margin = '0px 0px -8% 0px',
  sx,
  ...props
}) => {
  const { ref, isVisible } = useRevealObserver({ amount, margin });

  return (
    <Box
      ref={ref}
      component={motion.div}
      data-scroll-reveal="item"
      data-reveal-visible={isVisible ? 'true' : 'false'}
      initial={false}
      animate={isVisible ? 'visible' : 'hidden'}
      variants={itemVariants}
      custom={{ direction, distance, delay, duration }}
      sx={{ ...reducedMotionSx, ...sx }}
      {...props}
    >
      {children}
    </Box>
  );
};

export const ScrollRevealItem = ({
  children,
  direction = 'up',
  distance = 24,
  delay = 0,
  revealDelay,
  duration = 0.58,
  amount = 0.16,
  margin = '0px 0px -8% 0px',
  sx,
  ...props
}) => {
  const { ref, isVisible } = useRevealObserver({ amount, margin });

  return (
    <Box
      ref={ref}
      component={motion.div}
      data-scroll-reveal="group-item"
      data-reveal-visible={isVisible ? 'true' : 'false'}
      initial={false}
      animate={isVisible ? 'visible' : 'hidden'}
      variants={itemVariants}
      custom={{ direction, distance, delay: revealDelay ?? delay, duration }}
      sx={{ ...reducedMotionSx, ...sx }}
      {...props}
    >
      {children}
    </Box>
  );
};

export const ScrollRevealGroup = ({
  children,
  stagger = 0.08,
  delayChildren = 0,
  amount = 0.12,
  margin = '0px 0px -8% 0px',
  sx,
  ...props
}) => {
  const staggeredChildren = Children.toArray(children).map((child, index) => {
    if (!isValidElement(child) || child.type !== ScrollRevealItem) return child;
    return cloneElement(child, {
      revealDelay: child.props.delay ?? delayChildren + (index % 6) * stagger,
      amount: child.props.amount ?? amount,
      margin: child.props.margin ?? margin,
    });
  });

  return (
    <Box data-scroll-reveal="group" sx={sx} {...props}>
      {staggeredChildren}
    </Box>
  );
};

export const ScrollRevealFields = ({
  children,
  stagger = 0.075,
  gap = { xs: 1.5, sm: 2 },
  sx,
  ...props
}) => (
  <ScrollRevealGroup
    stagger={stagger}
    sx={{ display: 'flex', flexDirection: 'column', gap, ...sx }}
    {...props}
  >
    {Children.toArray(children).map((child, index) => (
      <ScrollRevealItem key={child?.key ?? index}>{child}</ScrollRevealItem>
    ))}
  </ScrollRevealGroup>
);

// eslint-disable-next-line react-refresh/only-export-components
export const getStaggerDelay = (index, step = 0.08, max = 5) => (
  Math.min(index % (max + 1), max) * step
);
