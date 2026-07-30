// Chat message length guard — mirrors the backend ChatMessageLimits (1000-char
// cap) so the composer can hard-cap input and show a counter.
export const MAX_MESSAGE_LENGTH = 1000;

export const exceedsLengthLimit = (text) => (text?.length ?? 0) > MAX_MESSAGE_LENGTH;
