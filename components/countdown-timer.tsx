"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface CountdownTimerProps {
  targetDate: Date
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="flex flex-col items-center md:flex-row md:items-center">
      <div className="flex items-center mb-3 md:mb-0 md:mr-4">
        <Clock className="h-5 w-5 mr-2" />
        <span className="font-semibold text-base sm:text-lg whitespace-nowrap">챌린지 마감까지</span>
      </div>
      <div className="grid grid-flow-col gap-1 sm:gap-2 text-center auto-cols-max">
        <div className="flex flex-col p-1 sm:p-2 bg-white bg-opacity-20 rounded-lg">
          <span className="font-mono text-xl sm:text-2xl md:text-3xl">{timeLeft.days.toString().padStart(2, "0")}</span>
          <span className="text-xs">일</span>
        </div>
        <div className="flex flex-col p-1 sm:p-2 bg-white bg-opacity-20 rounded-lg">
          <span className="font-mono text-xl sm:text-2xl md:text-3xl">{timeLeft.hours.toString().padStart(2, "0")}</span>
          <span className="text-xs">시간</span>
        </div>
        <div className="flex flex-col p-1 sm:p-2 bg-white bg-opacity-20 rounded-lg">
          <span className="font-mono text-xl sm:text-2xl md:text-3xl">{timeLeft.minutes.toString().padStart(2, "0")}</span>
          <span className="text-xs">분</span>
        </div>
        <div className="flex flex-col p-1 sm:p-2 bg-white bg-opacity-20 rounded-lg">
          <span className="font-mono text-xl sm:text-2xl md:text-3xl">{timeLeft.seconds.toString().padStart(2, "0")}</span>
          <span className="text-xs">초</span>
        </div>
      </div>
    </div>
  )
}
