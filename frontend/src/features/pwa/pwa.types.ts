export type InstallPromptChoice = Readonly<{
  outcome: 'accepted' | 'dismissed';
  platform: string;
}>;

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptChoice>;
}
