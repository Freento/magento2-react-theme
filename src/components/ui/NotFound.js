import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="nf-section w-full max-w-[560px] mx-auto pt-[120px] px-6 pb-[160px] text-center max600:pt-20 max600:px-4 max600:pb-[120px]" aria-labelledby="nf-heading">
      <span className="nf-eyebrow inline-block text-sm font-medium tracking-[0.12em] uppercase text-ink-2 mb-[18px]">Error · 404</span>
      <h1 id="nf-heading" className="nf-title text-[40px] max600:text-[30px] font-semibold text-ink tracking-[-0.02em] leading-tight mt-0 mb-4">This page took a wrong turn.</h1>
      <p className="nf-text text-ink-2 text-[16px] leading-[1.6] mt-0 mx-auto mb-8 max-w-[44ch]">
        The address looks fine but nothing's here. The page may have moved,
        the link may be stale, or it never existed in the first place.
      </p>
      <div className="nf-actions inline-flex gap-2.5 flex-wrap justify-center">
        <Link to="/" className="nf-btn nf-btn--primary inline-flex items-center justify-center text-base font-medium tracking-[0.02em] py-3.5 px-[22px] rounded no-underline transition-colors duration-med ease-[ease] bg-ink text-bg border border-ink hover:bg-black hover:text-bg">Back to home</Link>
      </div>
    </section>
  );
}
