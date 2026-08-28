import { useEffect, useState } from 'react'
import { useIsFetching, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { moods } from 'core/constants'
import type { Mood } from 'core/constants'
import { moodMessages } from 'core/messages'
import type { MoodCheckInStatusResponse } from 'core/types/mood-check-ins'

import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/get-error-message'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useMoodStore } from '@/stores/mood-store'

const MOOD_OPTIONS: { mood: Mood; emoji: string; label: string }[] = [
  { mood: moods.veryHappy, emoji: '🥳', label: 'Very Happy' },
  { mood: moods.happy, emoji: '😊', label: 'Happy' },
  { mood: moods.neutral, emoji: '😐', label: 'Neutral' },
  { mood: moods.sad, emoji: '😕', label: 'Sad' },
  { mood: moods.verySad, emoji: '😢', label: 'Very Sad' },
]

export default function MoodCheckInModal() {
  const open = useMoodStore((state) => state.open)
  const setOpen = useMoodStore((state) => state.setOpen)
  const queryClient = useQueryClient()
  const [picked, setPicked] = useState<Mood | null>(null)

  const status = useQuery({
    queryKey: ['mood-check-in', 'status'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<MoodCheckInStatusResponse>('/mood-check-ins/status', { signal })
      return data
    },
  })
  const isPageLoading = useIsFetching() > 0

  useEffect(() => {
    if (status.isSuccess && !status.data.checkedIn && !isPageLoading) {
      setOpen(true)
    }
  }, [status.isSuccess, status.data?.checkedIn, isPageLoading])

  const checkIn = useMutation({
    mutationFn: async (mood: Mood) => {
      await api.post('/mood-check-ins', { mood })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mood-check-in', 'status'] })
      setTimeout(() => {
        setOpen(false)
        setPicked(null)
      }, 1400)
    },
    onError: () => setPicked(null),
  })

  const pickedOption = MOOD_OPTIONS.find((option) => option.mood === picked)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="mood-dialog">
        <span className="home-grid-overlay" aria-hidden="true" />

        <div className="mood-dialog-bar">
          <span className="home-dispatch-channel">
            <span className="home-onair-dot" aria-hidden="true" />
            Daily Pulse
          </span>
          <span className="home-dispatch-date">Anonymous</span>
        </div>

        {!checkIn.isSuccess ? (
          <div className="mood-dialog-body">
            <p className="mood-dialog-title">How are you feeling today?</p>
            <p className="mood-dialog-subhead">One tap — no name attached, ever</p>

            <div className="mood-option-row">
              {MOOD_OPTIONS.map((option) => (
                <Button
                  key={option.mood}
                  type="button"
                  variant="ghost"
                  aria-label={option.label}
                  disabled={checkIn.isPending}
                  onClick={() => {
                    setPicked(option.mood)
                    checkIn.mutate(option.mood)
                  }}
                  data-mood={option.mood}
                  data-picked={picked === option.mood}
                  data-dimmed={picked !== null && picked !== option.mood}
                  className="mood-option"
                >
                  <span aria-hidden="true">{option.emoji}</span>
                </Button>
              ))}
            </div>

            {checkIn.isError ? (
              <p className="home-error-text mt-6">
                {getErrorMessage(checkIn.error, 'Could not submit your check-in.')}
              </p>
            ) : (
              <div className="mood-dialog-note">
                <span className="mood-dialog-note-rule" aria-hidden="true" />
                <span className="mood-dialog-note-text">Not linked to you</span>
                <span className="mood-dialog-note-rule" aria-hidden="true" />
              </div>
            )}
          </div>
        ) : (
          <div className="mood-dialog-body animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="mood-confirm-badge" data-mood={picked} aria-hidden="true">
              {pickedOption?.emoji}
            </div>
            <p className="mood-confirm-title">{moodMessages.CHECKED_IN}</p>
            <p className="mood-confirm-subhead">Recorded anonymously</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
