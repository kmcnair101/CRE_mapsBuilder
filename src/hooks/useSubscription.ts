import { useAuthStore } from '../stores/auth';

export function useSubscription() {
  const { profile } = useAuthStore();
  
  const hasAccess = () => {
    return profile?.subscription_status === 'active';
  };
  
  const isFreeTier = () => {
    return profile?.subscription_status === 'free';
  };
  
  const isExpired = () => {
    return profile?.subscription_status === 'expired';
  };
  
  const isCancelled = () => {
    return profile?.subscription_status === 'cancelled';
  };
  
  const isNonRenewing = () => {
    return profile?.subscription_status === 'non_renewing';
  };
  
  return { 
    hasAccess, 
    isFreeTier, 
    isExpired, 
    isCancelled, 
    isNonRenewing 
  };
} 