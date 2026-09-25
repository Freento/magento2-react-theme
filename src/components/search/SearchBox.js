import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_AUTOCOMPLETE_RESULTS } from '../../queries/search';
import { src } from '../../lib/productImage';

const POPULAR_SEARCHES = ['Hoodie', 'Pants', 'Shorts', 'Tee', 'Tank', 'Bag'];

const SB_RESULT =
  'sb-result flex items-center gap-3 py-3 px-3.5 no-underline text-ink border-b border-line last:border-b-0 transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink';
const SB_SKEL = 'sb-skel block bg-line rounded animate-search-pulse';
const SB_STATUS = 'sb-status p-3.5 text-center text-13';
const SB_RESULT_META = 'sb-result-meta flex-1 flex flex-col justify-center gap-1.5 min-w-0';

const SearchBox = ({ onClose, autoFocus = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [focused, setFocused] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(GET_AUTOCOMPLETE_RESULTS, {
    variables: { inputText: searchTerm },
    skip: searchTerm.length < 2,
  });

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(value.length >= 2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    onClose && onClose();
  };

  const products = data?.products?.items || [];
  const showSuggestions = autoFocus || (focused && !searchTerm && !showResults);

  return (
    <div ref={searchRef} className="sb-root relative w-full">
      <form onSubmit={handleSubmit} className="sb-form flex items-center gap-2.5 h-11 px-3 border border-line rounded bg-bg transition-colors duration-fast ease-[ease] focus-within:border-ink focus-within:shadow-[0_0_0_1px_var(--ink)]">
        <svg className="sb-icon text-ink-2 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            setFocused(true);
            if (searchTerm.length >= 2) setShowResults(true);
          }}
          onBlur={() => {
            setTimeout(() => setFocused(false), 120);
          }}
          placeholder="Search products, brands, parts…"
          className="sb-input flex-1 min-w-0 h-full p-0 border-0 bg-transparent outline-none font-sans text-base leading-base text-ink placeholder:text-ink-2"
        />
        {searchTerm && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { setSearchTerm(''); setShowResults(false); inputRef.current?.focus(); }}
            className="sb-clear w-7 h-7 rounded-pill bg-transparent border-0 cursor-pointer flex items-center justify-center text-ink-2 transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </form>

      <div className="sb-results mt-3.5 bg-bg border border-line rounded max-h-[420px] overflow-y-auto">
        {searchTerm.length < 2 ? (
          <div className={`${SB_STATUS} text-ink-2`}>Type at least 2 characters to search</div>
        ) : (
          <>
            {loading && (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={`skel-${i}`} className={`${SB_RESULT} sb-result--skel pointer-events-none`} aria-hidden="true">
                  <span className={`${SB_SKEL} sb-skel--img w-12 h-12 shrink-0`} />
                  <div className={SB_RESULT_META}>
                    <span className={`${SB_SKEL} sb-skel--name w-[70%] h-3 mb-2`} />
                    <span className={`${SB_SKEL} sb-skel--price w-[24%] h-2.5`} />
                  </div>
                </div>
              ))
            )}
            {error && <div className={`${SB_STATUS} sb-status-error text-sale not-italic`}>Search error: {error.message}</div>}
            {!loading && !error && products.length === 0 && (
              <div className={`${SB_STATUS} text-ink-2`}>No products found for "{searchTerm}"</div>
            )}
            {!loading && !error && products.map((product) => (
              <Link
                key={product.id}
                to={`/${product.url_key}${product.url_suffix || ''}`}
                state={{ resolved: {
                  type: 'product',
                  id: Number(product.id),
                  path: `${product.url_key}${product.url_suffix || ''}`,
                }}}
                className={SB_RESULT}
                onClick={() => {
                  setShowResults(false);
                  onClose && onClose();
                }}
              >
                <img
                  src={src(product.thumbnail)}
                  alt={product.name}
                  className="sb-result-img w-12 h-12 shrink-0 object-cover rounded bg-surface"
                />
                <div className={SB_RESULT_META}>
                  <div className="sb-result-name text-base font-medium text-ink whitespace-nowrap overflow-hidden text-ellipsis">{product.name}</div>
                  <div className="sb-result-price text-sm font-medium text-ink-2 shrink-0">
                    ${product.price_range?.maximum_price?.final_price?.value ?? '—'}
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>

      {showSuggestions && (
        <div className="sb-popular mt-3.5 flex flex-col gap-2">
          <div className="sb-popular-label text-xs font-medium tracking-[0.12em] uppercase text-ink-2">Popular searches</div>
          <div className="sb-popular-chips flex flex-wrap gap-1.5">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                className="sb-chip inline-flex items-center text-13 font-medium py-1.5 px-3 rounded-pill bg-surface border border-line text-ink cursor-pointer transition-colors duration-fast ease-[ease] hover:border-ink hover:bg-bg"
                onClick={() => {
                  setSearchTerm(term);
                  setShowResults(true);
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;
