-- ========================================
-- RLSポリシーを家族2人のみに限定
-- ========================================

-- 既存の「authenticated_all」ポリシーを削除
DROP POLICY IF EXISTS "authenticated_all" ON dogs;
DROP POLICY IF EXISTS "authenticated_all" ON categories;
DROP POLICY IF EXISTS "authenticated_all" ON events;
DROP POLICY IF EXISTS "authenticated_all" ON event_dogs;
DROP POLICY IF EXISTS "authenticated_all" ON event_attachments;
DROP POLICY IF EXISTS "authenticated_all" ON diary_entries;
DROP POLICY IF EXISTS "authenticated_all" ON diary_attachments;

DROP POLICY IF EXISTS "authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;

-- 家族2人のUUID
-- 4274da6c-cb40-4478-be2a-8b4e8eb6c971 (本人)
-- 9b306796-0091-4973-89b6-c30fc7e87df8 (妻)

CREATE OR REPLACE FUNCTION is_family_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IN (
    '4274da6c-cb40-4478-be2a-8b4e8eb6c971',
    '9b306796-0091-4973-89b6-c30fc7e87df8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 各テーブルに家族限定ポリシーを設定
CREATE POLICY "family_only" ON dogs           FOR ALL USING (is_family_member()) WITH CHECK (is_family_member());
CREATE POLICY "family_only" ON categories     FOR ALL USING (is_family_member()) WITH CHECK (is_family_member());
CREATE POLICY "family_only" ON events         FOR ALL USING (is_family_member()) WITH CHECK (is_family_member());
CREATE POLICY "family_only" ON event_dogs     FOR ALL USING (is_family_member()) WITH CHECK (is_family_member());
CREATE POLICY "family_only" ON event_attachments FOR ALL USING (is_family_member()) WITH CHECK (is_family_member());
CREATE POLICY "family_only" ON diary_entries  FOR ALL USING (is_family_member()) WITH CHECK (is_family_member());
CREATE POLICY "family_only" ON diary_attachments FOR ALL USING (is_family_member()) WITH CHECK (is_family_member());

-- Storageも家族限定に
CREATE POLICY "family_only_select" ON storage.objects FOR SELECT USING (is_family_member());
CREATE POLICY "family_only_insert" ON storage.objects FOR INSERT WITH CHECK (is_family_member());
CREATE POLICY "family_only_update" ON storage.objects FOR UPDATE USING (is_family_member());
CREATE POLICY "family_only_delete" ON storage.objects FOR DELETE USING (is_family_member());
