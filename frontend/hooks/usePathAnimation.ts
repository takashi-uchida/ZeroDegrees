import { useEffect, useState, useRef } from 'react';
import { SearchState } from '@/types/search';

interface PathAnimationState {
  animatingNodeIds: Set<string>;
  animatingEdgeIds: Set<string>;
  currentStep: number;
}

export function usePathAnimation(
  pathNodeIds: string[],
  pathEdgeIds: string[],
  searchState: SearchState
) {
  const [animationState, setAnimationState] = useState<PathAnimationState>({
    animatingNodeIds: new Set(),
    animatingEdgeIds: new Set(),
    currentStep: 0,
  });
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchState === 'searching') {
      // Pulsing animation for exploring state
      setAnimationState({
        animatingNodeIds: new Set(pathNodeIds),
        animatingEdgeIds: new Set(pathEdgeIds),
        currentStep: -1, // -1 indicates searching state
      });
    } else if (searchState === 'found' && pathNodeIds.length > 0) {
      // Animate path tracing
      let step = 0;
      const animate = () => {
        if (step < pathNodeIds.length) {
          setAnimationState({
            animatingNodeIds: new Set(pathNodeIds.slice(0, step + 1)),
            animatingEdgeIds: new Set(pathEdgeIds.slice(0, step)),
            currentStep: step,
          });
          step++;
          animationRef.current = setTimeout(animate, 200);
        }
      };
      animate();
    } else {
      // Idle state
      setAnimationState({
        animatingNodeIds: new Set(),
        animatingEdgeIds: new Set(),
        currentStep: 0,
      });
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [searchState, pathNodeIds.join(','), pathEdgeIds.join(',')]);

  return animationState;
}
