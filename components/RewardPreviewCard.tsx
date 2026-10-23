import { RewardCardArtwork } from './RewardCardArtwork';
import type { PublicBusiness, Reward } from '@/lib/types';

interface RewardPreviewCardProps {
  businessName: string;
  logoUrl: string | null;
  initials?: string;
  color: string;
  discount: number;
  holderName: string;
  className?: string;
}

/** Preview of the real reward card (same artwork) before the card is created. */
export function RewardPreviewCard({ businessName, logoUrl, color, discount, holderName, className = '' }: RewardPreviewCardProps) {
  const business = {
    id: 'preview',
    name: businessName,
    slug: 'preview',
    logo_url: logoUrl,
    cover_image_url: null,
    primary_color: color,
    google_review_url: '',
    share_url: '',
    share_message: '',
    discount_percentage: discount,
    phone: null,
    is_active: true,
    created_at: '',
    updated_at: '',
  } satisfies PublicBusiness;

  const reward: Reward = {
    id: 'preview',
    business_id: 'preview',
    serial_number: 0,
    customer_name: holderName,
    customer_phone: '',
    discount_percentage: discount,
    status: 'ACTIVE',
    created_at: '',
    redeemed_at: null,
  };

  return (
    <div className={`relative w-full ${className}`}>
      <RewardCardArtwork
        business={business}
        reward={reward}
        preview
        id="reward-card-preview-svg"
        className="w-full h-auto drop-shadow-[0_28px_36px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
}
