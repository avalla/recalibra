export interface JourneyChapter {
  id: string;
  title: string;
  description: string;
  exerciseSlug: string;
  durationMinutes: number;
}

export interface JourneyDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  chapters: JourneyChapter[];
}

export interface JourneyProgress {
  journeyId: string;
  currentChapter: number;
  completedChapterIds: string[];
  lastStartedAt?: string;
  completedAt?: string;
  updatedAt: string;
}
