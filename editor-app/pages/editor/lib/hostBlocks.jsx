import {useState, useEffect} from 'react';
import * as defaultBlocks from 'editor-core/blocks';

export function makeHostBlock(loader, fallbackTitle) {
    return function HostBlock(props) {
        const [Real, setReal] = useState(null);
        useEffect(() => {
            let cancelled = false;
            loader()
                .then((mod) => {
                    if (!cancelled) setReal(() => mod.default);
                })
                .catch((err) => console.error(`[${fallbackTitle} block] load failed:`, err));
            return () => {
                cancelled = true;
            };
        }, []);
        if (!Real) {
            return (
                <div style={{
                    padding: 24,
                    border: '1px dashed #c7d2fe',
                    borderRadius: 8,
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: 13
                }}>
                    Loading {fallbackTitle}…
                </div>
            );
        }
        return <Real {...props} />;
    };
}

const HostProductsCarousel = makeHostBlock(() => import('@host/components/catalog/ProductsCarousel'), 'Products Carousel');
const HostNewsletterForm = makeHostBlock(() => import('@host/components/layout/NewsletterForm'), 'Newsletter Form');
const HostContactForm = makeHostBlock(() => import('@host/components/contact/ContactForm'), 'Contact Form');

export const allBlocks = {
    ...defaultBlocks,
    ProductsCarousel: HostProductsCarousel,
    NewsletterForm: HostNewsletterForm,
    ContactForm: HostContactForm,
};

export const DEVICE_WIDTHS = {desktop: null, tablet: 1024, mobile: 375};
export const deviceChain = (device) =>
    device === 'mobile' ? ['tablet', 'mobile'] : device === 'tablet' ? ['tablet'] : [];
