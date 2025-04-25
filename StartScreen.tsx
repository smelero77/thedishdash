import * as React from "react"
import { Button } from "./components/ui/button"

export default function StartScreen() {
  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#f8fbfb] group/design-root overflow-x-hidden" style={{ fontFamily: 'Epilogue, "Noto Sans", sans-serif' }}>
      <div className="flex items-center bg-[#f8fbfb] p-4 pb-2 justify-between">
        <h2 className="text-[#0e1b19] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pl-12 pr-12">GOURMETON</h2>
      </div>
      <div className="flex w-full grow bg-[#f8fbfb] @container p-4">
        <div className="w-full gap-1 overflow-hidden bg-[#f8fbfb] @[480px]:gap-2 aspect-[3/2] rounded-xl flex">
          <div
            className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-none flex-1"
            style={{ backgroundImage: 'url("https://cdn.usegalileo.ai/sdxl10/36e7e026-ee59-417b-aa5a-9480957baf30.png")' }}
          />
        </div>
      </div>
      <h1 className="text-[#0e1b19] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-center pb-3 pt-5">Scan. Order. Enjoy.</h1>
      <div className="flex justify-center">
        <div className="flex flex-1 gap-3 max-w-[480px] flex-col items-stretch px-4 py-3">
          <Button className="w-full h-10 rounded-full bg-[#1ce3cf] text-[#0e1b19] hover:bg-[#1ce3cf]/90">
            Start Order
          </Button>
          <Button variant="outline" className="w-full h-10 rounded-full bg-[#e8f3f2] text-[#0e1b19] hover:bg-[#e8f3f2]/90">
            Learn More
          </Button>
        </div>
      </div>
      <div className="h-5 bg-[#f8fbfb]" />
    </div>
  )
} 