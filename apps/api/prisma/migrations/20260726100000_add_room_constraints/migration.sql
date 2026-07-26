ALTER TABLE "Room"
ADD CONSTRAINT "Room_maxPlayers_check"
CHECK ("maxPlayers" BETWEEN 2 AND 12);

ALTER TABLE "RoomParticipant"
ADD CONSTRAINT "RoomParticipant_identity_check"
CHECK (num_nonnulls("userId", "guestSessionId") = 1);

ALTER TABLE "RoomParticipant"
ADD CONSTRAINT "RoomParticipant_score_check"
CHECK ("score" >= 0);
