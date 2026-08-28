import { motion } from 'motion/react'

import BannerSlider from '@/components/home/BannerSlider'
import BirthdaysWidget from '@/components/home/BirthdaysWidget'
import LatestBlogPosts from '@/components/home/LatestBlogPosts'
import Masthead from '@/components/home/Masthead'
import { homeItemVariants, homeStackVariants } from '@/components/home/motion'
import MonthlyAnnouncements from '@/components/home/MonthlyAnnouncements'
import MonthlyEvents from '@/components/home/MonthlyEvents'
import QuickLinksWidget from '@/components/home/QuickLinksWidget'
import RecentlyJoinedWidget from '@/components/home/RecentlyJoinedWidget'
import MoodCheckInModal from '@/components/mood/MoodCheckInModal'

export default function HomePage() {
  return (
    <div className="home-shell">
      <span className="home-grid-overlay" aria-hidden="true" />

      <motion.div className="home-stack" variants={homeStackVariants} initial="hidden" animate="visible">
        <motion.div variants={homeItemVariants}>
          <Masthead />
        </motion.div>

        <motion.div variants={homeItemVariants}>
          <BannerSlider />
        </motion.div>

        <motion.div variants={homeItemVariants}>
          <QuickLinksWidget />
        </motion.div>

        <motion.div variants={homeItemVariants} className="home-bento-2col">
          <MonthlyAnnouncements />
          <MonthlyEvents />
        </motion.div>

        <motion.div variants={homeItemVariants} className="home-bento-2col">
          <BirthdaysWidget />
          <RecentlyJoinedWidget />
        </motion.div>

        <motion.div variants={homeItemVariants}>
          <LatestBlogPosts />
        </motion.div>
      </motion.div>

      <MoodCheckInModal />
    </div>
  )
}
