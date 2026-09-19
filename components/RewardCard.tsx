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
    <div ref={cardRef} className="relative mx-auto w-full max-w-[480px] overflow-hidden rounded-3xl shadow-xl">
      <RewardCardArtwork business={business} reward={reward} id="cardify-reward-svg" />
    </div>
  );
};
