-- Lead status: let owners/workers mark a conversation "contacted"
ALTER TABLE "Conversation" ADD COLUMN     "contactedAt" TIMESTAMP(3);
