export type RequestActor =
  | {
      type: 'USER';
      userId: string;
    }
  | {
      type: 'GUEST';
      guestSessionId: string;
    };
