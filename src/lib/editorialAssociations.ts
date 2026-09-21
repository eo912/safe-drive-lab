import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const loadEditorialAssociation = async (moduleId: string, blockId: string) => {
  const { data, error } = await supabase
    .from("editorial_associations")
    .select("media, embeds")
    .eq("module_id", moduleId)
    .eq("block_id", blockId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const saveEditorialMedia = async (
  moduleId: string,
  blockId: string,
  media: unknown,
) => {
  const { error } = await supabase.from("editorial_associations").upsert(
    {
      module_id: moduleId,
      block_id: blockId,
      media: media as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "module_id,block_id" },
  );
  if (error) throw error;
};

export const saveEditorialEmbeds = async (
  moduleId: string,
  blockId: string,
  embeds: unknown,
) => {
  const { error } = await supabase.from("editorial_associations").upsert(
    {
      module_id: moduleId,
      block_id: blockId,
      embeds: embeds as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "module_id,block_id" },
  );
  if (error) throw error;
};
