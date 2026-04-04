import { supabase } from "@/lib/supabaseClient";

export async function createSplit({
  title,
  totalAmount,
  members,
}: {
  title: string;
  totalAmount: number;
  members: {
    profileId: string;
    sharePercentage: number;
    shareAmount: number;
  }[];
}) {
  // 1. Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // 2. Create split
  const { data: split, error: splitError } = await supabase
    .from("splits")
    .insert({
      title,
      total_amount: totalAmount,
      creator_id: user.id,
    })
    .select()
    .single();

  if (splitError) throw splitError;

  // 3. Create split members
  const splitMembers = members.map((m) => ({
    split_id: split.id,
    profile_id: m.profileId,
    share_percentage: m.sharePercentage,
    share_amount: m.shareAmount,
  }));

  const { error: membersError } = await supabase
    .from("split_members")
    .insert(splitMembers);

  if (membersError) throw membersError;

  return split;
}
