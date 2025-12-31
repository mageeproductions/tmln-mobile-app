export interface WaitlistEntry {
  id: string;
  email: string;
  signed_up_at: string;
  referral_source?: string | null;
}
