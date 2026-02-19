import React from 'react'
import Navbar from '../components/landingcompo/Navbar'
import Hero from '../components/landingcompo/Hero'
import Features from '../components/landingcompo/Features'
import HowItWorks from '../components/landingcompo/HowItWorks'
import About from '../components/landingcompo/About'
import CTA from '../components/landingcompo/CTA'
import Footer from '../components/landingcompo/Footer'

function Landing() {
  return (
    <div className="bg-slate-950">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <About />
      <CTA />
      <Footer />
    </div>
  )
}

export default Landing
