import { supabase } from "@/lib/supabaseClient";

export const PROFILE_IMAGE_BUCKET = "profile-pictures";

const getImageExtension = (uri: string) => {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  if (extension === "png") return "png";
  if (extension === "webp") return "webp";
  return "jpg";
};

const getImageContentType = (extension: string) => {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
};

export const isLocalProfileImage = (uri?: string | null) => {
  return !!uri && !uri.startsWith("http://") && !uri.startsWith("https://");
};

export async function uploadProfileImage(userId: string, imageUri: string) {
  const extension = getImageExtension(imageUri);
  const path = `${userId}/avatar.${extension}`;
  const response = await fetch(imageUri);
  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    throw new Error("Selected image file was empty.");
  }

  const { error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: getImageContentType(extension),
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
