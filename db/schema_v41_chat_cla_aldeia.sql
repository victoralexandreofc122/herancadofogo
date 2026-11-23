-- =====================================================================================================================
-- v41: o chat do clã e o da aldeia (v102 do jogo; decisões do Victor de 23/11/2026). Rode no SQL Editor do Neon, no
-- branch `production`, DEPOIS da v40. Pode rodar de novo sem erro. Nada é apagado.
--
--  clã ...... a linhagem (Rubro, Umbra, Andarilho, Bastião, Áspide, Garra, Zéfiro): vai para todos da mesma linhagem online;
--  aldeia ... vai para todos da mesma aldeia online; só o Kage da aldeia manda.
--
-- O histórico (24 h) passa a aceitar os dois canais. `escopo` guarda para quem foi: o código da linhagem (ex.: 'rubro')
-- ou o da aldeia (ex.: 'vila_1'). Sem esta migração o jogo segue igual: as mensagens do clã e da aldeia chegam na hora,
-- mas não ficam no histórico.
-- =====================================================================================================================
BEGIN;

ALTER TABLE game.chat_logs ADD COLUMN IF NOT EXISTS escopo text;
COMMENT ON COLUMN game.chat_logs.escopo IS 'v41: a linhagem (canal cla) ou a aldeia (canal aldeia) que recebeu a mensagem.';

ALTER TABLE game.chat_logs DROP CONSTRAINT IF EXISTS chat_logs_channel_check;
ALTER TABLE game.chat_logs ADD CONSTRAINT chat_logs_channel_check
  CHECK (channel IN ('local', 'global', 'whisper', 'cla', 'aldeia'));

ALTER TABLE game.chat_logs DROP CONSTRAINT IF EXISTS ck_chat_logs_escopo;
ALTER TABLE game.chat_logs ADD CONSTRAINT ck_chat_logs_escopo
  CHECK ((channel IN ('cla', 'aldeia')) = (escopo IS NOT NULL));

CREATE INDEX IF NOT EXISTS ix_chat_logs_escopo ON game.chat_logs (channel, escopo, id DESC) WHERE channel IN ('cla', 'aldeia');

COMMENT ON TABLE game.chat_logs IS 'Histórico do chat (local, global, sussurro, clã e aldeia). Retenção de 24 h: game.purge_chat_logs().';

COMMIT;

-- Conferência (opcional):
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'game.chat_logs'::regclass ORDER BY 1;
