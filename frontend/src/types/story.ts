export interface RecoveryFragment {
  fragmentNumber: number;
  title: string;
  status: 'UNLOCKED' | 'ENCRYPTED';
  technicalArtifact: string;
  narrativeContent: string;
}

export interface StorylineData {
  currentLevel: number;
  themeTitle: string;
  networkIntegrityPercent: number;
  activeObjective: string;
  playerPerspectiveLog: string;
  environmentalAlert: string;
  latestUnlockNarrative?: string;
  fragments: RecoveryFragment[];
}
