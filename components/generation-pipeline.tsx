"use client"
import { useState, useEffect } from "react"
import { User, Lightbulb, Wrench, Bug, Check } from "lucide-react"

const pipelineSteps = [
  { icon: User, label: "Information Collected", progress: 20 },
  { icon: Lightbulb, label: "Planning structure", progress: 40 },
  { icon: Wrench, label: "Making Python Cog", progress: 60 },
  { icon: Bug, label: "Finding bugs / optimizing", progress: 80 },
  { icon: Check, label: "Finishing code", progress: 100 },
]

export default function GenerationPipeline() {
  const [currentStep, setCurrentStep] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    const stepIntervals = pipelineSteps.map((_, index) => {
      // Stagger the steps
      return setTimeout(() => {
        setCurrentStep(index)
      }, index * 2000) // Move to next step every 2 seconds
    })

    return () => {
      clearInterval(timer)
      stepIntervals.forEach(clearTimeout)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")
    const secs = (seconds % 60).toString().padStart(2, "0")
    return `${minutes}:${secs}`
  }

  const activeStep = pipelineSteps[currentStep]
  const progress = activeStep.progress

  return (
    <div className="max-w-[90%] w-full bg-[#101010]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-white">Generating Plugin...</h3>
          <span className="text-xs text-gray-400 font-mono">{formatTime(elapsedTime)}</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-gray-500 to-white h-2 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-around text-xs text-gray-400">
          {pipelineSteps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col items-center transition-all duration-300 ${
                currentStep >= index ? "text-white" : ""
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === index ? "bg-white/10 animate-pulse" : "bg-transparent"
                } ${currentStep > index ? "bg-white/10" : ""}`}
              >
                <step.icon className="h-4 w-4" />
              </div>
              <span className="mt-1 text-center text-[10px]">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
