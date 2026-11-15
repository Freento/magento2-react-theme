import {useEffect, useState} from 'react';
import {loadCategoryRoots, getCachedRoots, findCategory} from './categoryData.js';
import {fieldInput, fieldInputCore, sliderField} from '../lib/cls.js';

// Resolve a category's total product count from the shared category tree (the
// same fetch the category picker uses — `product_count` rides along on it).
// undefined = loading, null = no category / not found, number = total.
function countForCategory(roots, categoryId) {
    if (!categoryId) return null;
    const node = findCategory(roots, categoryId);
    return node && typeof node.product_count === 'number' ? node.product_count : null;
}

export function ProductsCountField({value, categoryId, onChange}) {
    const [total, setTotal] = useState(() => {
        const roots = getCachedRoots();
        return roots ? countForCategory(roots, categoryId) : undefined;
    });

    useEffect(() => {
        if (!categoryId) {
            setTotal(null);
            return;
        }
        const roots = getCachedRoots();
        if (roots) {
            setTotal(countForCategory(roots, categoryId));
            return;
        }
        let cancelled = false;
        setTotal(undefined);
        loadCategoryRoots()
            .then((r) => {
                if (!cancelled) setTotal(countForCategory(r, categoryId));
            })
            .catch(() => {
                if (!cancelled) setTotal(null);
            });
        return () => {
            cancelled = true;
        };
    }, [categoryId]);

    const num = Number(value) > 0 ? Number(value) : 1;
    const hasRange = typeof total === 'number' && total > 0;
    const shown = hasRange ? Math.min(num, total) : num;

    const set = (v) => {
        let n = Math.round(Number(v));
        if (!Number.isFinite(n) || n < 1) n = 1;
        if (hasRange) n = Math.min(n, total);
        onChange(n);
    };

    // Category with no products.
    if (typeof total === 'number' && total === 0) {
        return <div className="products-count-empty text-[12px] text-ed-text-soft py-1">No products in this category</div>;
    }

    // No category yet, still loading, or count unavailable → plain number input.
    if (!hasRange) {
        return (
            <input
                className={fieldInput}
                type="number"
                min="1"
                value={num}
                placeholder={total === undefined ? '…' : undefined}
                onChange={(e) => set(e.target.value)}
            />
        );
    }

    return (
        <div className="products-count-field flex items-center gap-2">
            {/* Reuse the themed range from .slider-field (styled in editor.css); it
                takes the remaining width next to the number readout. */}
            <div className={`${sliderField} flex-1 min-w-0`}>
                <input
                    type="range"
                    min="1"
                    max={total}
                    step="1"
                    value={shown}
                    onChange={(e) => set(e.target.value)}
                />
            </div>
            <input
                className={`${fieldInputCore} products-count-num h-[30px] px-2 w-14 shrink-0 text-right`}
                type="number"
                min="1"
                max={total}
                value={shown}
                onChange={(e) => set(e.target.value)}
            />
            <span className="products-count-total shrink-0 text-[12px] text-ed-text-soft [font-variant-numeric:tabular-nums]">/ {total}</span>
        </div>
    );
}
