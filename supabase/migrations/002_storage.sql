-- ========================================
-- Supabase Storage バケット設定
-- ========================================

-- event-attachments バケット（非公開）
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-attachments', 'event-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- diary-attachments バケット（非公開）
INSERT INTO storage.buckets (id, name, public)
VALUES ('diary-attachments', 'diary-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- dog-photos バケット（非公開）
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-photos', 'dog-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLSポリシー: ログイン済みユーザーのみ操作可
CREATE POLICY "authenticated_select" ON storage.objects FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON storage.objects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON storage.objects FOR DELETE TO authenticated USING (true);
