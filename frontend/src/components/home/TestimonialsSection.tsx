"use client";

import { useEffect, useRef, useState } from "react";
import { HiStar, HiOutlineQuestionMarkCircle } from "react-icons/hi2";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Rajesh Kumar",
    role: "Procurement Head",
    company: "TechVision India Pvt Ltd",
    initials: "RK",
    color: "from-blue-500 to-blue-600",
    rating: 5,
    text: "IndiaMart completely transformed our procurement process. We found reliable suppliers for electronic components at prices 30% lower than before. The verification system gives us total confidence.",
    location: "Bangalore, Karnataka",
    savings: "Saved ₹12L/year",
  },
  {
    id: 2,
    name: "Priya Sharma",
    role: "Owner",
    company: "Sharma Textiles",
    initials: "PS",
    color: "from-pink-500 to-rose-600",
    rating: 5,
    text: "As a seller, IndiaMart helped me reach buyers all over India. My business grew 5x in just one year! The platform's lead generation is phenomenal and the support team is always ready to help.",
    location: "Surat, Gujarat",
    savings: "5x Business Growth",
  },
  {
    id: 3,
    name: "Amit Patel",
    role: "CEO",
    company: "Green Energy Solutions",
    initials: "AP",
    color: "from-emerald-500 to-emerald-600",
    rating: 5,
    text: "We source all our solar panel components through IndiaMart. The bulk inquiry feature saves us hours of negotiation time. Verified suppliers mean consistent quality every single time.",
    location: "Ahmedabad, Gujarat",
    savings: "40% Cost Reduction",
  },
  {
    id: 4,
    name: "Sneha Reddy",
    role: "Purchase Manager",
    company: "Reddy Pharmaceuticals",
    initials: "SR",
    color: "from-purple-500 to-purple-600",
    rating: 5,
    text: "Finding pharmaceutical-grade raw materials was always challenging until we found IndiaMart. Connected us with WHO-GMP certified suppliers. Absolutely life-changing for our procurement!",
    location: "Hyderabad, Telangana",
    savings: "Zero Quality Issues",
  },
  {
    id: 5,
    name: "Vikram Singh",
    role: "Managing Director",
    company: "Singh Steel Industries",
    initials: "VS",
    color: "from-orange-500 to-orange-600",
    rating: 5,
    text: "IndiaMart helped us expand our market beyond Delhi NCR. We now receive 50+ inquiries from all over India daily. The subscription plans are worth every penny for serious businesses.",
    location: "Delhi",
    savings: "50+ Leads Daily",
  },
  {
    id: 6,
    name: "Neha Gupta",
    role: "Business Development",
    company: "PackRight Solutions",
    initials: "NG",
    color: "from-teal-500 to-teal-600",
    rating: 5,
    text: "The packaging materials we sourced through IndiaMart are top quality at competitive prices. The inquiry system lets us compare multiple quotes easily. Best platform for bulk B2B buyers!",
    location: "Mumbai, Maharashtra",
    savings: "3x More Suppliers",
  },
];

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div className="w-[320px] sm:w-[360px] shrink-0 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Quote mark */}
      <div className="text-5xl font-black text-gray-100 leading-none mb-3">&ldquo;</div>

      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {[1,2,3,4,5].map((s) => (
          <HiStar key={s} className={`w-4 h-4 ${s <= t.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
        ))}
      </div>

      {/* Text */}
      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">
        {t.text}
      </p>

      {/* Savings Badge */}
      <div className={`inline-block bg-gradient-to-r ${t.color} text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-4`}>
        ✨ {t.savings}
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
          {t.initials}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm">{t.name}</h4>
          <p className="text-xs text-gray-500">{t.role}, {t.company}</p>
          <p className="text-xs text-gray-400">{t.location}</p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    let lastTime = 0;

    const step = (time: number) => {
      if (!isPaused) {
        if (lastTime) {
          el.scrollLeft += 0.5;
          if (el.scrollLeft >= el.scrollWidth / 2) {
            el.scrollLeft = 0;
          }
        }
        lastTime = time;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  const doubled = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <div className="h-1 w-8 bg-[#0052cc] rounded-full" />
            <span className="text-[#0052cc] text-xs font-bold uppercase tracking-widest">Testimonials</span>
            <div className="h-1 w-8 bg-[#0052cc] rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            What Our Users Say
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Real stories from real businesses that grew with IndiaMart
          </p>

          {/* Overall rating */}
          <div className="inline-flex items-center gap-3 mt-6 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-3">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((s) => <HiStar key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
            </div>
            <span className="text-2xl font-black text-gray-900">4.8</span>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-700">Overall Rating</p>
              <p className="text-[10px] text-gray-500">Based on 2M+ reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-scrolling Testimonials */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden cursor-grab select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="flex gap-4 pl-4">
          {doubled.map((t, i) => (
            <TestimonialCard key={`${t.id}-${i}`} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
