import React from 'react';
import { FORM_SECTION_CLS, FORM_TITLE_CLS, CO_BTN_CLS } from './checkoutUi';

const Label = ({ w }) => (
  <span className="form-label">
    <span className={`skeleton inline-block align-middle h-2.5 ${w}`} />
  </span>
);

const Field = ({ w = 'w-24' }) => (
  <div className="form-group">
    <Label w={w} />
    <span className="skeleton h-11 rounded" />
  </div>
);

const Step = ({ w }) => (
  <div className="inline-flex items-center gap-2.5">
    <span className="skeleton w-[22px] h-[22px] rounded-pill shrink-0" />
    <span className={`skeleton h-2.5 max640:hidden ${w}`} />
  </div>
);

const Connector = () => (
  <div className="grow-0 shrink-0 basis-12 max640:basis-4 h-px bg-line-strong" />
);

const CheckoutSkeleton = () => (
  <div aria-busy="true" aria-live="polite">
    <div className="progress-steps flex items-center gap-3.5 max640:gap-2 pb-5 mb-7 border-b border-line text-xs" aria-hidden="true">
      <Step w="w-[130px]" />
      <Connector />
      <Step w="w-[125px]" />
      <Connector />
      <Step w="w-[172px]" />
    </div>

    <div className="co-layout grid grid-cols-[minmax(0,1fr)_340px] gap-7 items-start max900:grid-cols-1" aria-hidden="true">
      <div className={FORM_SECTION_CLS}>
        <div className={FORM_TITLE_CLS}>
          <span className="skeleton inline-block align-middle h-5 w-40" />
        </div>
        <div className="form-grid">
          <Field w="w-28" />
          <div className="form-row-2">
            <Field w="w-20" />
            <Field w="w-20" />
          </div>
          <Field w="w-28" />
          <Field w="w-16" />
          <div className="form-row-3">
            <Field w="w-10" />
            <Field w="w-24" />
            <Field w="w-24" />
          </div>
          <Field w="w-28" />
          <span className={`skeleton ${CO_BTN_CLS} rounded`} />
        </div>
      </div>

      <div className="co-summary bg-bg border border-line rounded pt-[22px] px-[22px] pb-[18px] flex flex-col gap-4">
        <span className="skeleton h-5 w-36 my-0.5" />
        <div className="flex items-start gap-3">
          <span className="skeleton w-14 h-14 shrink-0 rounded" />
          <div className="flex-1 min-w-0 flex flex-col gap-2 pt-0.5">
            <span className="skeleton h-3.5 w-4/5" />
            <span className="skeleton h-3 w-1/3" />
          </div>
          <span className="skeleton h-3.5 w-14 mt-0.5" />
        </div>
        <div className="pt-3.5 border-t border-line flex flex-col gap-3">
          <div className="flex justify-between">
            <span className="skeleton h-3.5 w-16" />
            <span className="skeleton h-3.5 w-14" />
          </div>
          <div className="flex justify-between">
            <span className="skeleton h-3.5 w-16" />
            <span className="skeleton h-3.5 w-24" />
          </div>
        </div>
        <div className="flex justify-between items-center pt-3 mt-1 border-t border-line">
          <span className="skeleton h-5 w-14" />
          <span className="skeleton h-5 w-20" />
        </div>
      </div>
    </div>
  </div>
);

export default CheckoutSkeleton;
