import { z } from 'zod'

import { moods } from '../constants.ts'

export const createMoodCheckInSchema = z.object({
  mood: z.enum(
    [moods.veryHappy, moods.happy, moods.neutral, moods.sad, moods.verySad],
    'Mood is required',
  ),
})
