import type {
  BattleEvent,
  BattleEventDetails,
  BattleEventJournal,
  BattleEventKind,
} from './battleTypes';

// Visual history is bounded; pending delivery is kept separately until acknowledged.
export const MAX_RETAINED_BATTLE_EVENTS = 32;

export function appendBattleEvent(
  journal: BattleEventJournal,
  kind: BattleEventKind,
  now: number,
  details: BattleEventDetails = {},
): BattleEventJournal {
  const event: BattleEvent = {
    id: journal.eventSequence + 1,
    kind,
    at: details.at ?? now,
    ...details,
  };
  return {
    eventSequence: event.id,
    events: [...journal.events, event].slice(-MAX_RETAINED_BATTLE_EVENTS),
    pendingEvents: [...journal.pendingEvents, event],
  };
}

export function getLatestBattleEvent(events: BattleEvent[]): BattleEvent | null {
  return events[events.length - 1] ?? null;
}

export function getLatestBattlePresentationEvent(
  events: BattleEvent[],
): BattleEvent | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.kind !== 'victory' && event.kind !== 'defeat') return event;
  }
  return null;
}

export function getUndeliveredBattleEvents(
  events: BattleEvent[],
  lastDeliveredEventId: number,
): BattleEvent[] {
  return events.filter((event) => event.id > lastDeliveredEventId);
}

export function deliverPendingBattleEvents(
  pendingEvents: BattleEvent[],
  lastDeliveredEventId: number,
  onEvent: (event: BattleEvent) => void,
): number {
  let deliveredThroughId = lastDeliveredEventId;
  getUndeliveredBattleEvents(pendingEvents, lastDeliveredEventId).forEach((event) => {
    onEvent(event);
    deliveredThroughId = event.id;
  });
  return deliveredThroughId;
}

export function acknowledgeBattleEvents<T extends BattleEventJournal>(
  journal: T,
  deliveredThroughId: number,
): T {
  const pendingEvents = journal.pendingEvents.filter(
    (event) => event.id > deliveredThroughId,
  );
  if (pendingEvents.length === journal.pendingEvents.length) return journal;
  return { ...journal, pendingEvents };
}
