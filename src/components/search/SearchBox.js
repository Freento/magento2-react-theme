import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/search/SearchBox.less';
import { GET_AUTOCOMPLETE_RESULTS } from '../../queries/search';
import { src } from '../../lib/productImage';

const POPULAR_SEARCHES = ['Hoodie', 'Pants', 'Shorts', 'Tee', 'Tank', 'Bag'];

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
    <div ref={searchRef} className="sb-root">
      <form onSubmit={handleSubmit} className="sb-form">
        <svg className="sb-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          className="sb-input"
        />
        {searchTerm && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { setSearchTerm(''); setShowResults(false); inputRef.current?.focus(); }}
            className="sb-clear"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </form>

      <div className="sb-results">
        {searchTerm.length < 2 ? (
          <div className="sb-status">Type at least 2 characters to search</div>
        ) : (
          <>
            {loading && (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={`skel-${i}`} className="sb-result sb-result--skel" aria-hidden="true">
                  <span className="sb-skel sb-skel--img" />
                  <div className="sb-result-meta">
                    <span className="sb-skel sb-skel--name" />
                    <span className="sb-skel sb-skel--price" />
                  </div>
                </div>
              ))
            )}
            {error && <div className="sb-status sb-status-error">Search error: {error.message}</div>}
            {!loading && !error && products.length === 0 && (
              <div className="sb-status">No products found for "{searchTerm}"</div>
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
                className="sb-result"
                onClick={() => {
                  setShowResults(false);
                  onClose && onClose();
                }}
              >
                <img
                  src={src(product.thumbnail)}
                  alt={product.name}
                  className="sb-result-img"
                />
                <div className="sb-result-meta">
                  <div className="sb-result-name">{product.name}</div>
                  <div className="sb-result-price">
                    ${product.price_range?.maximum_price?.final_price?.value ?? '—'}
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>

      {showSuggestions && (
        <div className="sb-popular">
          <div className="sb-popular-label">Popular searches</div>
          <div className="sb-popular-chips">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                className="sb-chip"
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
