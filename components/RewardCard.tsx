'use client';

import React from 'react';
import { RewardCardArtwork } from './RewardCardArtwork';
import { Business, PublicBusiness, Reward } from '@/lib/types';

interface RewardCardProps {
  business: Business | PublicBusiness;
  reward: Reward;
  cardRef?: React.RefObject<HTMLDivElement>;
}

export const RewardCard: React.FC<RewardCardProps> = ({ business, reward, cardRef }) => {
  return (
    <div ref={cardRef} className="relative mx-auto w-full max-w-[480px]">
      <RewardCardArtwork
        business={business}
        reward={reward}
        id="cardify-reward-svg"
        className="w-full h-auto drop-shadow-[0_24px_32px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
};
