import React from 'react';
import PlusIcon from '../ui/icons/PlusIcon';

const CARD_BASE_CLS = 'co-address-card relative flex p-4 border rounded cursor-pointer text-sm leading-relaxed [transition:border-color_120ms_ease,background_120ms_ease] hover:border-ink hover:bg-surface focus-visible:outline-none focus-visible:border-ink focus-visible:[box-shadow:0_0_0_1px_var(--ink)]';

const CheckoutAddressCards = ({
    addresses = [],
    selectedId = null,
    onSelect = () => {},
    onNew = () => {},
    defaultFlag = 'default_shipping',
}) => (
    <div className="saved-addresses-grid grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-3 mb-4">
        {addresses.map((address) => {
            const isSelected = selectedId === address.id;
            return (
                <div
                    key={address.id}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    className={`${CARD_BASE_CLS} items-start gap-3 text-left text-ink ${isSelected ? 'selected border-ink bg-surface' : 'border-line bg-bg'}`}
                    onClick={() => onSelect(address)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect(address);
                        }
                    }}
                >
                    <div
                        className={`co-address-card-radio relative w-[18px] h-[18px] rounded-full border-[1.5px] bg-bg shrink-0 mt-0.5 [transition:border-color_120ms_ease] after:content-[''] after:absolute after:inset-0 after:m-auto after:w-2 after:h-2 after:rounded-full after:bg-ink after:[transition:transform_120ms_ease] ${isSelected ? 'border-ink after:scale-100' : 'border-line-dark after:scale-0'}`}
                        aria-hidden="true"
                    />
                    <div className="co-address-card-content flex-1 min-w-0">
                        <div className="address-card-head flex items-center gap-1.5 mb-2 text-base">
                            <strong>{address.firstname} {address.lastname}</strong>
                            {address[defaultFlag] && (
                                <span className="address-default-badge inline-block ml-2 px-2 py-0.5 rounded-sm bg-ink text-bg text-2xs font-medium tracking-eyebrow uppercase">Default</span>
                            )}
                        </div>
                        <div className="address-card-body text-sm text-ink-2 leading-relaxed">
                            <div>{address.street?.join(', ')}</div>
                            <div>{address.city}, {address.region?.region || ''} {address.postcode}</div>
                            <div>{address.country_code}</div>
                            {address.telephone && <div>Tel: {address.telephone}</div>}
                        </div>
                    </div>
                </div>
            );
        })}
        <button
            type="button"
            className={`${CARD_BASE_CLS} co-address-card--add items-center justify-center flex-col gap-2 min-h-[132px] border-line border-dashed text-ink-2 bg-transparent text-center hover:border-solid hover:text-ink`}
            onClick={onNew}
        >
            <span className="co-address-card-plus inline-flex items-center justify-center w-8 h-8 rounded-full border border-current text-[18px] leading-none" aria-hidden="true"><PlusIcon /></span>
            <span className="co-address-card-add-label text-sm font-medium tracking-[0.02em]">Add new address</span>
        </button>
    </div>
);

export default CheckoutAddressCards;
