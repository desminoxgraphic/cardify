import { randomBytes } from 'crypto';
import { supabaseServer } from './supabase/server';
import { Business, Reward, CreateBusinessInput, CreateRewardInput } from './types';
import { normalizeHexColor } from './reward-rules';

function requireSupabase() {
  if (!supabaseServer) {
    throw new Error('DATABASE_NOT_CONFIGURED');
  }
  return supabaseServer;
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}

function cleanBusinessInput(input: Partial<CreateBusinessInput>) {
  const clean: Record<string, string | number | boolean | null> = {};
  if (input.name !== undefined) clean.name = input.name.trim().slice(0, 100);
  if (input.slug !== undefined) clean.slug = normalizeSlug(input.slug);
  if (input.logo_url !== undefined) clean.logo_url = input.logo_url.trim() || null;
  if (input.cover_image_url !== undefined) clean.cover_image_url = input.cover_image_url.trim() || null;
  if (input.primary_color !== undefined) clean.primary_color = normalizeHexColor(input.primary_color);
  if (input.google_review_url !== undefined) clean.google_review_url = input.google_review_url.trim();
  if (input.share_url !== undefined) clean.share_url = input.share_url.trim();
  if (input.share_message !== undefined) clean.share_message = input.share_message.trim().slice(0, 300);
  if (input.discount_percentage !== undefined) clean.discount_percentage = Math.min(100, Math.max(1, Math.trunc(input.discount_percentage)));
  if (input.phone !== undefined) clean.phone = input.phone.trim().slice(0, 40);
  if (input.is_active !== undefined) clean.is_active = Boolean(input.is_active);
  return clean;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const { data, error } = await requireSupabase().from('businesses').select('*').eq('slug', normalizeSlug(slug)).maybeSingle();
  if (error) throw new Error('BUSINESS_READ_FAILED');
  return (data as Business) || null;
}

export async function getBusinessByMerchantToken(token: string): Promise<Business | null> {
  const { data, error } = await requireSupabase().from('businesses').select('*').eq('merchant_token', token).maybeSingle();
  if (error) throw new Error('BUSINESS_READ_FAILED');
  return (data as Business) || null;
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const { data, error } = await requireSupabase().from('businesses').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error('BUSINESS_READ_FAILED');
  return (data as Business) || null;
}

export async function getAllBusinesses(): Promise<Business[]> {
  const { data, error } = await requireSupabase().from('businesses').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('BUSINESS_READ_FAILED');
  return (data as Business[]) || [];
}

export async function createBusiness(input: CreateBusinessInput): Promise<Business> {
  const clean = cleanBusinessInput(input);
  if (!clean.name || !clean.slug) throw new Error('INVALID_BUSINESS');
  const id = input.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id)
    ? input.id
    : undefined;

  const { data, error } = await requireSupabase()
    .from('businesses')
    .insert({
      ...clean,
      ...(id ? { id } : {}),
      merchant_token: randomBytes(32).toString('base64url'),
      next_serial: 1,
    })
    .select()
    .single();
  if (error) throw new Error(error.code === '23505' ? 'SLUG_ALREADY_EXISTS' : 'BUSINESS_CREATE_FAILED');
  return data as Business;
}

export async function updateBusiness(id: string, input: Partial<CreateBusinessInput>): Promise<Business | null> {
  const clean = cleanBusinessInput(input);
  if (clean.name === '' || clean.slug === '') throw new Error('INVALID_BUSINESS');

  const { data, error } = await requireSupabase()
    .from('businesses')
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.code === '23505' ? 'SLUG_ALREADY_EXISTS' : 'BUSINESS_UPDATE_FAILED');
  return (data as Business) || null;
}

export async function deleteBusiness(id: string): Promise<boolean> {
  const { error } = await requireSupabase().from('businesses').delete().eq('id', id);
  if (error) throw new Error('BUSINESS_DELETE_FAILED');
  return true;
}

export async function createReward(input: CreateRewardInput): Promise<Reward> {
  const customerName = input.customer_name.trim().slice(0, 100);
  const customerPhone = input.customer_phone.trim().slice(0, 40);
  if (!customerName || customerPhone.replace(/\D/g, '').length < 6) throw new Error('INVALID_CUSTOMER');

  const { data, error } = await requireSupabase().rpc('generate_reward', {
    p_business_id: input.business_id,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
  });
  if (error || !data?.[0]) throw new Error('REWARD_CREATE_FAILED');
  return data[0] as Reward;
}

export async function getRewardForBusiness(rewardId: string, businessId: string): Promise<Reward | null> {
  const { data, error } = await requireSupabase()
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .eq('business_id', businessId)
    .maybeSingle();
  if (error) throw new Error('REWARD_READ_FAILED');
  return (data as Reward) || null;
}

export async function getRewardsByBusinessId(businessId: string): Promise<Reward[]> {
  const { data, error } = await requireSupabase()
    .from('rewards')
    .select('*')
    .eq('business_id', businessId)
    .order('serial_number', { ascending: false });
  if (error) throw new Error('REWARD_READ_FAILED');
  return (data as Reward[]) || [];
}

export async function redeemReward(
  merchantToken: string,
  rewardId: string
): Promise<{ success: boolean; reward?: Reward; error?: string }> {
  const business = await getBusinessByMerchantToken(merchantToken);
  if (!business) return { success: false, error: 'Invalid merchant session.' };

  const { data, error } = await requireSupabase()
    .from('rewards')
    .update({ status: 'USED', redeemed_at: new Date().toISOString() })
    .eq('id', rewardId)
    .eq('business_id', business.id)
    .eq('status', 'ACTIVE')
    .select()
    .maybeSingle();

  if (error) return { success: false, error: 'Failed to redeem card.' };
  if (!data) return { success: false, error: 'This card has already been used or does not exist.' };
  return { success: true, reward: data as Reward };
}

export async function markRewardUsedByAdmin(rewardId: string): Promise<Reward | null> {
  const { data, error } = await requireSupabase()
    .from('rewards')
    .update({ status: 'USED', redeemed_at: new Date().toISOString() })
    .eq('id', rewardId)
    .eq('status', 'ACTIVE')
    .select()
    .maybeSingle();
  if (error) throw new Error('REWARD_UPDATE_FAILED');
  return (data as Reward) || null;
}

export async function getBusinessStats(businessId: string) {
  const rewards = await getRewardsByBusinessId(businessId);
  return {
    total: rewards.length,
    active: rewards.filter((reward) => reward.status === 'ACTIVE').length,
    used: rewards.filter((reward) => reward.status === 'USED').length,
  };
}
