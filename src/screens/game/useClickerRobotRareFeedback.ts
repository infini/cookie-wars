import { useEffect, useRef } from 'react';
import { useFeedback } from '../../services/FeedbackContext';
import type { ClickerRobotRareEventEnvelope } from '../../types/game';
import type { CookieGainItem } from './CookieGainFeedback';
import type { CookieSpecialFeedbackItem } from './CookieSpecialFeedback';

interface ClickerRobotRareFeedbackOptions {
  event?: ClickerRobotRareEventEnvelope;
  showGain: (item: Omit<CookieGainItem, 'id'>) => void;
  showSpecial: (item: Omit<CookieSpecialFeedbackItem, 'id'>) => void;
}

export function useClickerRobotRareFeedback({
  event,
  showGain,
  showSpecial,
}: ClickerRobotRareFeedbackOptions): void {
  const feedback = useFeedback();
  const lastHandledEventId = useRef(event?.id ?? -1);

  useEffect(() => {
    if (!event || event.id <= lastHandledEventId.current) return;
    lastHandledEventId.current = event.id;
    let shouldCelebrate = false;

    if (event.critical) {
      const feedbackTier = feedback.playCookieClick(event.critical.kind);
      showGain({ ...event.critical, feedbackTier });
      showSpecial({
        kind: event.critical.kind,
        amount: event.critical.amount,
        feedbackTier,
      });
      shouldCelebrate = feedbackTier === 'criticalFull'
        || feedbackTier === 'superCriticalFull';
    }
    if (event.fragment) {
      feedback.playCookieFragment(event.fragment.kind);
      showSpecial({
        kind: event.fragment.kind,
        amount: event.fragment.amount,
        multiplier: event.fragment.multiplier,
      });
      shouldCelebrate = true;
    }
    if (shouldCelebrate) feedback.success();
  }, [event, feedback, showGain, showSpecial]);
}
